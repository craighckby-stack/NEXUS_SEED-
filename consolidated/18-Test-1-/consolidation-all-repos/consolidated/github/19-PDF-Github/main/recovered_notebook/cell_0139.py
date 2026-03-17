import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from typing import Dict, Any

class WebRecon:
    """Performs structured basic web reconnaissance on a target URL.
    
    Refactors original functions into a robust class structure, adding 
    User-Agent spoofing, error handling, structured data return, and 
    proper URL normalization.
    """

    DEFAULT_HEADERS = {
        'User-Agent': 'SovereignAGI/v94.1 Reconnaissance Agent (Non-Malicious)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    }
    TIMEOUT = 15

    def __init__(self, base_url: str):
        self.base_url = self._normalize_url(base_url)
        self.session = requests.Session()
        self.session.headers.update(self.DEFAULT_HEADERS)
        
    def _normalize_url(self, url: str) -> str:
        """Ensures the URL has a scheme, defaulting to https."""
        if not urlparse(url).scheme:
            # Default to https, handles common cases gracefully
            url = f"https://{url}"
        return url.strip()

    def fetch_robots_txt(self) -> Dict[str, Any]:
        """Fetches and returns robots.txt content."""
        robots_url = urljoin(self.base_url, '/robots.txt')
        result = {"url": robots_url, "content": None, "status": "Error"}
        print(f"\n--- Fetching robots.txt: {robots_url} ---")
        try:
            response = self.session.get(robots_url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            result["content"] = response.text
            result["status"] = f"Success ({response.status_code})"
            
            print(response.text[:500] + ('...' if len(response.text) > 500 else ''))
            
        except requests.exceptions.RequestException as e:
            result["status"] = f"Error: {type(e).__name__} - {e}"
            print(f"Error fetching robots.txt: {e}")
            
        return result

    def fetch_http_headers(self) -> Dict[str, Any]:
        """Fetches and displays HTTP headers using a HEAD request."""
        print(f"\n--- Fetching HTTP Headers for: {self.base_url} ---")
        headers_data = {}
        try:
            # Use HEAD request for efficiency
            response = self.session.head(self.base_url, timeout=self.TIMEOUT, allow_redirects=True)
            response.raise_for_status()
            
            headers_data['status_code'] = response.status_code
            headers_data['final_url'] = response.url
            headers_data['headers'] = dict(response.headers)
            
            # Print headers for immediate display
            for header, value in response.headers.items():
                print(f"{header}: {value}")
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching HTTP headers: {e}")
            headers_data['error'] = str(e)

        return headers_data

    def parse_webpage_content(self) -> Dict[str, Any]:
        """Fetches and parses webpage content to extract structural info."""
        print(f"\n--- Parsing Webpage Content for: {self.base_url} ---")
        content_data = {}

        try:
            # Use GET request for full content analysis
            response = self.session.get(self.base_url, timeout=self.TIMEOUT, allow_redirects=True)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract Data
            title_tag = soup.title
            content_data['title'] = title_tag.string.strip() if title_tag and title_tag.string else "Not found"
            
            content_data['meta_description'] = next(
                (d.get('content') for d in soup.find_all('meta', attrs={'name': 'description'}) if d.get('content')),
                "N/A"
            )
            content_data['meta_keywords'] = next(
                (d.get('content') for d in soup.find_all('meta', attrs={'name': 'keywords'}) if d.get('content')),
                "N/A"
            )

            print(f"Title: {content_data['title']}")
            print(f"Meta Description: {content_data['meta_description']}")

            # Count elements
            scripts = soup.find_all('script')
            links = soup.find_all('a', href=True)
            forms = soup.find_all('form')
            
            content_data['counts'] = {
                'scripts': len(scripts),
                'total_links': len(links),
                'forms': len(forms)
            }
            
            print("\n--- Structural Counts ---")
            print(f"Script tags: {content_data['counts']['scripts']}")
            print(f"Total links: {content_data['counts']['total_links']}")
            print(f"Forms found: {content_data['counts']['forms']}")
            
            # Analyze external links
            external_links = set()
            parsed_base = urlparse(self.base_url)
            base_netloc = parsed_base.netloc
            
            print("\n--- Identified External Links (Sampling 5) ---")
            count_ext = 0
            for link in links:
                href = link['href']
                # Simple heuristic to identify external links
                if href.startswith('http') or href.startswith('//'):
                    parsed_link = urlparse(href)
                    if parsed_link.netloc and parsed_link.netloc != base_netloc:
                        external_links.add(href)
                        if count_ext < 5:
                            print(f" > {href}")
                            count_ext += 1
            
            content_data['external_links'] = list(external_links)
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching/parsing content: {e}")
            content_data['error'] = str(e)
            
        return content_data

    def run_recon(self) -> Dict[str, Any]:
        """Runs the complete reconnaissance sequence, returning aggregated results."""
        print(f"\n========================================================")
        print(f"  STARTING WEB RECONNAISSANCE for {self.base_url}")
        print(f"========================================================\n")
        
        results = {}
        
        results['robots_txt'] = self.fetch_robots_txt()
        results['http_headers'] = self.fetch_http_headers()
        results['content_analysis'] = self.parse_webpage_content()
        
        return results

# Example usage replacement (Optional execution block, not required by prompt, kept in mind):
# if __name__ == '__main__':
#     target = "example.com"
#     recon = WebRecon(target)
#     results = recon.run_recon()
#     import json; print("\n\nFinal Structured Output:"); print(json.dumps(results, indent=2))
