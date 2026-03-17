```python
from IPython.display import display, HTML
import ipywidgets as widgets
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.tag import pos_tag
from nltk.chunk import ne_chunk
import requests
from bs4 import BeautifulSoup
import urllib.parse
import re
import json
import pyperclip
from collections import defaultdict, Counter

# Ensure NLTK data is available
try:
    nltk.data.find('corpora/stopwords')
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('taggers/averaged_perceptron_tagger')
    nltk.data.find('chunkers/maxent_ne_chunker')
    nltk.data.find('corpora/words')
except LookupError as e:
    print(f"NLTK data not found: {e}. Downloading...")
    nltk.download('stopwords')
    nltk.download('punkt')
    nltk.download('averaged_perceptron_tagger')
    nltk.download('maxent_ne_chunker')
    nltk.download('words')
    print("NLTK data downloaded. Please restart the kernel.")

# Configuration
SEARCH_ENGINE = "google"
NUM_RESULTS = 3
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"

# Knowledge Base (Dynamic - using default dict)
knowledge_base = defaultdict(lambda: {"definition": "", "context": []})
context = []  # Store recent interactions for context

# Text Processing Functions
def preprocess_text(text):
    text = re.sub(r"[^\w\s]", "", text.lower())
    return text

def extract_keywords(text, num_keywords=3):
    """Extracts keywords using TF-IDF (simplified)"""
    text = preprocess_text(text)
    stop_words = set(stopwords.words('english'))
    words = word_tokenize(text)
    words = [w for w in words if w.isalnum() and w not in stop_words]
    word_counts = Counter(words)
    most_common = word_counts.most_common(num_keywords)
    return [word for word, count in most_common]

def analyze_text(text):
    """Performs basic NLP analysis (tokenization, POS tagging, NER)"""
    text = preprocess_text(text)
    try:
        tokens = word_tokenize(text)
    except LookupError as e:
        print(f"Error tokenizing: {e}. Downloading 'punkt'...")
        nltk.download('punkt')
        tokens = word_tokenize(text)  # Retry
    pos_tags = pos_tag(tokens)
    try:  # NER can fail if the chunker isn't available
        named_entities = ne_chunk(pos_tags)
    except Exception as e:
        print(f"NER failed: {e}. Continuing without NER...")
        named_entities = []
    return tokens, pos_tags, named_entities

# Search Function (Simplified)
def search_google(query):
    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
    headers = {"User-Agent": USER_AGENT}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")
    results = []
    for result in soup.find_all("div", class_="g"):
        link = result.find("a")
        if link:
            results.append((link.text, link["href"]))
    return results[:NUM_RESULTS]

# Example usage:
query = "What is machine learning?"
results = search_google(query)
print("Search results:")
for title, link in results:
    print(f"{title}: {link}")

# Example output:
# Search results:
# Machine learning - Wikipedia: https://en.wikipedia.org/wiki/Machine_learning
# Machine Learning | Coursera: https://www.coursera.org/specializations/machine-learning
# Machine Learning | edX: https://www.edx.org/learn/machine-learning
```