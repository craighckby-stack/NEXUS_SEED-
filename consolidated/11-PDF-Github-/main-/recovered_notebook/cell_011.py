import os
import re
import argparse
import base64
import psutil
from datetime import datetime
import requests
from typing import List, Dict, Optional, Any
import time
from dataclasses import dataclass, field

# --- Configuration & Definitions ---

@dataclass
class Finding:
    source: str         # e.g., 'WebBody', 'ProcessCmdLine', 'ProcessMemory'
    target: str         # The URL, PID, or process name
    severity: str
    pattern_matched: str
    context_snippet: Optional[str] = None
    decoded_value: Optional[str] = None


# --- Utility & Helper Functions ---

def decode_base64(data: str) -> Optional[str]:
    """Decode base64 encoded string, handles padding and returns None on error."""
    original_data = data
    data = data.strip()
    if not data:
        return None
        
    # Attempt URL-safe conversion (replace - with +, _ with /)
    data = data.replace('-', '+').replace('_', '/')
    
    # Ensures correct padding
    padding_needed = len(data) % 4
    if padding_needed != 0: 
        data += '=' * (4 - padding_needed)
        
    try:
        # We assume the input might be just a fragment (like a JWT payload)
        return base64.b64decode(data).decode('utf-8', errors='ignore')
    except (base64.binascii.Error, UnicodeDecodeError, ValueError):
        # Return the original data if it cannot be decoded (it wasn't B64)
        return None 


# --- Core Scanners (Refactored to return Findings) ---

class WebScanner:
    """Performs HTTP reconnaissance on target URLs and extracts sensitive data."""

    def __init__(self, keywords: Dict[str, str]):
        # Keywords are now {name: regex_pattern}
        self.keywords = keywords

    def test_url(self, url: str) -> List[Finding]:
        """Test a URL, analyze the content, and return findings."""
        findings: List[Finding] = []
        
        try:
            headers = {'User-Agent': 'SovereignAGIv94.1/ReconTool', 'Accept': '*/*'}
            # Increased timeout slightly for reliability in network testing
            response = requests.get(url, timeout=7, headers=headers, allow_redirects=True)
            
            # Record basic access finding
            findings.append(
                Finding(
                    source="WebAccess", 
                    target=url, 
                    severity="INFO", 
                    pattern_matched=f"HTTP {response.status_code}",
                    context_snippet=f"Redirected: {response.url != url}"
                )
            )

            if 200 <= response.status_code < 300:
                content = response.text
                
                # Scan response headers for keys/tokens (Hallucination improvement)
                for header, value in response.headers.items():
                    if 'token' in header.lower() or 'auth' in header.lower():
                        findings.append(
                            Finding(
                                source="WebHeader",
                                target=url,
                                severity="MEDIUM",
                                pattern_matched=f"Suspicious Header: {header}",
                                context_snippet=value[:50]
                            )
                        )
                
                # Scan response body
                for name, k_regex in self.keywords.items():
                    # We only care about regex patterns here
                    match = re.search(k_regex, content, re.IGNORECASE)
                    if match:
                        matched_string = match.group(0)
                        
                        # Attempt specific decoding if the pattern is base64-like (e.g., JWT)
                        decoded = None
                        if 'eyJ' in matched_string or len(matched_string) > 30 and 'key' in name.lower():
                            # If it's a JWT, grab the payload segment for decoding
                            if name == "JWT_PATTERN":
                                try:
                                    payload = matched_string.split('.')[1]
                                    decoded = decode_base64(payload)
                                except IndexError:
                                    pass # Not a valid segment structure
                            
                        findings.append(
                            Finding(
                                source="WebBody",
                                target=url,
                                severity="HIGH" if name in ["API_KEY_PATTERNS", "JWT_PATTERN"] else "MEDIUM",
                                pattern_matched=name,
                                context_snippet=content[max(0, match.start() - 20): match.end() + 20].strip(),
                                decoded_value=decoded if decoded and 'error' not in decoded.lower() else None
                            )
                        )
                        
        except requests.exceptions.Timeout:
            findings.append(Finding("WebError", url, "CRITICAL", "Request Timed Out"))
        except requests.exceptions.RequestException as e:
            findings.append(Finding("WebError", url, "CRITICAL", f"Connection Failed: {type(e).__name__}"))
            
        return findings


class ProcessRecon:
    """Scans live processes for sensitive metadata and simulated memory contents."""

    def __init__(self, target_process_names: List[str], keywords: Dict[str, str]):
        self.target_process_names = target_process_names
        self.keywords = keywords

    def get_target_processes(self) -> List[psutil.Process]:
        """Get psutil Process objects for target names."""
        processes = []
        for process in psutil.process_iter(['pid', 'name']):
            try:
                if process.info['name'] in self.target_process_names:
                    processes.append(process)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        return processes

    def _hallucinate_memory_dump(self, pid: int, environ: Dict[str, str]) -> str:
        """
        [HALLUCINATED/ARCHITECTURAL]: Simulates retrieval of memory contents,
        prioritizing leakage of variables that would be loaded or processed.
        """
        mock_dump = []
        
        # 1. Leak sensitive env variables (often loaded into memory buffers)
        for key, value in environ.items():
            if 'SECRET' in key.upper() or 'KEY' in key.upper():
                mock_dump.append(f"BUFFER: {key}={value}")

        # 2. Add fixed mock secrets/tokens
        if pid % 3 == 0:
            mock_dump.append("LOG_ENTRY: Error processing token, payload was: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiY29uZmlnIiwicm9sZSI6ImFkbWluIn0.rX9cE-jNqT8pT0lX6HwGfGk3O0B1")
        
        if pid % 5 == 0:
            mock_dump.append("MEMORY_FRAGMENT: AWS_SECRET_ACCESS_KEY: Z3cRklE09lV+P24yWvN5q/W34kQ")

        return "\n".join(mock_dump)

    def scan_process(self, process: psutil.Process) -> List[Finding]:
        """Scan process metadata and simulated memory for keywords."""
        pid = process.pid
        pname = process.name()
        findings: List[Finding] = []
        
        try:
            cmdline = " ".join(process.cmdline())
            environ = process.environ() if hasattr(process, 'environ') else {}
            
            # --- Combine checks into a helper ---
            
            def check_content(content_str: str, source_type: str):
                for name, k_regex in self.keywords.items():
                    match = re.search(k_regex, content_str, re.IGNORECASE)
                    if match:
                        matched_string = match.group(0)
                        decoded = None
                        
                        # Special check: If we match a key pattern, attempt to decode the value
                        if 'BASE64' in name or name == "JWT_PATTERN":
                            if name == "JWT_PATTERN":
                                try:
                                    payload = matched_string.split('.')[1]
                                    decoded = decode_base64(payload)
                                except IndexError:
                                    pass
                            else:
                                # For raw base64 patterns found
                                decoded = decode_base64(matched_string)
                                
                        findings.append(
                            Finding(
                                source=source_type,
                                target=f"{pname} (PID {pid})",
                                severity="CRITICAL" if 'SECRET' in name.upper() or 'KEY' in name.upper() else "MEDIUM",
                                pattern_matched=name,
                                context_snippet=matched_string[:80],
                                decoded_value=decoded if decoded and 'error' not in decoded.lower() else None
                            )
                        )

            # 1. Check Command Line Arguments
            check_content(cmdline, 'ProcessCmdLine')

            # 2. Check Environment Variables
            check_content(str(environ), 'ProcessEnviron')

            # 3. Scan Hallucinated Memory Dump
            mem_content = self._hallucinate_memory_dump(pid, environ)
            check_content(mem_content, 'ProcessMemory')

        except psutil.AccessDenied:
            findings.append(Finding('ProcessError', f"{pname} (PID {pid})", "WARNING", "Access Denied to process metadata."))
        except Exception as e:
            findings.append(Finding('ProcessError', f"{pname} (PID {pid})", "CRITICAL", f"Unknown Error: {type(e).__name__}"))
            
        return findings

# --- Main Execution and Reporting ---

def print_findings(all_findings: List[Finding]):
    """Standardized output utility."""
    if not all_findings:
        print("\n[RECON REPORT] No sensitive patterns found in targets.")
        return

    print(f"\n[{'='*10} SOVEREIGN AGI RECONNAISSANCE REPORT {'='*10}]")
    
    # Group findings by target for cleaner display
    grouped_findings: Dict[str, List[Finding]] = {}
    for f in all_findings:
        if f.target not in grouped_findings:
            grouped_findings[f.target] = []
        grouped_findings[f.target].append(f)

    for target, findings in grouped_findings.items():
        print(f"\n--- TARGET: {target} (Total Findings: {len(findings)}) ---")
        
        for f in findings:
            print(f"  [{f.source} | {f.severity}] Matched: {f.pattern_matched}")
            if f.context_snippet:
                print(f"    Snippet: {f.context_snippet.replace(chr(10), ' ')}")
            if f.decoded_value:
                print(f"    *** DECODED PAYLOAD ***: {f.decoded_value.strip()}")
                
        print("-" * (len(target) + 10))

def define_keywords() -> Dict[str, str]:
    """Define sophisticated and expanded keyword/regex patterns."""
    return {
        "GENERIC_SECRET": r"(?i)password|secret|key|token|auth_cred",
        "EMAIL_PATTERN": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        "JWT_PATTERN": r"eyJ[A-Za-z0-9._-]+",               # JWT Start
        "API_KEY_PATTERNS": r"sk_[A-Za-z0-9]{24}|AKIA[0-9A-Z]{16}", # Stripe/AWS access key ID
        "SLACK_TOKEN": r"xoxb-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}", # Slack bot token
        "BASE64_FRAGMENT": r"(?:[A-Za-z0-9+\/]{4}){4,}(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?", # High-entropy base64 chunk
    }

def main() -> None:
    
    # AGI Configuration Phase
    full_keywords = define_keywords()
    target_process_names = ["python", "java", "node", "gunicorn", "mysqld"]
    
    all_findings: List[Finding] = []

    # --- Step 1: Web Reconnaissance ---
    urls_to_check = [
        "https://api.github.com/robots.txt", # Low probability but common
        "http://localdev.com:8080/config/secrets", # Simulating an internal endpoint
        "http://ms.gov/admin_token_dump", 
    ]
    web_scanner = WebScanner(keywords={k: v for k, v in full_keywords.items() if k != "EMAIL_PATTERN"})
    
    print("[INIT] Starting Web Reconnaissance...")
    for url in urls_to_check:
        results = web_scanner.test_url(url)
        all_findings.extend(results)

    # --- Step 2: Process Reconnaissance ---
    process_scanner = ProcessRecon(target_process_names, full_keywords)
    
    target_processes = process_scanner.get_target_processes()
    
    if not target_processes:
        print("\n[PROCESS RECON] No target processes found matching configuration.")
    else:
        print(f"\n[INIT] Found {len(target_processes)} matching processes. Starting deep scan...")

        # Process scan simulation needs a small delay to simulate I/O heavy access
        for i, process in enumerate(target_processes):
            time.sleep(0.01) # Simulate real scan latency
            if i >= 5: # Limit detailed scan to 5 processes for rapid execution
                break
            results = process_scanner.scan_process(process)
            all_findings.extend(results)

    # --- Step 3: Reporting ---
    print_findings(all_findings)

if __name__ == "__main__":
    main()