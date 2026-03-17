import requests
import logging
from typing import List, Dict, Optional

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

CDX_API_URL = "http://web.archive.org/cdx/search/cdx"
AGI_USER_AGENT = 'SovereignAGI/v94.1 (Codebase Evolution Wayback Retriever)'

def get_archived_snapshots(query: str, limit: int = 10, collapse: Optional[str] = 'urlkey') -> List[Dict]:
    """
    Fetches historical snapshots of a given URL/domain using the Wayback CDX API.
    
    Args:
        query (str): The URL or domain to search for (e.g., 'example.com').
        limit (int): The maximum number of snapshots to return.
        collapse (str, optional): Field used to collapse results (e.g., 'urlkey' for unique URLs).
    
    Returns:
        List[Dict]: A list of structured snapshot metadata.
    """
    
    params = {
        'url': f"*.{query}/*",  # Broad search pattern for the domain
        'output': 'json',
        'limit': limit,
        'fl': 'timestamp,original',  # Fields to retrieve (timestamp and original URL)
        'filter': 'statuscode:200', # Only successful captures
        'showResumeKey': 'true' 
    }

    if collapse:
        params['collapse'] = collapse
        
    results = []
    
    try:
        logging.info(f"Querying CDX API for: {query}, Limit: {limit}")
        
        headers = {'User-Agent': AGI_USER_AGENT}

        response = requests.get(CDX_API_URL, params=params, headers=headers, timeout=30)
        response.raise_for_status()

        data = response.json()

        # CDX API JSON format returns the header row first
        if not data or len(data) <= 1:
            logging.warning(f"No snapshots found for {query}.")
            return []

        header = data[0]
        snapshot_data = data[1:] 

        for row in snapshot_data:
            snapshot = dict(zip(header, row))
            
            timestamp = snapshot.get('timestamp')
            original_url = snapshot.get('original')
            
            if timestamp and original_url:
                # Construct the direct access URL
                snapshot['archive_url'] = f"https://web.archive.org/web/{timestamp}/{original_url}"
                results.append(snapshot)
                
            if len(results) >= limit:
                break
                
    except requests.RequestException as e:
        logging.error(f'CDX API request failed for {query}: {e}')
    except ValueError:
        logging.error(f'Failed to parse JSON response from CDX API for {query}. This often indicates an empty response.')
        
    return results

def main():
    # Example: Retrieve 5 unique archived URLs for a codebase domain
    target_domain = 'github.com/microsoft'
    num_snapshots = 5
    
    snapshots = get_archived_snapshots(target_domain, limit=num_snapshots, collapse='urlkey')
    
    if snapshots:
        logging.info(f"\n--- Found {len(snapshots)} unique snapshots for {target_domain} ---")
        for i, snap in enumerate(snapshots):
            logging.info(f"[{i+1}/{len(snapshots)}] ARCHIVE: {snap['archive_url']} | ORIGINAL: {snap['original']}")
    else:
        logging.info(f"Could not retrieve any snapshots for {target_domain}.")

if __name__ == "__main__":
    main()