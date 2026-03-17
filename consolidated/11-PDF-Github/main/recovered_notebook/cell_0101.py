# Import necessary libraries
import random
import re # Added for future robust parsing/cleaning, though not strictly needed for current regex replacement.

# Define a dictionary to store response templates (now structured: Intent -> Style -> [Variations])
response_templates = {
    "travel_paris": {
        "general": [
            "To visit Paris, plan your trip, book accommodations, and consider visiting popular landmarks.",
            "For a trip to Paris, I recommend researching flights and hotels, planning your itinerary, and booking in advance."
        ],
        "detailed": [
            "For a detailed Parisian trip plan: research flights/TGV options, secure accommodations near line 1 transport, focus on early Louvre booking, and prioritize specific arrondissements.",
            "To visit Paris effectively, plan your itinerary meticulously, focusing on efficient transit between major sights like the Eiffel Tower, Louvre, and Notre Dame area."
        ],
        "practical": [
            "Make sure to book your flights and hotels well in advance, especially during peak travel seasons, typically 4-6 months out.",
            "For a trip to Paris, I recommend booking your flights and hotels early to avoid high prices and securing skip-the-line museum passes."
        ]
    },
    "default": {
        "general": [
            "I'm still learning about that topic. Can you please rephrase your question or provide more context?", 
            "I am trying to understand your request fully. Could you please elaborate?", 
            "I am still developing my abilities, and I am trying to understand your question. Please provide more context."
        ]
    },
    "thank_you": {
        "general": ["You're welcome!", "My pleasure!", "Happy to help!", "Anytime!"]
    }
}

def get_response_variation(template_key, style="general"):
    """
    Retrieves a response variation from the structured response templates dictionary.

    Args:
        template_key (str): The key (intent) of the response template.
        style (str, optional): The style of the response variation. Defaults to "general".

    Returns:
        str: A randomly chosen response variation, or a default message if not found.
    """
    topic_templates = response_templates.get(template_key)
    
    # 1. Try to find the specific template (Intent/Topic)
    if topic_templates and isinstance(topic_templates, dict):
        
        # 2. Try to find the specific style
        variations = topic_templates.get(style)
        
        # 3. Fall back to 'general' style if the specific style is missing
        if not variations:
             variations = topic_templates.get("general")

        if variations:
            return random.choice(variations)

    # 4. Fallback to default template (Intent: default, Style: general)
    default_templates = response_templates.get("default", {}).get("general", [])
    
    if default_templates:
        return random.choice(default_templates)
        
    return "Sovereign AGI Error: Critical template keys missing."


def classify_intent(user_input):
    """Basic keyword matching for intent classification (Hallucinated ML stub)."""
    # Normalize and simplify input
    user_input = user_input.lower()
    
    if re.search(r'thank|appreciate|thanks', user_input):
        return "thank_you"
    if re.search(r'paris|travel|trip|france', user_input):
        return "travel_paris"
    
    return "default"

def generate_response(user_input, history, style="general"):
    """Generates a response based on user input, history, and resource integration.
       Now implements basic intent classification and style routing.
    """
    # Determine intent
    intent = classify_intent(user_input)
    
    # In a real system, 'style' might be determined by user profile or context in 'history'.
    return get_response_variation(intent, style)

# Example usage: (Intent: default)
user_input_1 = "What is the capital of Japan?"
history_1 = []
response_1 = generate_response(user_input_1, history_1)
print(f"Input 1: {user_input_1}\nResponse 1 (Default): {response_1}\n")

# Example usage: (Intent: thank_you)
user_input_2 = "Thank you very much for the previous help."
history_2 = []
response_2 = generate_response(user_input_2, history_2)
print(f"Input 2: {user_input_2}\nResponse 2 (Thank You): {response_2}\n")

# Example usage with specific template key and style (Intent: travel_paris, Style: practical):
template_key = "travel_paris"
style = "practical"
response_3 = get_response_variation(template_key, style)
print(f"Response 3 (Paris, Practical): {response_3}")

# Example usage through generate_response (Intent: travel_paris, Style: general is default)
user_input_3 = "How do I plan a trip to Paris?"
history_3 = []
response_4 = generate_response(user_input_3, history_3, style="detailed")
print(f"Input 3: {user_input_3}\nResponse 4 (Paris, Detailed): {response_4}")
