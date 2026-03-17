import logging
import requests
import json
from urllib.parse import quote
from robotparser import RobotFileParser

def fetch_robots_txt(council_url, user_agent):
    """
    Fetches robots.txt for the given council URL using consistent network tooling (requests).

    Args:
        council_url (str): The base URL of the council (e.g., https://example.com).
        user_agent (str): The user agent to use for the request.

    Returns:
        RobotFileParser: The parsed robots.txt, or None if retrieval fails.
    """
    rp = RobotFileParser()
    robots_url = f"{council_url}/robots.txt"
    
    try:
        headers = {'User-Agent': user_agent}
        # Use requests for unified network handling and control over user agent/timeout
        response = requests.get(robots_url, headers=headers, timeout=10)
        
        # Standard practice: If robots.txt is missing (404/403), treat rules as permissive.
        if response.status_code in (404, 403):
            logging.info(f"[ROBOTS] robots.txt not found/forbidden for {council_url} (Status: {response.status_code}). Rules treated as permissive.")
            return rp # Empty parser defaults to allow

        response.raise_for_status() 

        # Set the URL so the parser understands relative disallow directives if present
        rp.set_url(robots_url)
        
        # Parse content line by line
        rp.parse(response.text.splitlines())
        logging.info(f"[ROBOTS] Successfully retrieved and parsed robots.txt for {council_url}")
        return rp
        
    except requests.exceptions.Timeout:
        logging.warning(f"[ROBOTS] Timeout retrieving robots.txt for {council_url}")
    except requests.exceptions.RequestException as e:
        logging.warning(f"[ROBOTS] Error retrieving robots.txt for {council_url}: {e}")
    except Exception as e:
        logging.error(f"[ROBOTS] Unexpected error processing robots.txt: {e}")
        
    return None

def fetch_wayback_data(council_url, user_agent):
    """
    Fetches Wayback Machine data for the given council URL.

    Args:
        council_url (str): The URL of the council.
        user_agent (str): The user agent to use for the request.

    Returns:
        tuple: A tuple containing the timestamp and snapshot URL, or (None, None) if an error occurs.
    """
    try:
        wayback_api_url = f"http://archive.org/wayback/available?url={quote(council_url)}"
        wayback_response = requests.get(wayback_api_url, headers={'User-Agent': user_agent}, timeout=15) # Added timeout
        wayback_response.raise_for_status()
        wayback_data = json.loads(wayback_response.text)
        if wayback_data and wayback_data.get("archived_snapshots", {}).get("closest", None):
            closest_snapshot = wayback_data["archived_snapshots"]["closest"]
            timestamp = closest_snapshot["timestamp"]
            snapshot_url = closest_snapshot["url"]
            logging.info(f"[WAYBACK] Found snapshot: {snapshot_url} (Timestamp: {timestamp})")
            return timestamp, snapshot_url
        else:
            logging.warning(f"[WAYBACK] No snapshot found for {council_url}")
            return None, None
    except requests.exceptions.RequestException as e:
        logging.warning(f"[WAYBACK] Error fetching Wayback Machine data: {e}")
    except json.JSONDecodeError as e:
        logging.error(f"[WAYBACK] Error decoding Wayback Machine JSON: {e}")
    return None, None

def is_allowed_by_robots(url, rp, user_agent):
    """
    Checks if the given URL is allowed by the robots.txt.

    Args:
        url (str): The URL to check.
        rp (RobotFileParser): The parsed robots.txt.
        user_agent (str): The user agent to use for the request.

    Returns:
        bool: True if the URL is allowed, False otherwise.
    """
    if rp is None:
        # If retrieval failed entirely, assume permissive unless policies dictate strict refusal.
        # Defaulting to True is standard. 
        return True
    return rp.can_fetch(user_agent, url)

def main(council_url, user_agent, pdf_url):
    rp = fetch_robots_txt(council_url, user_agent)
    timestamp, snapshot_url = fetch_wayback_data(council_url, user_agent)
    
    if snapshot_url: 
        logging.info(f"[MAIN] Wayback data available: {timestamp}")
        
    if not is_allowed_by_robots(pdf_url, rp, user_agent):
        logging.warning(f"[ROBOTS] Skipping {pdf_url} due to robots.txt restriction.")
        # write_to_audit_trail("PDF Download Blocked by Robots")
    else:
        logging.info(f"[ROBOTS] {pdf_url} is allowed by robots.txt.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    council_url = "https://example.com"
    user_agent = "SovereignAGI/v94.1 (Codebase Evolution Task)"
    pdf_url = "https://example.com/documents/simulated_pdf:clean_pdf.pdf"
    main(council_url, user_agent, pdf_url)