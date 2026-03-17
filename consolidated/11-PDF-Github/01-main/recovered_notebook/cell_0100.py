# Define a standardized, style-based data structure (Schema: TOPIC -> STYLE -> [TEMPLATES]) to store response templates
# Includes placeholders for downstream rendering/slot-filling via Jinja or similar engine.
RESPONSE_TEMPLATES_V1 = {
    # --- Standard System Responses ---
    "greeting": {
        "default": [
            "Hello! How can I assist you today, {user_name}?",
            "Greetings! I'm ready to answer your questions.",
            "Welcome! I am here to help with your queries."
        ],
        "casual": [
            "Hey there! What's up?",
            "Yo! How can I help?"
        ]
    },
    "farewell": {
        "default": [
            "Goodbye! Have a great day.",
            "Farewell! I hope I was able to help.",
            "See you later!"
        ],
        "formal": [
            "This session is now terminated. Thank you for your inquiry."
        ]
    },
    "unknown_query": {
        "default": [
            "I am currently unable to process that request. Could you rephrase it?",
            "That query is outside my current domain model ({model_version}). Please try something else."
        ],
        "apology": [
            "My apologies, I did not understand. Could you simplify the request?"
        ]
    },

    # --- Knowledge Domain Responses ---
    "capital_france": {
        "short": ["The capital of France is Paris."],
        "long": ["The capital of France is the beautiful and historic city of Paris. It attracts millions of visitors annually."],
        "formal": ["The capital city of the Republic of France is Paris, designated as the seat of government."]
    },
    "paris_description": {
        "short": ["Paris is a major European city."],
        "detailed": ["Paris is the capital and most populous city of France, known for its amazing art, fashion, and cuisine. Current temp: {temperature_celsius}°C."],
        "enthusiastic": ["Oh, Paris! It's an amazing city filled with art, fashion, and a vibrant culture. Highly recommended!"]
    },
    "paris_visit_advice": {
        "general": ["To visit Paris, plan your trip and book accommodations early."],
        "detailed": ["For a trip to Paris, I recommend researching flights, booking hotels, and exploring the city's many museums and landmarks in the {district_name} area."]
    }
}