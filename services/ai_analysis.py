import os
import io
import base64
import json
import logging
from dotenv import load_dotenv
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException
from bs4 import BeautifulSoup
from PIL import Image
from langdetect import detect, LangDetectException
from openai import OpenAI
from openai import APIError, APIConnectionError, AuthenticationError, RateLimitError, BadRequestError

# Load the OpenAI API key from the environment variable
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Validate OpenAI API key
if not OPENAI_API_KEY:
    print("Warning: OPENAI_API_KEY not found in environment variables")
else:
    # Configurar cliente
    client = OpenAI(api_key=OPENAI_API_KEY)

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_image(image_content: bytes) -> Optional[str]:
    """
    Procesa la imagen y la convierte a una cadena codificada en base64.
    """
    try:
        # Abrir la imagen con PIL
        img = Image.open(io.BytesIO(image_content))
        # Convertir a formato compatible
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        # Redimensionar manteniendo relación de aspecto
        max_size = (1024, 1024)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Optimizar para calidad y tamaño
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=85, optimize=True)
        # Convertir a base64
        return base64.b64encode(buffered.getvalue()).decode('utf-8')
    except Exception as e:
        logger.error(f"Error procesando imagen: {str(e)}")
        return None

def load_general_criteria() -> Optional[Dict]:
    """
    Carga los criterios generales desde un archivo JSON ubicado en el mismo directorio.
    """
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_dir, 'general_criteria.json')
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading general criteria: {e}")
        return None

def extract_existing_criteria(ticket_data: Dict) -> List[str]:
    """
    Extrae los criterios de aceptación existentes del ticket.
    """
    raw_criteria = BeautifulSoup(ticket_data.get('acceptance_criteria', ''), 'html.parser').get_text()
    return [line.strip('-* ').strip() for line in raw_criteria.split('\n') if line.strip()]

def prepare_analysis_prompt(
    ticket_data: Dict, 
    general_criteria: Optional[Dict] = None, 
    images: Optional[List] = None
) -> Tuple[str, str]:
    """
    Prepara el prompt para el análisis combinando los datos del ticket, los criterios generales y las imágenes.
    """
    # Limpieza segura de campos
    def clean_text(text: Optional[str]) -> str:
        if text is None:
            return ""
        return BeautifulSoup(str(text), 'html.parser').get_text().strip()

    # Se limpia el HTML de la descripción y se extraen los criterios existentes.
    description = clean_text(ticket_data.get('description'))
    existing_criteria = extract_existing_criteria(ticket_data)
    
    # Detectar el idioma (se usa español por defecto en caso de fallo)
    try:
        language = detect(description) if description else 'es'
    except LangDetectException:
        language = 'es'
    
    criteria_context = ""
    if general_criteria:
        criteria_context = "Criterios generales a considerar:\n" if language == 'es' else "General criteria to consider:\n"
        for category in general_criteria.get("criteria", []):
            criteria_context += f"\n{category.get('category', '')}:\n"
            for rule in category.get("rules", []):
                if rule not in existing_criteria:
                    criteria_context += f"- {rule}\n"
    
    images_info = ""
    if images:
        if language == 'es':
            images_info = f"Se han proporcionado {len(images)} imágenes adjuntas para análisis.\n"
        else:
            images_info = f"{len(images)} attached images provided for analysis.\n"
    
    prompt_intro = "Analiza esta historia de usuario para verificar su completitud y coherencia" if language == 'es' \
                   else "Analyze this user story for completeness and coherence"
    
    base_prompt = f"""{prompt_intro}:

Título: {ticket_data.get('title', '')}
Descripción: {description}
Criterios de Aceptación Actuales: {', '.join(existing_criteria)}

{criteria_context}

{images_info}

{'IMPORTANTE: Estructura tu respuesta en dos secciones principales:' if language == 'es' else 'IMPORTANT: Structure your response in two main sections:'}

1. {'Criterios de Aceptación Faltantes:' if language == 'es' else 'Missing Acceptance Criteria:'}
   - {'Lista de criterios de aceptación esenciales que aún no han sido mencionados' if language == 'es' else 'List of essential acceptance criteria that have not yet been mentioned'}
   - {'Cada criterio debe comenzar con un guión (-)' if language == 'es' else 'Each criterion should start with a dash (-)'}

2. {'Sugerencias Generales:' if language == 'es' else 'General Suggestions:'}
   - {'Mejoras de claridad' if language == 'es' else 'Clarity improvements'}
   - {'Consideraciones de usabilidad' if language == 'es' else 'Usability considerations'}
   - {'Validaciones de campos' if language == 'es' else 'Field validations'}
   - {'Componentes reutilizables' if language == 'es' else 'Reusable components'}
   - {'Otras recomendaciones' if language == 'es' else 'Other recommendations'}

{'IMPORTANTE: Proporciona tu análisis y recomendaciones en español.' if language == 'es' else 'IMPORTANT: Provide your analysis and recommendations in English.'}
"""
    return base_prompt, language

def parse_analysis_response(analysis: str, language: str) -> Dict:
    """
    Parsea la respuesta del análisis de la IA en secciones estructuradas.
    """
    sections = {
        'es': {
            'criteria': 'Criterios de Aceptación Faltantes:',
            'suggestions': 'Sugerencias Generales:'
        },
        'en': {
            'criteria': 'Missing Acceptance Criteria:',
            'suggestions': 'General Suggestions:'
        }
    }
    
    missing_criteria = []
    general_suggestions = []
    current_section = None
    
    for line in analysis.split('\n'):
        line = line.strip()
        if not line:
            continue
        
        # Detectar cambio de sección
        if sections[language]['criteria'] in line:
            current_section = 'criteria'
            continue
        elif sections[language]['suggestions'] in line:
            current_section = 'suggestions'
            continue

        # Agregar ítems manteniendo formato pero limpiando marcadores de lista
        if any(line.startswith(c) for c in ('- ', '* ', '--', '• ')):
            cleaned_line = line.lstrip('-• ')  # Elimina todos los símbolos de lista iniciales
            cleaned_line = cleaned_line.strip()
            
            if current_section == 'criteria':
                missing_criteria.append(cleaned_line)
            elif current_section == 'suggestions':
                general_suggestions.append(cleaned_line)
    
    return {
        "analysis": analysis,
        "suggestedCriteria": missing_criteria,
        "generalSuggestions": general_suggestions,
        "requiresRevision": len(missing_criteria) > 0 or len(general_suggestions) > 0
    }

def analyze_ticket(
    ticket_data: Dict, 
    images: Optional[List[Dict]] = None, 
    general_criteria: Optional[Dict] = None
) -> Dict:
    """
    Analiza el ticket usando GPT-4 de OpenAI.
    """
    # Validar que el ticket tenga contenido para analizar
    ticket_data = {
        'title': ticket_data.get('title', 'Sin título'),
        'description': ticket_data.get('description', ''),
        'acceptance_criteria': ticket_data.get('acceptance_criteria', ''),
        **ticket_data  # Mantener cualquier otro campo
    }

    # Validación con manejo seguro de None
    has_content = any([
        bool(str(ticket_data['description']).strip()),
        bool(str(ticket_data['acceptance_criteria']).strip()),
        bool(images)
    ])
    
    if not has_content:
        raise HTTPException(
            status_code=400,
            detail="Se requiere descripción, criterios de aceptación o imágenes"
        )
    
    # Extraer la cadena base64 de cada imagen (si se enviaron)
    base64_images = []
    if images:
        for img in images:
            if 'base64' in img:
                base64_images.append(img['base64'])
    
    # Preparar el prompt y detectar el idioma
    base_prompt, language = prepare_analysis_prompt(ticket_data, general_criteria, base64_images)
    
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert in user story analysis and software requirements. "
                "Focus on providing actionable, specific feedback and ensure all field validations "
                "and usability standards are met. Structure your response in two clear sections:\n"
                "1. Missing Acceptance Criteria\n"
                "2. General Suggestions\n"
                "Respond in the same language as the user story."
            )
        },
        {
            "role": "user",
            "content": base_prompt
        }
    ]
    
    # Si hay imágenes pero no texto, ajustamos el prompt
    if base64_images and not ticket_data['description'].strip() and not ticket_data['acceptance_criteria'].strip():
        messages[1]["content"] = (
            f"Analiza esta imagen de un ticket de usuario para generar criterios de aceptación y sugerencias:\n\n"
            f"Título: {ticket_data.get('title', '')}\n\n"
            "IMPORTANTE: Estructura tu respuesta en dos secciones principales:\n\n"
            "1. Criterios de Aceptación Sugeridos:\n"
            "   - Lista de criterios de aceptación basados en la imagen\n"
            "   - Cada criterio debe comenzar con un guión (-)\n\n"
            "2. Sugerencias Generales:\n"
            "   - Mejoras de claridad\n"
            "   - Consideraciones de usabilidad\n"
            "   - Validaciones de campos\n"
            "   - Componentes reutilizables\n"
            "   - Otras recomendaciones\n\n"
            "Proporciona tu análisis en español."
        )

    # Agregar imágenes
    if base64_images:
        # Convertir el content del user message a una lista
        messages[1]["content"] = [
            {"type": "text", "text": base_prompt}
        ]
        
        for img in base64_images:
            messages[1]["content"].append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{img}"
                }
            })

    # Agregar prompt de usuario
    messages[1]["content"] = [{"type": "text", "text": base_prompt}]
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        analysis = response.choices[0].message.content
        return parse_analysis_response(analysis, language)

    except APIConnectionError as e:
        raise HTTPException(500, f"Error de conexión con OpenAI: {str(e)}")
    except RateLimitError as e:
        raise HTTPException(429, f"Límite de tasa excedido: {str(e)}")
    except AuthenticationError as e:
        raise HTTPException(401, f"Error de autenticación de OpenAI: {str(e)}")
    except BadRequestError as e:
        raise HTTPException(400, f"Solicitud inválida: {str(e)}")
    except APIError as e:
        raise HTTPException(500, f"Error de API: {str(e)}")
    except Exception as e:
        logger.error(f"Error inesperado: {str(e)}")
        raise HTTPException(500, "Error interno del servidor")