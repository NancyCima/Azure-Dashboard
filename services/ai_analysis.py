from fastapi import HTTPException
from bs4 import BeautifulSoup
from typing import Dict, List
import openai
from openai import OpenAI
from langdetect import detect
import io
from PIL import Image
import base64

client = OpenAI()

def process_image(image_content: bytes) -> str:
    """Process and convert image to base64"""
    try:
        # Open image using PIL
        img = Image.open(io.BytesIO(image_content))
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if too large
        max_size = (1024, 1024)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=85)
        img_byte_arr = img_byte_arr.getvalue()
        
        # Convert to base64
        return base64.b64encode(img_byte_arr).decode('utf-8')
    except Exception as e:
        print(f"Error processing image: {e}")
        return None

def load_general_criteria():
    """Load general criteria from JSON file"""
    try:
        with open("data\general_criteria.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading general criteria: {e}")
        return None

def prepare_analysis_prompt(ticket_data: Dict, general_criteria: Dict = None) -> tuple[str, str]:
    """Prepare the analysis prompt based on ticket data and general criteria"""
    # Clean HTML from description and acceptance criteria
    description = BeautifulSoup(ticket_data['description'], 'html.parser').get_text()
    acceptance_criteria = BeautifulSoup(ticket_data['acceptance_criteria'], 'html.parser').get_text()
    
    # Detect language
    language = detect(description + " " + acceptance_criteria)
    
    # Prepare context with general criteria
    criteria_context = ""
    if general_criteria:
        criteria_context = "Criterios generales a considerar:\n" if language == 'es' else "General criteria to consider:\n"
        for category in general_criteria["criteria"]:
            criteria_context += f"\n{category['category']}:\n"
            for rule in category["rules"]:
                criteria_context += f"- {rule}\n"
            if "field_types" in category:
                criteria_context += "\nTipos de campos:\n" if language == 'es' else "\nField Types:\n"
                for field_type, desc in category["field_types"].items():
                    criteria_context += f"- {field_type}: {desc}\n"

    # Prepare the base prompt based on language
    base_prompt = f"""{'Analiza esta historia de usuario para verificar su completitud y coherencia' if language == 'es' else 'Analyze this user story for completeness and coherence'}:

Título: {ticket_data['title']}
Descripción: {description}
Criterios de Aceptación Actuales: {acceptance_criteria}

{criteria_context}

{'IMPORTANTE: Estructura tu respuesta en dos secciones principales:' if language == 'es' else 'IMPORTANT: Structure your response in two main sections:'}

1. {'Criterios de Aceptación Sugeridos:' if language == 'es' else 'Suggested Acceptance Criteria:'}
   - {'Lista de criterios de aceptación específicos y medibles' if language == 'es' else 'List of specific and measurable acceptance criteria'}
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
            'criteria': 'Criterios de Aceptación Sugeridos:',
            'suggestions': 'Sugerencias Generales:'
        },
        'en': {
            'criteria': 'Suggested Acceptance Criteria:',
            'suggestions': 'General Suggestions:'
        }
    }
    
    suggested_criteria = []
    general_suggestions = []
    current_section = None
    
    for line in analysis.split('\n'):
        line = line.strip()
        if not line:
            continue
        
        # Detect section changes
        if sections[language]['criteria'] in line:
            current_section = 'criteria'
            continue
        elif sections[language]['suggestions'] in line:
            current_section = 'suggestions'
            continue
        
        # Add items to appropriate section
        if line.startswith('- ') or line.startswith('* '):
            if current_section == 'criteria':
                suggested_criteria.append(line[2:].strip())
            elif current_section == 'suggestions':
                general_suggestions.append(line[2:].strip())

    return {
        "analysis": analysis,
        "suggestedCriteria": suggested_criteria,
        "generalSuggestions": general_suggestions,
        "requiresRevision": len(suggested_criteria) > 0 or len(general_suggestions) > 0
    }

def analyze_ticket(ticket_data: Dict, images: List[Dict] = None, general_criteria: Dict = None) -> Dict:
    """Analyze ticket using GPT-4"""
    try:
        base_prompt, language = prepare_analysis_prompt(ticket_data, general_criteria)

        messages = [
            {
                "role": "system",
                "content": """You are an expert in user story analysis and software requirements. 
                Focus on providing actionable, specific feedback and ensure all field validations 
                and usability standards are met. Structure your response in two clear sections:
                1. Suggested Acceptance Criteria
                2. General Suggestions
                Respond in the same language as the user story."""
            },
            {
                "role": "user",
                "content": base_prompt
            }
        ]

        try:
            # Make API call to GPT-4
            response = client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            
            # Extract and structure the analysis
            analysis = response.choices[0].message.content
            return parse_analysis_response(analysis, language)

        except openai.APIError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error de API de OpenAI: {str(e)}" if language == 'es' else f"OpenAI API error: {str(e)}"
            )
        except openai.APIConnectionError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error de conexión con la API de OpenAI: {str(e)}" if language == 'es' else f"Failed to connect to OpenAI API: {str(e)}"
            )
        except openai.RateLimitError as e:
            raise HTTPException(
                status_code=429,
                detail=f"Límite de API de OpenAI excedido: {str(e)}" if language == 'es' else f"OpenAI API rate limit exceeded: {str(e)}"
            )
        except openai.AuthenticationError as e:
            raise HTTPException(
                status_code=401,
                detail=f"Error de autenticación de API de OpenAI: {str(e)}" if language == 'es' else f"OpenAI API authentication error: {str(e)}"
            )
        except openai.BadRequestError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Solicitud incorrecta a la API de OpenAI: {str(e)}" if language == 'es' else f"Bad request to OpenAI API: {str(e)}"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en el análisis: {str(e)}" if language == 'es' else f"Analysis failed: {str(e)}"
        )