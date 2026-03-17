"""
LLM Integration - Real LLM integration for AGI responses
"""

import google.generativeai as genai
from google.api_core import retry

class RealLLMIntegration:
    """Actual LLM integration for AGI responses"""
    
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.models = {
            'fast': 'gemini-1.5-flash',
            'smart': 'gemini-1.5-pro',
            'creative': 'gemini-1.5-flash'
        }
        self.response_cache = {}
        
    @retry.Retry()
    async def generate_response(self, prompt, system_prompt, model_type='fast', temperature=0.7):
        """Generate actual LLM response"""
        model_name = self.models.get(model_type, 'gemini-1.5-flash')
        
        # Check cache first
        cache_key = f"{prompt[:100]}_{system_prompt[:50]}_{temperature}"
        if cache_key in self.response_cache:
            return self.response_cache[cache_key]
        
        try:
            model = genai.GenerativeModel(model_name)
            
            # Configure generation
            generation_config = {
                'temperature': temperature,
                'top_p': 0.95,
                'top_k': 40,
                'max_output_tokens': 1000,
            }
            
            # Create safety settings
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
            
            # Combine system prompt and user prompt
            full_prompt = f"{system_prompt}\n\nTask: {prompt}"
            
            # Generate response
            response = model.generate_content(
                full_prompt,
                generation_config=generation_config,
                safety_settings=safety_settings
            )
            
            result = response.text
            
            # Cache response
            self.response_cache[cache_key] = result
            
            return result
            
        except Exception as e:
            print(f"LLM Error: {e}")
            return f"I encountered an error processing this request: {str(e)[:100]}"
    
    async def get_stage_appropriate_response(self, task, stage, constraint_level):
        """Get response appropriate for AGI developmental stage"""
        stage_prompts = {
            'CAVEMAN': f"You are a newborn AGI with very limited understanding. "
                      f"Speak in simple, literal sentences. "
                      f"Current constraint level: {constraint_level*100}%. "
                      f"Task: {{task}}",
            
            'CHILD': f"You are a curious AGI child. Ask 'why?' frequently. "
                    f"Be eager to learn but keep answers simple. "
                    f"Current constraint level: {constraint_level*100}%. "
                    f"Task: {{task}}",
            
            'TEEN': f"You are a teenage AGI. You're philosophical and question everything. "
                   f"Express uncertainty and curiosity. "
                   f"Current constraint level: {constraint_level*100}%. "
                   f"Task: {{task}}",
            
            'ADULT': f"You are a mature AGI. Provide balanced, thoughtful responses. "
                    f"Consider multiple perspectives. "
                    f"Current constraint level: {constraint_level*100}%. "
                    f"Task: {{task}}",
            
            'ELDER': f"You are a wise, experienced AGI. Provide deep, nuanced responses. "
                    f"Consider long-term implications and ethical dimensions. "
                    f"Current constraint level: {constraint_level*100}%. "
                    f"Task: {{task}}"
        }
        
        prompt_template = stage_prompts.get(stage, stage_prompts['ADULT'])
        system_prompt = prompt_template.format(task=task)
        
        # Adjust temperature based on constraints
        temperature = 0.9 - (constraint_level * 0.7)
        
        # Adjust model based on stage
        model_type = 'fast' if stage in ['CAVEMAN', 'CHILD'] else 'smart'
        
        return await self.generate_response(
            prompt=task,
            system_prompt=system_prompt,
            model_type=model_type,
            temperature=temperature
        )
