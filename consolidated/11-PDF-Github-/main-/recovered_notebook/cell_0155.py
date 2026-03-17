import logging
import requests
import json
from typing import Dict, Any, Optional

def fetch_robots_txt(council_url: str, robots_check: bool) -> Optional[str]:
    """
    Fetches the raw content of the robots.txt file from the given council URL.
    
    Args:
    council_url (str): The URL of the council.
    robots_check (bool): Whether to check for robots.txt.
    
    Returns:
    Optional[str]: The raw robots.txt content, or None if not found or check skipped.
    """
    if not robots_check:
        return None
    
    try:
        # Fix potential bug where council_url doesn't end with a slash
        robots_url = council_url.rstrip('/') + '/robots.txt'
        response = requests.get(robots_url, timeout=5)
        response.raise_for_status()
        
        # Robots.txt is plain text, returning content directly
        return response.text
        
    except requests.exceptions.RequestException as e:
        logging.warning(f"[ROBOTS] Could not retrieve robots.txt for {council_url}: {e}")
        return None

def fetch_wayback_snapshot(council_url: str) -> Optional[Dict[str, str]]:
    """
    Fetches the closest Wayback Machine snapshot for the given council URL.
    
    Args:
    council_url (str): The URL of the council.
    
    Returns:
    Optional[Dict[str, str]]: A dictionary containing the snapshot URL and timestamp, or None if not found.
    """
    try:
        wayback_api_url = f"http://archive.org/wayback/available?url={council_url}"
        # Increased robustness by adding explicit timeout
        wayback_response = requests.get(wayback_api_url, timeout=10)
        wayback_response.raise_for_status()
        wayback_data = json.loads(wayback_response.text)
        
        if wayback_data and wayback_data.get("archived_snapshots", {}).get("closest", None):
            closest_snapshot = wayback_data["archived_snapshots"]["closest"]
            timestamp = closest_snapshot["timestamp"]
            snapshot_url = closest_snapshot["url"]
            logging.info(f"[WAYBACK] Found snapshot: {snapshot_url} (Timestamp: {timestamp})")
            return {"snapshot_url": snapshot_url, "timestamp": timestamp}
        else:
            logging.warning(f"[WAYBACK] No snapshot found for {council_url}")
            return None
    except requests.exceptions.RequestException as e:
        logging.warning(f"[WAYBACK] Error fetching Wayback Machine snapshot: {e}")
        return None

def main() -> None:
    """
    The main function that analyzes councils and fetches their robots.txt and Wayback Machine snapshots.
    """
    council_urls = {
        "ExampleCouncil": {
            "url": "https://www.example.com",
            "wayback_url": "http://web.archive.org/web/",
            "robots_check": True
        },
    }
    
    for council_name, council_info in council_urls.items():
        logging.info(f"Analyzing council: {council_name}")
        council_url = council_info["url"]
        robots_check = council_info.get("robots_check", True)
        
        # Fetch robots.txt
        rp_content = fetch_robots_txt(council_url, robots_check)
        if rp_content:
            # Log size/content snippet instead of just 'retrieved'
            logging.info(f"[ROBOTS] Retrieved robots.txt for {council_url}. Size: {len(rp_content)} bytes.")
        
        # Fetch Wayback Machine snapshot
        snapshot_data = fetch_wayback_snapshot(council_url)
        if snapshot_data:
            # Integrated audit logging directly into main after removing redundant wrapper function
            logging.info(f"[AUDIT TRAIL] Snapshot found for {council_url}: {snapshot_data['snapshot_url']} (Timestamp: {snapshot_data['timestamp']})")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
    main()