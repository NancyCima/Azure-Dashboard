import json
import os
from typing import Dict, List
from fastapi import HTTPException
from bs4 import BeautifulSoup
from langdetect import detect
import openai
from openai import OpenAI

client = OpenAI()

class TicketAnalyzer:
    def __init__(self, general_criteria_path='general_criteria.json'):
        """
        Initialize analyzer with general criteria from JSON
        
        Args:
            general_criteria_path (str): Path to JSON with general criteria
        """
        self.general_criteria = self.load_general_criteria(general_criteria_path)
        self.flattened_criteria = self._flatten_general_criteria()

    def load_general_criteria(self, file_path: str) -> Dict:
        """
        Load general criteria from JSON file
        
        Args:
            file_path (str): Path to JSON file
        
        Returns:
            Dict: Loaded criteria or empty dict if error
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading general criteria: {e}")
            return {}

    def _flatten_general_criteria(self) -> List[str]:
        """
        Flatten general criteria rules for easy comparison
        
        Returns:
            List[str]: Flattened list of criteria rules
        """
        return [
            rule.lower().strip() 
            for category in self.general_criteria.get('criteria', []) 
            for rule in category.get('rules', [])
        ]

    def filter_suggested_criteria(self, suggested_criteria: List[str]) -> List[str]:
        """
        Filter out criteria that match general criteria
        
        Args:
            suggested_criteria (List[str]): AI-generated criteria
        
        Returns:
            List[str]: Filtered criteria unique to the ticket
        """
        return [
            criteria for criteria in suggested_criteria
            if criteria.lower().strip() not in self.flattened_criteria
        ]

    def prepare_analysis_prompt(self, ticket_data: Dict) -> tuple[str, str]:
        """
        Prepare analysis prompt with specific instructions
        
        Args:
            ticket_data (Dict): Ticket information
        
        Returns:
            tuple: Prepared prompt and detected language
        """
        # Clean HTML from description and acceptance criteria
        description = BeautifulSoup(ticket_data['description'], 'html.parser').get_text()
        acceptance_criteria = BeautifulSoup(ticket_data['acceptance_criteria'], 'html.parser').get_text()
        
        # Detect language
        language = detect(description + " " + acceptance_criteria)
        
        base_prompt = f"""Analyze this user story STRICTLY focusing on MISSING acceptance criteria:

Title: {ticket_data['title']}
Description: {description}
Current Acceptance Criteria: {acceptance_criteria}

CRITICAL INSTRUCTIONS:
1. Identify ONLY missing acceptance criteria
2. DO NOT reuse or mention ANY criteria from pre-existing documents
3. Generate criteria UNIQUE to this specific user story
4. Focus on story's specific context and requirements
5. Each criterion must be:
   - Specific
   - Measurable
   - Directly related to the story
   - Not found in general guidelines

Response Format:
1. Missing Acceptance Criteria:
   - Precise, story-specific criteria
   - Start each with a dash (-)
   - Maximum 5-7 criteria

{'IMPORTANTE: Responde en español' if language == 'es' else 'IMPORTANT: Respond in English'}
"""
        return base_prompt, language

    def analyze_ticket(self, ticket_data: Dict, images: List[Dict] = None) -> Dict:
        """
        Analyze ticket with advanced filtering
        
        Args:
            ticket_data (Dict): Ticket information
            images (List[Dict], optional): Associated images
        
        Returns:
            Dict: Structured analysis results
        """
        try:
            # Validate ticket content
            description = ticket_data.get('description', '').strip()
            acceptance_criteria = ticket_data.get('acceptance_criteria', '').strip()
            
            if not description and not acceptance_criteria:
                raise HTTPException(status_code=400, detail="No description or acceptance criteria")

            # Prepare prompt
            base_prompt, language = self.prepare_analysis_prompt(ticket_data)

            # Prepare messages for GPT
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert in identifying unique, specific acceptance criteria for user stories."
                },
                {
                    "role": "user",
                    "content": base_prompt
                }
            ]

            # Call GPT-4 for analysis
            response = client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=500,
                temperature=0.6
            )
            
            # Parse response
            analysis = response.choices[0].message.content
            parsed_response = self._parse_analysis_response(analysis, language)
            
            # Filter out generic criteria
            parsed_response['suggestedCriteria'] = self.filter_suggested_criteria(
                parsed_response['suggestedCriteria']
            )
            
            return parsed_response

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    def _parse_analysis_response(self, analysis: str, language: str) -> Dict:
        """
        Parse AI response into structured format
        
        Args:
            analysis (str): AI-generated analysis
            language (str): Detected language
        
        Returns:
            Dict: Structured analysis results
        """
        sections = {
            'es': {
                'criteria': 'Missing Acceptance Criteria:',
            },
            'en': {
                'criteria': 'Missing Acceptance Criteria:',
            }
        }
        
        suggested_criteria = []
        current_section = None
        
        for line in analysis.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            # Detect section changes
            if sections[language]['criteria'] in line:
                current_section = 'criteria'
                continue
            
            # Add items to criteria section
            if line.startswith('- ') or line.startswith('* '):
                if current_section == 'criteria':
                    suggested_criteria.append(line[2:].strip())

        return {
            "analysis": analysis,
            "suggestedCriteria": suggested_criteria,
            "requiresRevision": len(suggested_criteria) > 0
        }

# Example usage
def process_ticket(ticket_data: Dict):
    """Example function to process a ticket"""
    analyzer = TicketAnalyzer()
    result = analyzer.analyze_ticket(ticket_data)
    return result