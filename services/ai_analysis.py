import os
import io
import base64
import json
import logging
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException
from bs4 import BeautifulSoup
from PIL import Image
from langdetect import detect, LangDetectException
import openai

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
        original_format = img.format
        # Se usa PNG para formatos sin pérdida o GIF; sino JPEG.
        save_format = 'PNG' if original_format in ['PNG', 'GIF'] else 'JPEG'
        # Convertir a RGB si es necesario
        if img.mode != 'RGB':
            img = img.convert('RGB')
        # Redimensionar si es muy grande (máximo 1024x1024)
        max_size = (1024, 1024)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        # Guardar la imagen en memoria
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format=save_format, quality=85)
        img_byte_arr = img_byte_arr.getvalue()
        # Convertir a base64
        return base64.b64encode(img_byte_arr).decode('utf-8')
    except Exception as e:
        logger.error(f"Error processing image: {e}")
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
    # Se limpia el HTML de la descripción y se extraen los criterios existentes.
    description = BeautifulSoup(ticket_data.get('description', ''), 'html.parser').get_text()
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
        images_info = "Se han proporcionado imágenes relevantes para el análisis.\n" if language == 'es' else "Relevant images have been provided for analysis.\n"
    
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
        
        # Agregar ítems a la sección correspondiente
        if line.startswith('- ') or line.startswith('* '):
            if current_section == 'criteria':
                missing_criteria.append(line[2:].strip())
            elif current_section == 'suggestions':
                general_suggestions.append(line[2:].strip())
    
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
    description = ticket_data.get('description', '').strip()
    acceptance_criteria = ticket_data.get('acceptance_criteria', '').strip()
    if not description and not acceptance_criteria:
        raise HTTPException(status_code=400, detail="El ticket no tiene descripción ni criterios de aceptación para analizar")
    
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
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        analysis = response.choices[0].message.content
        return parse_analysis_response(analysis, language)
    except openai.APIError as e:
        raise HTTPException(status_code=500, detail=f"Error de API de OpenAI: {str(e)}")
    except openai.APIConnectionError as e:
        raise HTTPException(status_code=500, detail=f"Error de conexión con OpenAI: {str(e)}")
    except openai.RateLimitError as e:
        raise HTTPException(status_code=429, detail=f"Límite de API de OpenAI excedido: {str(e)}")
    except openai.AuthenticationError as e:
        raise HTTPException(status_code=401, detail=f"Error de autenticación de OpenAI: {str(e)}")
    except openai.BadRequestError as e:
        detail_msg = f"Solicitud incorrecta a la API de OpenAI: {str(e)}" if language == 'es' else f"Bad request to OpenAI API: {str(e)}"
        raise HTTPException(status_code=400, detail=detail_msg)
    except Exception as e:
        logger.error(f"Unexpected error in analyze_ticket: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
