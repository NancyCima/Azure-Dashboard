from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import requests
from typing import Optional, List
import json
import os
from dotenv import load_dotenv
from services.ai_analysis import analyze_ticket, process_image, load_general_criteria
import bcrypt
from mysql.connector import pooling
from functools import lru_cache
from pydantic import BaseModel

class AsignadosRequest(BaseModel):
    asignados: List[str] = None

load_dotenv()

app = FastAPI(
    title="Azure DevOps Dashboard API",
    description="API para gestionar y analizar User Stories de Azure DevOps con IA",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://azure-dashboard-fe-1.onrender.com",
    "https://azure-dashboard-fe.onrender.com",
    "http://azure-dashboard-fe-1.onrender.com",
    "http://azure-dashboard-fe.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Centralizar configuración
class Settings:
    # API URLs y configuración
    API_BASE_URL = os.getenv("API_BASE_URL")  # API de Azure DevOps

    # Obtener los valores de las variables de entorno
    DB_HOST = os.getenv("DB_HOST")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME")
    
settings = Settings()

# Conectar a la base de datos
connection_pool = pooling.MySQLConnectionPool(
    pool_name="auth_pool",
    pool_size=5,
    host="rds-mysql-dev.ch7yo6tzxi4l.us-east-1.rds.amazonaws.com",
    user="user",
    password="Asap.2025!@",
    database="dbProjectsManagement"

    # host=settings.DB_HOST,
    # user=settings.DB_USER,
    # password=settings.DB_PASSWORD,
    # database=settings.DB_NAME    
)

def get_db_connection():
    return connection_pool.get_connection()

# Obtener el hash de la contraseña del usuario
@lru_cache(maxsize=100) # Caché para evitar sobrecargar la base de datos
def get_user_password_hash(username: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result[0] if result else None

@app.get("/", 
    summary="Endpoint raíz",
    description="Retorna un mensaje de bienvenida",
    tags=["General"]
)
async def root():
    return {"message": "Bienvenido a la API de la nueva aplicación"}

@app.post("/login",
    summary="Autenticación de usuario",
    description="Verifica las credenciales del usuario y permite el acceso al sistema",
    response_description="Retorna un mensaje de éxito si la autenticación es correcta",
    tags=["Autenticación"]

)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Verifica si el usuario existe
    stored_password_hash = get_user_password_hash(form_data.username)

    if not stored_password_hash:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    # Compara la contraseña ingresada con el hash almacenado
    if bcrypt.checkpw(
        form_data.password.encode('utf-8'),  # Contraseña ingresada
        stored_password_hash.encode('utf-8')  # Hash almacenado
    ):
        return {"message": "Inicio de sesión exitoso"}
    else:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

@app.get("/workitems")
async def get_work_items(state: str = None):
    """
    Endpoint para consumir work items desde la API.
    """
    try:
        # Realiza una solicitud GET al endpoint de la API
        url = f"{settings.API_BASE_URL}/azure-workitems?elementosPorPagina=10000&ignorarBorrados=true"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()

        # Obtiene los work items
        work_items = data.get('workItems', [])
        
        if state:
            work_items = [item for item in work_items if item.get("state") == state]
        
        return work_items

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/total-reales-por-asignados")
async def post_totales_reales_por_asignados(request_data: AsignadosRequest):
    """
    Endpoint para obtener totales reales por usuarios asignados.
    """
    try:
        asignados = request_data.asignados

        asignadosSeparadosXComa = ','.join(asignados) if asignados else ""
        # Realiza una solicitud GET al endpoint de la API
        url = f"{settings.API_BASE_URL}/azure-workitems?elementosPorPagina=10000&ignorarBorrados=true&asignados={asignadosSeparadosXComa}"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()

        # Obtiene los work items
        work_items = data.get('workItems', [])

        EXCLUDED_TYPES = {"User Story", "Bug", "Feature", "Technical Debt", "poc"}

        sum_completed_hours = 0
        for item in work_items:
            completed = item.get("completed_hours")
            tipo = item.get("type")
            if completed and completed is not None and completed != "" and completed != "None" and completed > 0 and tipo not in EXCLUDED_TYPES:
                sum_completed_hours += completed

        return sum_completed_hours

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
        # Parseo seguro con valores por defecto
        ticket_data = {
            'title': ticket_data.get('title', ''),
            'description': ticket_data.get('description', ''),
            'acceptance_criteria': ticket_data.get('acceptance_criteria', ''),
            **ticket_data
        }

        # Validación temprana
        if not any([
            str(ticket_data['description']).strip(),
            str(ticket_data['acceptance_criteria']).strip(),
            files
        ]):
            raise HTTPException(
                status_code=400,
                detail="Se requiere al menos: descripción, criterios de aceptación o imágenes"
            )

        general_criteria = load_general_criteria()
        
        # Procesar las imágenes si fueron provistas
        images = []
        if files:
            for file in files:
                if file.content_type not in ['image/jpeg', 'image/png', 'image/gif', 'image/webp']:
                    raise HTTPException(400, f"Formato no válido: {file.filename}")
                
                if file.size > 5 * 1024 * 1024:  # 5MB
                    raise HTTPException(400, f"Imagen demasiado grande: {file.filename}")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)