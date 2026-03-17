import re
from typing import List, Dict

class ResponseGenerator:
    def __init__(self):
        self.greeting_keywords = ["hello", "hi", "greetings"]
        self.farewell_keywords = ["bye", "goodbye", "farewell", "see you"]
        self.capital_keywords = ["capital", "france"]
        self.paris_keywords = ["paris", "visit", "go to", "tell", "about"]
        self.response_variations = {
            "greeting": {"message": "Hello! How can I assist you?", "style": "general"},
            "farewell": {"message": "Goodbye! It was nice chatting with you.", "style": "general"},
            "capital_france": {"message": "The capital of France is Paris.", "style": "long"},
            "paris_description": {"message": "Paris is the capital of France, known for its stunning architecture and rich history.", "style": "detailed"},
            "paris_visit_advice": {"message": "If you're planning to visit Paris, consider visiting the Eiffel Tower and the Louvre Museum.", "style": "detailed"}
        }
        self.resources = {
            "capital of france": [{"title": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Paris"}],
            "paris": [{"title": "Paris Tourism", "url": "https://www.parisinfo.com/en"}],
            "visit paris": [{"title": "TripAdvisor", "url": "https://www.tripadvisor.com/Tourism-g187147-Paris_Ile_de_France-Vacations.html"}]
        }

    def extract_keywords(self, text: str) -> List[str]:
        """Extracts keywords using more advanced techniques."""
        keywords = [word.lower() for word in re.findall(r'\b\w+\b', text) if word.isalpha()]
        return keywords

    def get_response_variation(self, template_key: str, style: str = "general") -> Dict:
        """Retrieves a response variation based on the template key and style."""
        return self.response_variations.get(template_key, {})

    def get_resources(self, query: str) -> List[Dict]:
        """Retrieves relevant resources using the scraper."""
        return self.resources.get(query, [])

    def resolve_response(self, keywords: List[str]) -> Dict:
        """Determines the response based on the extracted keywords."""
        if any(word in keywords for word in self.greeting_keywords):
            return self.get_response_variation("greeting")
        elif any(word in keywords for word in self.farewell_keywords):
            return self.get_response_variation("farewell")
        elif set(self.capital_keywords).issubset(set(keywords)):
            return self.get_response_variation("capital_france", style="long")
        elif "paris" in keywords:
            if any(word in keywords for word in self.paris_keywords):
                if "tell" in keywords or "about" in keywords:
                    return self.get_response_variation("paris_description", style="detailed")
                elif "visit" in keywords or "go to" in keywords:
                    return self.get_response_variation("paris_visit_advice", style="detailed")
                else:
                    return self.get_response_variation("paris_description", style="short")
        return {}

    def main(self):
        user_input = "User input here"
        keywords = self.extract_keywords(user_input)
        response = self.resolve_response(keywords)
        print(response)

if __name__ == "__main__":
    response_generator = ResponseGenerator()
    response_generator.main()