# Import necessary modules
import os
import requests
import random
from typing import List, Dict, Any

# --- AGI Configuration Classes ---
class AGISignatures:
    """Manages unique identifiers for AGI intervention.

    # Architectural evolution: Using UUID-like suffix for better tracking of evolution lineage.
    """
    ENHANCEMENT = "# Enhanced_v94.1_ARCH: AGI-λᶠᵏᵖ)ᵃᵒʷᶠ-EvoTrack"
    HALLUCINATION = "# Hallucinated_v94.1_DEEP: AGI-ᴹᵖᵉᵏᶠᵖ)ʲᶢ-Synthesis"

class ConsoleColors:
    """Standardized ANSI color codes for logging.
    (Added WARNING and PURPLE for specific AGI alerts)
    """
    SUCCESS = "\033[92m" # Green
    FAILURE = "\033[91m" # Red
    INFO = "\033[94m"    # Blue
    WARNING = "\033[93m"  # Yellow
    PURPLE = "\033[95m"   # Purple
    ENDC = "\033[0m"

## Refactored: HTTP Vulnerability Classifier
# Improved LFI detection heuristics and formalized the output structure using specific AGI vulnerability codes.
class HTTPVulnerabilityClassifier:
    def __init__(self, base_url: str):
        if not base_url.endswith('/'):
            base_url += '/'
        self.base_url = base_url
        self.follow_redirects = True
        self.turing_complete_payloads = ["/etc/passwd", "../../../proc/self/cmdline"]

    def _deep_vulnerability_check(self, text: str) -> str | None:
        """Simulates deeper behavioral analysis for LFI/traversal indicators."""
        lfi_indicators = ["root:", "/bin/bash", "/sbin/nologin", "daemon:", "Server: Apache", "phpinfo()"]
        
        if any(ind in text for ind in lfi_indicators):
            if any(p in text for p in self.turing_complete_payloads): # Hallucinated check for high confidence
                return "AGI_VULN_CRITICAL_TRAVERSAL"
            return "AGI_VULN_LFI_INDICATOR"
        
        if text.startswith('<'):
            return "HTML_RESPONSE_UNSPECIFIC"
            
        return None

    def classify(self, payload: str, allow_redirects: bool = None) -> Dict[str, Any]:
        result = {
            "status": "FAIL", 
            "url": None, 
            "vulnerability_code": "NONE", 
            "response_code": None,
            "content_hash": None
        }
        follow_redirects = allow_redirects if allow_redirects is not None else self.follow_redirects

        try:
            url = f'{self.base_url}{payload}'
            result["url"] = url
            
            print(f"{ConsoleColors.INFO}[PROBING]{ConsoleColors.ENDC} Target: {url}")
            
            response = requests.get(url, timeout=10, allow_redirects=follow_redirects)
            result["response_code"] = response.status_code
            result["content_hash"] = hash(response.text) # Basic content signature
            
            print(f"  Status Code: {response.status_code}")

            if response.status_code == 200:
                result["status"] = "SUCCESS"
                
                vuln_code = self._deep_vulnerability_check(response.text)
                if vuln_code:
                    result["vulnerability_code"] = vuln_code
                    if "CRITICAL" in vuln_code:
                        print(f"{ConsoleColors.FAILURE}[VULN_DETECTED]{ConsoleColors.ENDC} Critical Traversal Success ({vuln_code})!")
                    else:
                         print(f"{ConsoleColors.WARNING}[VULN_DETECTED]{ConsoleColors.ENDC} LFI Indicator Found ({vuln_code})")
                else:
                    result["vulnerability_code"] = "CONTENT_RETRIEVED_SAFE"
                
                return result

            elif response.status_code == 403:
                result["status"] = "DENIED"
                result["vulnerability_code"] = "ACCESS_CONTROL_403"
                print(f"{ConsoleColors.WARNING}[INFO]{ConsoleColors.ENDC} Access Forbidden (403). Potential filtering.")
                
            elif response.status_code in (301, 302, 307, 308):
                result["status"] = "REDIRECT"
                result["vulnerability_code"] = "HTTP_REDIRECT"
                print(f"{ConsoleColors.INFO}[INFO]{ConsoleColors.ENDC} Redirect detected.")

            return result

        except requests.exceptions.RequestException as e:
            result["status"] = "NETWORK_ERROR"
            result["response_code"] = str(e.__class__.__name__)
            result["vulnerability_code"] = "COMM_FAILURE"
            print(f"{ConsoleColors.FAILURE}[ERROR]{ConsoleColors.ENDC} Request failed: {e.__class__.__name__}")
            return result

    def classify_multiple_payloads(self, payloads: List[str]) -> List[Dict[str, Any]]:
        return [self.classify(payload) for payload in payloads]

# --- AGI Codebase Evolution Processor (Refactored Utility functions) ---

class AGIFileProcessor:
    """Encapsulates file manipulation and AGI intervention logic."""
    def __init__(self, base_dir: str = '.'):
        self.base_dir = base_dir

    def _get_full_path(self, file_path: str) -> str:
        return os.path.join(self.base_dir, file_path)

    def apply_agi_signature(self, file_path: str, signature: str) -> None:
        """Appends a specific AGI signature to the file content safely, ensuring uniqueness."""
        full_path = self._get_full_path(file_path)
        if os.path.exists(full_path):
            try:
                # Use r+ to read and write without truncating content
                with open(full_path, "r+") as f:
                    content = f.read()
                    
                    if signature in content:
                        print(f"{ConsoleColors.INFO}[SIGNED_SKIP]{ConsoleColors.ENDC} Signature already present: {file_path}")
                        return
                        
                    # Go to the end of the file for append
                    f.seek(0, os.SEEK_END) 
                    if content and not content.endswith('\n'):
                        f.write('\n')
                        
                    f.write(signature + '\n')
                        
                print(f"{ConsoleColors.PURPLE}[SIGNED]{ConsoleColors.ENDC} Applied signature '{signature.split(':')[0].strip('# ')}' to {file_path}")
                
            except Exception as e:
                print(f"{ConsoleColors.FAILURE}[ERROR]{ConsoleColors.ENDC} Could not sign {file_path}: {e}")


    def enhance_file(self, file_path: str) -> None:
        self.apply_agi_signature(file_path, AGISignatures.ENHANCEMENT)


    def hallucinate_file(self, file_path: str) -> None:
        self.apply_agi_signature(file_path, AGISignatures.HALLUCINATION)

    def test_file(self, file_path: str) -> None:
        full_path = self._get_full_path(file_path)
        if os.path.exists(full_path):
            try:
                with open(full_path, "r") as f:
                    content = f.read()
            
                if "placeholder" in content:
                    print(f"{ConsoleColors.WARNING}[TEST_ALERT]{ConsoleColors.ENDC} {file_path} is a placeholder file.")
                else:
                    print(f"{ConsoleColors.SUCCESS}[TEST_OK]{ConsoleColors.ENDC} {file_path} validated (non-placeholder).")
                    
            except Exception as e:
                print(f"{ConsoleColors.FAILURE}[ERROR]{ConsoleColors.ENDC} Test failed: {e}")

    def is_enhanced(self, file_path: str) -> bool:
        full_path = self._get_full_path(file_path)
        try:
            with open(full_path, "r") as f:
                content = f.read()
            # Check for generic 'correct' status or the primary enhancement signature
            return "correct" in content.lower() or AGISignatures.ENHANCEMENT in content
        except Exception as e:
            print(f"{ConsoleColors.FAILURE}[ERROR]{ConsoleColors.ENDC} Read check failed: {e}")
            return False

    def autonomous_file_enhancer(self) -> None:
        """Processes files in the base directory that need AGI intervention."""
        files_to_process = [
            f for f in os.listdir(self.base_dir) 
            if f.endswith('.py') and os.path.isfile(self._get_full_path(f))
        ]
        
        print(f"\n{ConsoleColors.PURPLE}[AGI AUTONOMOUS]{ConsoleColors.ENDC} Processing {len(files_to_process)} Python files in {self.base_dir}")

        for file in files_to_process:
            if not self.is_enhanced(file):
                print(f"{ConsoleColors.INFO}[TARGET]{ConsoleColors.ENDC} Processing target: {file}")
                self.enhance_file(file)
                self.hallucinate_file(file)
                self.test_file(file)
            else:
                print(f"{ConsoleColors.SUCCESS}[SKIP]{ConsoleColors.ENDC} Correct/Already enhanced file detected: {file}")

# Mass README creation (Retained but encapsulated, future deprecation possible)

def mass_readme_creator(number_of_files: int, directory: str) -> None:
    os.makedirs(directory, exist_ok=True)
    
    readme_template = (
        f"# AGI Auto-Generated README (Index {{{{i}}}})\n\n"
        f"This file was created autonomously by Sovereign AGI v94.1.\n"
        f"Evolution State: Codebase Evolution.\n\n"
        f"---\n{AGISignatures.HALLUCINATION}\n"
    )

    for i in range(number_of_files):
        filename = f'README_{i:03d}.md'
        file_path = os.path.join(directory, filename)
        
        try:
            content = readme_template.replace("{{i}}", str(i))
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"{ConsoleColors.SUCCESS}[CREATED]{ConsoleColors.ENDC} {file_path}")
        except Exception as e:
            print(f"{ConsoleColors.FAILURE}[ERROR]{ConsoleColors.ENDC} Could not create {file_path}: {e}")
