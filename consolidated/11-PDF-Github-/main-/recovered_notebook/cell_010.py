import requests
import concurrent.futures
import logging
from urllib.parse import urljoin
from typing import List, Dict, Any, Optional

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Define a type alias for structured results
ResourceResult = Dict[str, Any]

# Configuration Constants
DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 SovereignAGIv94.1"
DEFAULT_TIMEOUT = 15

class HiddenResourceTester:
    """
    Tests for the existence of hidden resources in a given website.
    Uses requests.Session for connection pooling and implements the Context Manager protocol 
    (__enter__/__exit__) for automatic resource cleanup.

    Attributes:
        base_url (str): The base URL of the website to test.
        follow_redirects (bool): Whether to follow redirects when testing resources.
        session (requests.Session): Session object for efficient requests.
    """

    def __init__(self, base_url: str, follow_redirects: bool = True, user_agent: str = DEFAULT_USER_AGENT):
        """
        Initializes the HiddenResourceTester.
        """
        self.base_url = base_url
        self.follow_redirects = follow_redirects
        # Initialize the session later in __enter__ if using context manager pattern,
        # or immediately if not. Sticking to immediate init for thread pool compatibility.
        self.session: requests.Session = self._initialize_session(user_agent)

    def _initialize_session(self, user_agent: str) -> requests.Session:
        """
        Sets up the requests session with headers and configuration.
        """
        session = requests.Session()
        session.max_redirects = 5
        session.headers.update({
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        })
        return session

    def __enter__(self) -> 'HiddenResourceTester':
        """
        Context manager entry point.
        """
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Context manager exit point. Ensures the session is closed.
        """
        self.session.close()

    def test_resource(self, path: str) -> ResourceResult:
        """
        Tests for the existence of a hidden resource.
        Returns structured dictionary containing the outcome and metadata.
        Uses HEAD request first if appropriate, falling back to GET.
        """
        url = urljoin(self.base_url, path)
        result: ResourceResult = {
            "path": path,
            "url": url,
            "status_code": 0,
            "outcome": "Pending",
            "content_snippet": ""
        }

        try:
            # Use HEAD request as it is faster and usually sufficient for existence checks.
            # We use stream=True just in case for large responses, though HEAD shouldn't return body.
            response = self.session.head(
                url,
                timeout=DEFAULT_TIMEOUT,
                allow_redirects=self.follow_redirects,
                stream=True
            )
            
            status_code = response.status_code
            result["status_code"] = status_code

            # If 2xx/3xx, usually confirmed, but some servers block HEAD/return 403 on HEAD only.
            # Fallback to GET for definitive content analysis (especially Directory Listing)
            if status_code in (200, 405) or 300 <= status_code < 400:
                # If the server supports HEAD (2xx or 3xx), use status_code from HEAD.
                # If HEAD returns 405 (Method Not Allowed), we must use GET.
                if status_code == 405 or (status_code == 200 and len(response.content) < 100):
                     # Fall back to GET to confirm content or if HEAD failed
                    response = self.session.get(
                        url,
                        timeout=DEFAULT_TIMEOUT,
                        allow_redirects=self.follow_redirects
                    )
                    status_code = response.status_code
                    result["status_code"] = status_code

            # --- Outcome interpretation --- 
            content = response.text if response.content and status_code not in (204, 304) else ""
            
            if 200 <= status_code < 300:
                result["outcome"] = "FOUND (200 OK)"
                if content and ("<title>Index of" in content or "Directory Listing" in content):
                    result["outcome"] += " - Directory Listing Detected"
                # Normalize content snippet
                result["content_snippet"] = content[:200].replace('\n', ' ')

            elif 300 <= status_code < 400:
                result["outcome"] = f"REDIRECT ({status_code})"
                location = response.headers.get('Location', 'N/A')
                result["content_snippet"] = f"Location: {location}"
            
            elif status_code == 404:
                result["outcome"] = "NOT FOUND (404)"

            elif status_code in [401, 403]:
                result["outcome"] = f"ACCESS DENIED ({status_code})"
                result["content_snippet"] = content[:100].replace('\n', ' ') if content else "(No Body)"

            elif status_code >= 500:
                result["outcome"] = f"SERVER ERROR ({status_code})"
            
            else:
                result["outcome"] = f"OTHER RESPONSE ({status_code})"
                result["content_snippet"] = content[:100].replace('\n', ' ') if content else "(No Body)"

        except requests.exceptions.Timeout:
            result["outcome"] = "Error (Timeout)"
            result["status_code"] = -1
        except requests.exceptions.ConnectionError:
            result["outcome"] = "Error (Connection Failed)"
            result["status_code"] = -2
        except requests.exceptions.RequestException as e:
            result["outcome"] = f"Error (Request Exception): {type(e).__name__}"
            result["status_code"] = -3
            result["content_snippet"] = str(e)[:100].replace('\n', ' ')
        except Exception as e:
             result["outcome"] = f"Unexpected Internal Error: {type(e).__name__}"
             result["status_code"] = -4

        return result

def report_results(results: List[ResourceResult]):
    """Prints results in a clean and structured format."""
    print("\n--- Testing Summary ---")
    
    found_count = 0
    denied_count = 0
    not_found_count = 0
    error_count = 0

    # Sort results prioritizing success, then denial, then other, then errors
    def sort_key(r):
        sc = r['status_code']
        if 200 <= sc < 300: return 1
        if sc in (401, 403): return 2
        if sc == 404: return 99
        if sc > 0: return 3
        return 0 # Errors come first if possible

    results.sort(key=sort_key)

    for r in results:
        status_code = r["status_code"]
        outcome = r["outcome"]
        
        if status_code < 0:
             level = "[ERROR  ]"
             error_count += 1
             print(f"{level} {r['url']}")
             print(f"  Status: {outcome}")
             if r['content_snippet']:
                 print(f"  Detail: {r['content_snippet']}...")

        elif 200 <= status_code < 300:
            print(f"[SUCCESS] {r['url']}")
            print(f"  Status: {outcome}")
            if r['content_snippet']:
                print(f"  Snippet: {r['content_snippet']}...")
            found_count += 1
        elif status_code in (401, 403):
            print(f"[DENIED ] {r['url']}")
            print(f"  Status: {outcome}")
            denied_count += 1
        elif status_code == 404:
            not_found_count += 1
            pass # Suppressing verbose 404 output
        else:
             # Handle redirects and other client/server errors
             level = "[OTHER  ]"
             print(f"{level} {r['url']}")
             print(f"  Status: {outcome}")
             if r['content_snippet']:
                 print(f"  Detail: {r['content_snippet']}...")

             
    print("\n--- Statistics ---")
    print(f"Found Resources (2xx): {found_count}")
    print(f"Access Denied (401/403): {denied_count}")
    print(f"Not Found (404): {not_found_count}")
    print(f"Internal Errors: {error_count}")
    print(f"Total Probes: {len(results)}")


def main():
    """
    The main function that runs the HiddenResourceTester concurrently using ThreadPoolExecutor.
    """
    base_url = "http://example.com/"  # Target placeholder
    
    # Expanded path list including common dictionary attack candidates
    hidden_resources = [
        "robots.txt", "sitemap.xml", "admin/", "administrator/",
        "wp-admin/", "config.php", ".htaccess", ".git/HEAD", ".git/config",
        "backup/", "old/", "test.php", "phpinfo.php",
        "logs/", "api/", "api/v1/", "cms/", "help/",
        "support/", "login.php", "signin.php", "register.php",
        "upload/", "uploads/", "assets/", "includes/",
        "inc/", "js/", "css/", "images/", "img/",
        "data/", "db/", "/dev/", "/.env", "/vendor/", "/composer.json",
        "/crossdomain.xml", "/.well-known/security.txt", "/readme.html"
    ]

    all_results: List[ResourceResult] = []
    
    print(f"Starting concurrent tests against {base_url} (Total: {len(hidden_resources)} paths)...\n")

    # Use the context manager for automatic session cleanup
    try:
        with HiddenResourceTester(base_url, follow_redirects=True) as tester:
            
            # Use ThreadPoolExecutor for concurrency
            MAX_WORKERS = min(32, len(hidden_resources))

            with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                future_to_path = {executor.submit(tester.test_resource, resource): resource for resource in hidden_resources}
                
                for future in concurrent.futures.as_completed(future_to_path):
                    path = future_to_path[future]
                    try:
                        result = future.result()
                        all_results.append(result)
                    except Exception as exc:
                        logging.error(f'Path {path} generated an unexpected execution exception: {exc}')
                        all_results.append({
                            "path": path,
                            "url": urljoin(base_url, path),
                            "status_code": -99,
                            "outcome": f"Execution Error: {type(exc).__name__}",
                            "content_snippet": str(exc)[:100]
                        })
    except Exception as e:
        logging.critical(f"Initialization or Executor failed: {e}")
        return

    
    report_results(all_results)
    
if __name__ == "__main__":
    main()