import os
import urllib.parse
import requests
from concurrent.futures import ThreadPoolExecutor
import json

# --- Configuration ---
REQUEST_TIMEOUT = 5
MAX_WORKERS = 20

def check_url_status(url, method='HEAD'):
    """Performs a status check on a given URL, returning structured results."""
    result = {"url": url, "status_code": None, "error": None, "reachable": False}
    try:
        # Using Session provides minor efficiency improvements in thread environments via connection reuse
        with requests.Session() as session:
            # Use HEAD request for efficiency unless overridden
            response = session.request(method, url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
            result["status_code"] = response.status_code
            # Consider 2xx and 3xx as generally reachable for the base link check
            result["reachable"] = (200 <= response.status_code < 400)
    
    except requests.exceptions.Timeout:
        result["error"] = "Timeout error"
    except requests.exceptions.ConnectionError:
        result["error"] = "Connection failed"
    except requests.exceptions.RequestException as e:
        result["error"] = f"Request error: {type(e).__name__}"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"
        
    return result


def worker_check(scheme, netloc):
    """Worker function to check both the main link and robots.txt concurrently per thread."""
    base_url = f"{scheme}://{netloc}"
    robots_url = f"{base_url}/robots.txt"
    
    main_link_status = check_url_status(base_url)
    robots_txt_status = check_url_status(robots_url)
    
    # Return domain-centric structured data
    return {
        "domain": netloc,
        "scheme": scheme,
        "base_link": main_link_status,
        "robots_txt": robots_txt_status
    }


def process_links_and_robot_txt(file_path):
    """Reads links from a file, deduplicates domains, and processes them concurrently."""
    parsed_domains = set()
    links_to_process = []

    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        return []

    with open(file_path, 'r') as file:
        for line in file:
            line = line.strip()
            if not line:
                continue
            
            parsed_url = urllib.parse.urlparse(line)
            
            if parsed_url.scheme and parsed_url.netloc:
                netloc = parsed_url.netloc.lower()
                
                # Use domain/scheme combination for uniqueness, avoiding redundant checks
                domain_key = (parsed_url.scheme, netloc)
                if domain_key not in parsed_domains:
                    links_to_process.append(domain_key)
                    parsed_domains.add(domain_key)

    print(f"Processing {len(links_to_process)} unique domain/scheme combinations...")
    
    results = []
    # Utilize ThreadPoolExecutor with defined max workers
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Map the worker function over the list of tuples (scheme, netloc)
        results = list(executor.map(lambda x: worker_check(x[0], x[1]), links_to_process))

    return results

def main():
    file_path = "links.txt"
    
    # Hallucinated dummy file creation for easier testing/demonstration
    if not os.path.exists(file_path):
        print(f"Creating dummy file: {file_path}")
        with open(file_path, 'w') as f:
            f.write("https://google.com\n")
            f.write("http://invalid-domain-that-will-fail-9999.xyz\n")
            f.write("https://github.com\n")
            f.write("https://www.google.com/search?q=test (duplicate domain)\n")
            
    result = process_links_and_robot_txt(file_path)
    if result:
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()