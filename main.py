from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import requests
from typing import Optional
import json
import openai
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from bs4 import BeautifulSoup
import re

load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API URLs
API_BASE_URL = "http://localhost:8080"  # Azure DevOps API
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def clean_html_content(html_content: str) -> str:
    """
    Limpia el contenido HTML manteniendo la estructura pero removiendo estilos y atributos innecesarios.
    Si el contenido es vacío o irrelevante, devuelve una cadena vacía.
    """
    if not html_content or html_content.strip() in ["No disponible", "", "<div></div>", "<br>"]:
        return ""
    
    # Usar BeautifulSoup para parsear el HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remover todos los atributos de estilo y clases
    for tag in soup.find_all(True):
        # Conservar solo los atributos necesarios
        allowed_attrs = ['href'] if tag.name == 'a' else []
        # Crear una lista de atributos a eliminar
        attrs_to_remove = [attr for attr in tag.attrs if attr not in allowed_attrs]
        # Eliminar los atributos
        for attr in attrs_to_remove:
            del tag[attr]

    # Reemplazar <br> con saltos de línea
    for br in soup.find_all(['br']):
        br.replace_with('\n' + br.text)

    # Convertir divs a párrafos para mejor semántica
    for div in soup.find_all('div'):
        div.name = 'p'

    # Asegurar que las listas estén bien formateadas
    for ul in soup.find_all('ul'):
        # Remover espacios en blanco excesivos en items de lista
        for li in ul.find_all('li'):
            li.string = li.get_text().strip()
    
    # Remover líneas vacías múltiples
    html = str(soup)
    html = re.sub(r'\n\s*\n', '\n', html)
    
    return html
    
def filter_work_items(data):
    """
    Filtra los work items según las reglas definidas.
    - Excluye User Stories con el tag 'US New'.
    - Excluye work items que dependen de User Stories con el tag 'US New'.
    """
    # Identificar las user stories con tag "US New"
    us_new_ids = {item['id'] for item in data 
                  if item['work_item_type'] == 'User Story' and item.get('tags') == 'US New'}

    # Filtrar los work items
    filtered_data = []
    for item in data:
        # Si es una user story, incluirla solo si no tiene el tag "US New"
        if item['work_item_type'] == 'User Story':
            if item.get('tags') != 'US New':
                filtered_data.append(item)
        # Si no es una user story, incluirlo solo si no depende de una user story con tag "US New"
        else:
            dependencies = item.get('dependencies', [])
            if not any(dep_id in us_new_ids for dep_id in dependencies):
                filtered_data.append(item)

    return filtered_data


@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de la nueva aplicación"}

@app.get("/workitems")
async def get_work_items(state: str = None):
    """
    Endpoint para consumir work items desde la API.
    """
    try:
        # Realiza una solicitud GET al endpoint de la API
        url = f"{API_BASE_URL}/api/v1/workitems/work-items"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()

        # Limpiar el HTML en la descripción y criterios de aceptación
        for item in data:
            item['description'] = clean_html_content(item.get('description', ''))
            item['acceptance_criteria'] = clean_html_content(item.get('acceptance_criteria', ''))

        # Filtrar los work items utilizando la función externa
        filtered_data = filter_work_items(data)
        
        if state:
            filtered_data = [item for item in filtered_data if item.get("state") == state]
        
        return filtered_data

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

@app.get("/userstories")
async def get_user_stories():
    """
    Endpoint para obtener solo User Stories desde la API,
    filtrando aquellas que tienen el campo 'description' vacío,
    'acceptance_criteria' vacío o ambos vacíos.
    """
    try:
        url = f"{API_BASE_URL}/api/v1/workitems/work-items"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()

        # Filtrar solo User Stories
        user_stories = [
            item for item in data
            if item.get("work_item_type") == "User Story"
        ]
        
        # Función para determinar si un campo está vacío
        def is_empty(value):
            """
            Determina si un campo está vacío.
            Considera nulo, string vacío, espacios, HTML vacío o valores irrelevantes como "No disponible".
            """
            if not value:
                return True
            cleaned_value = value.strip()
            return cleaned_value in ["", "<div></div>", "<br>", "No disponible"]

        # Limpieza de los campos y evaluación
        for story in user_stories:
            original_description = story.get('description', '')
            original_criteria = story.get('acceptance_criteria', '')

            # Limpiar los campos
            story['description'] = clean_html_content(original_description)
            story['acceptance_criteria'] = clean_html_content(original_criteria)



        # Filtrar User Stories incompletas
        filtered_user_stories = [
            story for story in user_stories
            if is_empty(story['description']) or is_empty(story['acceptance_criteria'])
        ]

        return filtered_user_stories

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import openai
import os
from dotenv import load_dotenv
from typing import List, Optional
import base64
import uuid

load_dotenv()

# Configuración de OpenAI para GPT-4o-mini
openai.api_key = os.getenv("OPENAI_API_KEY")

class ImageMetadata:
    def __init__(self, work_item_id, filename, base64_content, figma_link=None):
        self.id = str(uuid.uuid4())
        self.work_item_id = work_item_id
        self.filename = filename
        self.base64_content = base64_content
        self.figma_link = figma_link

# Almacenamiento temporal de imágenes (sustituir con base de datos en producción)
UPLOADED_IMAGES = {}

@app.post("/upload-images/{work_item_id}")
async def upload_images(
    work_item_id: int, 
    files: List[UploadFile] = File(None),
    figma_link: Optional[str] = Form(None)
):
    """
    Endpoint para subir imágenes relacionadas a un work item.
    """
    try:
        uploaded_images = []
        for file in files:
            # Leer y codificar imagen
            image_content = await file.read()
            base64_image = base64.b64encode(image_content).decode('utf-8')
            
            # Crear metadatos de imagen
            image_metadata = ImageMetadata(
                work_item_id=work_item_id, 
                filename=file.filename, 
                base64_content=base64_image,
                figma_link=figma_link
            )
            
            # Almacenar imagen
            UPLOADED_IMAGES[image_metadata.id] = image_metadata
            
            uploaded_images.append({
                "id": image_metadata.id,
                "filename": file.filename
            })

        return {
            "work_item_id": work_item_id,
            "images": uploaded_images,
            "figma_link": figma_link
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/images/{work_item_id}")
async def get_images_for_work_item(work_item_id: int):
    """
    Obtener imágenes asociadas a un work item.
    """
    work_item_images = [
        img for img in UPLOADED_IMAGES.values() 
        if img.work_item_id == work_item_id
    ]
    return work_item_images

def analyze_ticket_with_gpt_4o_mini(ticket_data: dict, images: List[dict] = None) -> dict:
    """
    Analizar ticket con GPT-4o-mini, considerando imágenes opcionales.
    """
    try:
        # Preparar prompt para análisis
        messages = [
            {
                "role": "system", 
                "content": """Analiza la coherencia, completitud y calidad de una historia de usuario. 
                Evalúa:
                - Claridad de descripción
                - Completitud de criterios de aceptación
                - Alineación con estándares de usabilidad
                - Sugerencias de mejora"""
            },
            {
                "role": "user", 
                "content": [
                    {"type": "text", "text": f"""Analiza la siguiente historia de usuario:
                    Título: {ticket_data.get('title', 'Sin título')}
                    Descripción: {ticket_data.get('description', 'Sin descripción')}
                    Criterios de Aceptación: {ticket_data.get('acceptance_criteria', 'Sin criterios')}
                    """}
                ]
            }
        ]

        # Agregar imágenes si están disponibles
        if images:
            for img in images:
                messages[1]["content"].append({
                    "type": "image_base64", 
                    "image_base64": img['base64_content']
                })

        # Llamar a GPT-4o-mini
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=300
        )

        analysis_result = response.choices[0].message.content

        return {
            "analysis": analysis_result,
            "suggested_criteria": _extract_suggested_criteria(analysis_result)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mark-user-story-checked/{work_item_id}")
async def mark_user_story_checked(work_item_id: int):
    """
    Marcar una historia de usuario como revisada añadiendo el tag 'US Checked'.
    """
    try:
        # En un escenario real, esto requeriría interacción con la API de Azure DevOps
        url = f"{API_BASE_URL}/api/v1/workitems/{work_item_id}/update-tags"
        payload = {
            "tags": ["US Checked"]
        }
        response = requests.post(url, json=payload)
        response.raise_for_status()

        return {"status": "success", "message": "Historia marcada como revisada"}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))

def _extract_suggested_criteria(analysis_text: str) -> List[str]:
    """
    Extraer criterios sugeridos del texto de análisis.
    """
    # Lógica simplificada de extracción de criterios
    lines = analysis_text.split('\n')
    suggested_criteria = [
        line.strip() for line in lines 
        if line.strip().startswith('- ') or line.strip().startswith('* ')
    ]
    return suggested_criteria


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)