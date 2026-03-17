import csv
import datetime
import logging
import os
import json
from typing import Dict, Any, List
from urllib.robotparser import RobotFileParser

# --- Constants ---
AUDIT_FIELDNAMES: List[str] = ['timestamp', 'action', 'details']

def write_to_audit_trail(action: str, details: Dict[str, Any], audit_file: str = "audit_trail.csv") -> None:
    """
    Writes an entry to the audit trail.

    Args:
    action (str): The action being logged.
    details (Dict[str, Any]): Additional details about the action.
    audit_file (str): The file to write the audit trail to (default: "audit_trail.csv").
    """
    timestamp = datetime.datetime.now().isoformat()
    
    # Use JSON to store details for structured, recoverable logging
    log_entry = {
        'timestamp': timestamp,
        'action': action,
        'details': json.dumps(details)
    }
    
    # Ensure the audit file exists and write header if needed
    if not os.path.exists(audit_file):
        try:
            with open(audit_file, 'w', newline='') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=AUDIT_FIELDNAMES)
                writer.writeheader()  # Write the header row
        except Exception as e:
            logging.error(f"[AUDIT TRAIL] Error creating audit file: {e}")
            return  
            
    try:
        with open(audit_file, 'a', newline='') as csvfile:
            # Use the predefined fieldnames for consistent column order
            writer = csv.DictWriter(csvfile, fieldnames=AUDIT_FIELDNAMES)
            writer.writerow(log_entry)
            logging.debug(f"[AUDIT TRAIL] Logged: {action}")
    except Exception as e:
        logging.error(f"[AUDIT TRAIL] Error writing to audit file: {e}")

def analyze_council(council_name: str, council_info: Dict[str, Any]) -> None:
    """
    Analyzes a council, including a full check of robots.txt permissions.

    Args:
    council_name (str): The name of the council.
    council_info (Dict[str, Any]): Information about the council.
    """
    logging.info(f"Analyzing council: {council_name}")
    council_url = council_info["url"]
    robots_check = council_info.get("robots_check", True)
    # Provide a strong default user agent if none is specified
    user_agent = council_info.get("user_agent", "AGI-Sovereign-v94.1/CouncilScanner")

    # 1. Get Robots.txt and check permissions
    if robots_check:
        rp = RobotFileParser()
        robots_allowed = False

        try:
            robots_url = f"{council_url.rstrip('/')}/robots.txt"
            rp.set_url(robots_url)
            rp.read()
            
            # Check if fetching the main URL is allowed for the configured user_agent
            robots_allowed = rp.can_fetch(user_agent, council_url)

            write_to_audit_trail(
                action="ROBOTS_CHECK",
                details={
                    "council": council_name,
                    "url": council_url,
                    "robots_url": robots_url,
                    "user_agent": user_agent,
                    "allowed": robots_allowed
                }
            )

        except Exception as e:
            logging.error(f"[{council_name}][ROBOTS.TXT] Error reading or parsing: {e}")
            write_to_audit_trail(
                action="ROBOTS_ERROR",
                details={
                    "council": council_name,
                    "url": council_url,
                    "error": str(e)
                }
            )
    else:
        logging.info(f"[{council_name}] Skipping robots.txt check as requested.")

def main() -> None:
    """
    The main function.
    """
    council_urls = {
        "ExampleCouncil": {
            "url": "https://www.example.com",  # Replace with actual URLs
            "wayback_url": "http://web.archive.org/web/",
            "robots_check": True,
            # Updated user agent specification
            "user_agent": "AGI-Sovereign-v94.1 Council Scanner (Research)"
        },
    }
    for council_name, council_info in council_urls.items():
        analyze_council(council_name, council_info)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()