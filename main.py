from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import re
from typing import Optional, List, Dict
import json
import openai
import os
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from services.ai_analysis import analyze_ticket, process_image, load_general_criteria

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
API_BASE_URL = os.getenv("API_BASE_URL") # Azure DevOps API
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Validate OpenAI API key
if not OPENAI_API_KEY:
    print("Warning: OPENAI_API_KEY not found in environment variables")
else:
    openai.api_key = OPENAI_API_KEY

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

        # Aplica el filtro general de `filter_work_items`
        filtered_data = filter_work_items(data)

        # Filtrar solo User Stories
        user_stories = [
            item for item in filtered_data
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


@app.get("/tickets")
async def get_incomplete_tickets():
    try:
        url = f"{API_BASE_URL}/api/v1/workitems/work-items"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()

        # Aplica el filtro general de `filter_work_items`
        filtered_data = filter_work_items(data)

        # Filtrar tickets que no son User Stories
        tickets = [
            {
                "id": item.get("id"),
                "title": item.get("title"),
                "state": item.get("state"),
                "estimatedHours": (
                    float(item.get("estimated_hours")) 
                    if isinstance(item.get("estimated_hours"), (int, float)) 
                    else item.get("estimated_hours", "No disponible")
                ),
                "completedHours": (
                    float(item.get("completed_hours")) 
                    if isinstance(item.get("completed_hours"), (int, float)) 
                    else item.get("completed_hours", "No disponible")
                ),
                "description": item.get("description", "").strip(),
                "work_item_url": item.get("work_item_url")
            }
            for item in filtered_data
            if item.get("work_item_type") != "User Story"
        ]

        return tickets

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

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
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-ticket")
async def analyze_ticket_endpoint(
    ticket: str = Form(...),
    files: List[UploadFile] = File(None),
    figma_link: Optional[str] = Form(None)
):
    """Endpoint para analizar un ticket usando IA. 
    Sugiere criterios de aceptación y mejoras para el ticket, con opcion de adjuntar imagenes y link a Figma"""
    try:
        # Validate ticket data early
        ticket_data = json.loads(ticket)
        if not ticket_data.get('description') and not ticket_data.get('acceptance_criteria'):
            raise HTTPException(status_code=400, detail="Ticket requires description or acceptance criteria")

        general_criteria = load_general_criteria()
        
        # Process images if provided
        images = []
        if files:
            for file in files:
                content = await file.read()
                base64_img = process_image(content)
                if base64_img:
                    images.append({
                        "filename": file.filename,
                        "base64": base64_img
                    })

        # Add Figma link to context if provided
        if figma_link:
            ticket_data["figma_link"] = figma_link

        # Perform analysis
        analysis_result = analyze_ticket(
            ticket_data=ticket_data,
            images=images,
            general_criteria=general_criteria
        )

        return {
            "status": "success",
            "criteria": analysis_result
        }

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid ticket data format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/mark-user-story-checked/{work_item_id}")
async def mark_user_story_checked(work_item_id: int):
    """Mark a user story as checked by adding the 'US Checked' tag"""
    try:
        url = f"{API_BASE_URL}/api/v1/workitems/{work_item_id}/update-tags"
        payload = {
            "tags": ["US Checked"]
        }
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return {"status": "success", "message": "User story marked as checked"}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
