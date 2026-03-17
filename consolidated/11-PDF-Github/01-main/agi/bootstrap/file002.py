import requests
import torch
import re
from transformers import pipeline
from bs4 import BeautifulSoup

# --- Architectural Constants ---
# Standard buffer size limit for general purpose text classification inputs.
MAX_CLASSIFICATION_CHARS = 2500 
USER_AGENT = "SovereignAGI/v94.1 CodebaseEvolution Agent (Experimental)"

# Set up the device (GPU or CPU) using explicit ID assignment
device_id = 0 if torch.cuda.is_available() else -1

# Load the task-specific pre-trained model and tokenizer
model_name = "distilbert-base-uncased-sentiment" 
classifier = pipeline("sentiment-analysis", model=model_name, device=device_id)

# --- Utility Functions ---

def clean_and_truncate_text(raw_text: str) -> str:
    """Normalizes whitespace and truncates the text to prevent excessive input size."""
    # 1. Normalize whitespace (removes excessive newlines/spaces)
    cleaned_text = ' '.join(raw_text.split())
    
    # 2. Truncate to character limit
    if len(cleaned_text) > MAX_CLASSIFICATION_CHARS:
        return cleaned_text[:MAX_CLASSIFICATION_CHARS]
    
    return cleaned_text

def fetch_content(url: str) -> str | None:
    """Fetches text content from a given URL, handles connection errors and parsing."""
    try:
        # Send a GET request with timeout
        response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=15)
        response.raise_for_status() # Check for bad status codes

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract raw text
        raw_text = soup.get_text()

        # Clean and truncate for model input
        processed_text = clean_and_truncate_text(raw_text)
        
        if not processed_text:
             print(f"Warning: Extracted text from {url} was empty after processing.")
             return None

        return processed_text

    except requests.exceptions.RequestException as e:
        # Log request errors
        print(f"Error fetching URL {url}: {e}")
        return None
    except Exception as e:
        # Log general errors
        print(f"General parsing error on {url}: {e}")
        return None

def classify_text(text: str):
    """Classifies the processed text using the initialized pipeline (sentiment analysis)."""
    if not text or len(text.strip()) < 20:
        return {"error": "Input text too short or empty for meaningful classification."}
        
    try:
        # The pipeline handles tokenization and final truncation internally.
        prediction = classifier(text, truncation=True, top_k=None)
        return prediction

    except Exception as e:
        print(f"Classification runtime error: {e}")
        return None

# Define the main function
def main():
    # Specify a robust URL for demonstration
    url = "https://en.wikipedia.org/wiki/Artificial_general_intelligence"

    print(f"Attempting to retrieve and analyze: {url}")
    text_to_classify = fetch_content(url)

    if text_to_classify:
        print(f"--- Analyzing snippet ({len(text_to_classify)} chars) ---")
        
        # Perform classification
        result = classify_text(text_to_classify)

        print("\n--- Classification Result ---")
        print(result)
    else:
        print("Analysis failed due to content retrieval issues.")

# Run the main function
if __name__ == "__main__":
    main()

# Sanity check
print(f"\nSanity check prediction: {classifier('Sovereign AGI achieved deployment.')}")