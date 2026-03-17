```python
def get_absolute_url(url):
    """Constructs the absolute URL by combining the base URL with the given relative URL."""
    return ATO_BASE_URL + url

def download_pdf(url, output_dir):
    """Downloads a PDF from the given URL and saves it to the output directory."""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        os.makedirs(output_dir, exist_ok=True)
        filename = os.path.basename(url)
        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        log_message(f"Downloaded {filename} to {output_dir}", "INFO")
        return filepath
    except requests.exceptions.RequestException as e:
        log_message(f"Failed to download {filename}: {e}", "ERROR")
        return None

def extract_text_from_pdf(filepath):
    """Extracts text from the given PDF file using pdfplumber."""
    try:
        text = ""
        with pdf_open(filepath) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        log_message(f"Failed to extract text from {filepath}: {e}", "ERROR")
        return None

def scrape_reports_page(url, verbose=False):
    """Scrapes the reports page and extracts report information."""
    for attempt in range(MAX_RETRIES):
        try:
            response = make_request(url, verbose=verbose)
            if response is None:
                log_message(f"Failed to fetch reports page (attempt {attempt + 1}/{MAX_RETRIES})")
                continue  # Retry
            soup = BeautifulSoup(response.text, "html.parser")
            return soup
        except requests.exceptions.RequestException as e:
            log_message(f"Error during request (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
            time.sleep(retry_delay * (attempt + 1))
    else:
        log_message(f"Request Error: {e} after {attempt + 1} attempts", "ERROR")
        return None
    except Exception as e:
        log_message(f"Unexpected error during request: {e}", "ERROR")
        return None

# 
# Output/logs:
# 
# (no output/logs provided in the original text fragment)
```