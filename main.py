from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import requests
import re
from typing import Optional, List, Dict
import json
import openai
import os
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from services.ai_analysis import analyze_ticket, process_image, load_general_criteria
import bcrypt
import mysql.connector


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

# API URLs y configuración
API_BASE_URL = os.getenv("API_BASE_URL")  # API de Azure DevOps
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Obtener los valores de las variables de entorno
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# Conectar a la base de datos
def get_db_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

# Obtener el hash de la contraseña del usuario
def get_user_password_hash(username: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result[0] if result else None

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
    
    # Remover atributos (excepto 'href' en enlaces)
    for tag in soup.find_all(True):
        allowed_attrs = ['href'] if tag.name == 'a' else []
        attrs_to_remove = [attr for attr in tag.attrs if attr not in allowed_attrs]
        for attr in attrs_to_remove:
            del tag[attr]

    # Convertir <br> en saltos de línea
    for br in soup.find_all(['br']):
        br.replace_with('\n' + br.text)

    # Convertir <div> en <p>
    for div in soup.find_all('div'):
        div.name = 'p'

    # Asegurar formato adecuado en listas
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

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Verifica si el usuario existe
    stored_password_hash = get_user_password_hash(form_data.username)

    if not stored_password_hash:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    # Compara la contraseña ingresada con el hash almacenado
    if bcrypt.checkpw(form_data.password.encode(), stored_password_hash.encode()):
        return {"message": "Inicio de sesión exitoso"}
    else:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

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

        # Procesar cada User Story en la data
        for item in data:

            item['description'] = clean_html_content(item.get('description', ''))
            item['acceptance_criteria'] = clean_html_content(item.get('acceptance_criteria', ''))

            # Extraer IDs de los childs usando expresión regular
            child_links = item.get('child_links', [])
            child_ids = [match.group(1) for link in child_links if (match := re.search(r'/workItems/(\d+)', link))]

            # Inicializar la lista de child work items para cada item
            item['child_work_items'] = []

            # Agregar debug para ver si hay child IDs
            if not child_ids:
                print(f"No hay child IDs para la User Story {item['id']}")

            for child_id in child_ids:
                child_url = f"{API_BASE_URL}/wit/workItems/{child_id}?api-version=6.0"
                child_response = requests.get(child_url)
                
                if child_response.status_code == 200:
                    child_data = child_response.json()
                    fields = child_data.get("fields", {})

                    child_item = {
                        "id": child_data.get("id"),
                        "title": fields.get("System.Title", "Sin título"),
                        "state": fields.get("System.State", "Desconocido"),
                        "work_item_type": fields.get("System.WorkItemType", "Tarea"),
                        "estimated_hours": fields.get("Microsoft.VSTS.Scheduling.OriginalEstimate", 0),
                        "completed_hours": fields.get("Microsoft.VSTS.Scheduling.CompletedWork", 0),
                        "work_item_url": f"{API_BASE_URL}/_workitems/edit/{child_data.get('id')}" if child_data.get("id") else "N/A"
                    }

                    print(f"Child encontrado para {item['id']}: {child_item}")
                    item['child_work_items'].append(child_item)

                else:
                    print(f"No se pudo obtener el child {child_id} para User Story {item['id']}")
                    item['child_work_items'].append({
                        "id": child_id,
                        "error": "No se pudo obtener la información del child",
                        "work_item_url": "N/A"
                    })

        # Filtrar los work items utilizando la función externa
        filtered_data = filter_work_items(data)

        # 🔴 Verificar si la filtración está eliminando `child_work_items`
        for i, item in enumerate(filtered_data[:3]):  # Mostramos los primeros 3 resultados
            print(f"Final User Story {i + 1}: {item}")

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
    """
    Endpoint para analizar un ticket usando IA. Se pueden adjuntar imágenes y un link de Figma.
    """
    try:
        # Convertir el string JSON a diccionario
        ticket_data = json.loads(ticket)
        if not ticket_data.get('description') and not ticket_data.get('acceptance_criteria'):
            raise HTTPException(status_code=400, detail="Ticket requires description or acceptance criteria")

        general_criteria = load_general_criteria()
        
        # Procesar las imágenes si fueron provistas
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

        # Agregar el link de Figma si fue proporcionado
        if figma_link:
            ticket_data["figma_link"] = figma_link

        # Analizar el ticket utilizando la función externa
        analysis_result = analyze_ticket(
            ticket_data=ticket_data,
            images=images,
            general_criteria=general_criteria
        )

        return {"status": "success", "criteria": analysis_result}

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid ticket data format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mark-user-story-checked/{work_item_id}")
async def mark_user_story_checked(work_item_id: int):
    """
    Marca una User Story como revisada agregándole el tag 'US Checked'.
    """
    try:
        url = f"{API_BASE_URL}/api/v1/workitems/{work_item_id}/update-tags"
        payload = {"tags": ["US Checked"]}
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return {"status": "success", "message": "User story marked as checked"}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


