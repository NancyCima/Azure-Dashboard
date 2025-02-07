from fastapi import HTTPException
from bs4 import BeautifulSoup
from typing import Dict, List
import openai
from openai import OpenAI
from langdetect import detect
import io
from PIL import Image
import base64
import json
import os

client = OpenAI()

def process_image(image_content: bytes) -> str:
    """Process and convert image to base64"""
    try:
        img = Image.open(io.BytesIO(image_content))

        if img.mode != 'RGB':
            img = img.convert('RGB')

        max_size = (1024, 1024)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)

        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=85)
        img_byte_arr = img_byte_arr.getvalue()

        return base64.b64encode(img_byte_arr).decode('utf-8')
    except Exception as e:
        print(f"Error processing image: {e}")
        return None

def load_general_criteria():
    """Load general criteria from JSON file"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_dir, 'general_criteria.json')

        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading general criteria: {e}")
        return None

def extract_existing_criteria(ticket_data: Dict) -> List[str]:
    """Extract existing acceptance criteria from the ticket"""
    raw_criteria = BeautifulSoup(ticket_data.get('acceptance_criteria', ''), 'html.parser').get_text()
    return [line.strip('-* ').strip() for line in raw_criteria.split('\n') if line.strip()]

def prepare_analysis_prompt(ticket_data: Dict, general_criteria: Dict = None, images: List[str] = None) -> tuple[str, str]:
    """Prepare the analysis prompt based on ticket data, general criteria, and images"""
    description = BeautifulSoup(ticket_data['description'], 'html.parser').get_text()
    existing_criteria = extract_existing_criteria(ticket_data)

    language = detect(description)

    criteria_context = ""
    if general_criteria:
        criteria_context = "Criterios generales a considerar:\n" if language == 'es' else "General criteria to consider:\n"
        for category in general_criteria["criteria"]:
            criteria_context += f"\n{category['category']}:\n"
            for rule in category["rules"]:
                if rule not in existing_criteria:  # Evita repetir criterios existentes
                    criteria_context += f"- {rule}\n"

    images_info = ""
    if images:
        images_info = "Se han proporcionado imágenes relevantes para el análisis.\n" if language == 'es' else "Relevant images have been provided for analysis.\n"

    base_prompt = f"""{'Analiza esta historia de usuario para verificar su completitud y coherencia' if language == 'es' else 'Analyze this user story for completeness and coherence'}:

Título: {ticket_data['title']}
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
    """Parse the analysis response into structured sections"""
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

        if sections[language]['criteria'] in line:
            current_section = 'criteria'
            continue
        elif sections[language]['suggestions'] in line:
            current_section = 'suggestions'
            continue

        if line.startswith('- ') or line.startswith('* '):
            if current_section == 'criteria':
                missing_criteria.append(line[2:].strip())
            elif current_section == 'suggestions':
                general_suggestions.append(line[2:].strip())

    return {
        "analysis": analysis,
        "missingCriteria": missing_criteria,
        "generalSuggestions": general_suggestions,
        "requiresRevision": len(missing_criteria) > 0 or len(general_suggestions) > 0
    }

def analyze_ticket(ticket_data: Dict, images: List[Dict] = None, general_criteria: Dict = None) -> Dict:
    """Analyze ticket using GPT-4"""
    try:
        description = ticket_data.get('description', '').strip()
        acceptance_criteria = ticket_data.get('acceptance_criteria', '').strip()

        if not description and not acceptance_criteria:
            raise HTTPException(
                status_code=400,
                detail="El ticket no tiene descripción ni criterios de aceptación para analizar"
            )

        processed_images = [process_image(img['content']) for img in images] if images else []
        base_prompt, language = prepare_analysis_prompt(ticket_data, general_criteria, processed_images)

        messages = [
            {
                "role": "system",
                "content": """You are an expert in user story analysis and software requirements. 
                Focus on providing actionable, specific feedback and ensure all field validations 
                and usability standards are met. Structure your response in two clear sections:
                1. Missing Acceptance Criteria
                2. General Suggestions
                Respond in the same language as the user story."""
            },
            {
                "role": "user",
                "content": base_prompt
            }
        ]

        response = client.chat.completions.create(
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