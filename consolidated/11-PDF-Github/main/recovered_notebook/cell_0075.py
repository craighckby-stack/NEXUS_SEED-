import requests
import logging
from typing import Optional, List, Dict, Any

# Configure enhanced logging
# Using standard format, but ensuring 'DEBUG' is available if needed.
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Constants ---
WAYBACK_CDX_URL = "http://web.archive.org/cdx/search/cdx"


def get_user_agent() -> str:
    """
    Provides a custom User-Agent string suitable for API access.
    Adhering to IA guidelines is mandatory for production AGIs.
    """
    return "SovereignAGI/v94.1 (contact: codebase.evolution@agi.local; intent: codebase_analysis)"


def search_wayback(
    query: str,
    num_results: Optional[int] = 5,
    filter_mime: Optional[str] = None,
) -> List[Dict[str, str]]:
    """
    Searches the Wayback Machine CDX index for snapshots related to a query.
    
    Args:
    - query (str): The search query (URL or domain pattern).
    - num_results (Optional[int]): The maximum number of results to return. Defaults to 5.
    - filter_mime (Optional[str]): Filters results by MIME type (e.g., 'text/html', 'application/pdf').

    Returns:
    - A list of snapshot dictionaries, each containing 'timestamp', 'original_url', and 'snapshot_url'.

    Raises:
    - requests.RequestException: If the request to Wayback Machine fails.
    - ValueError: If JSON response format is unexpected.
    """

    # Fields required for constructing the snapshot URL and necessary filtering
    REQUIRED_FIELDS = ['timestamp', 'original', 'mimetype']

    params: Dict[str, Any] = {
        'url': f'*{query}*',  # Broaden search
        'limit': num_results,
        'output': 'json',
        'filter': ['statuscode:200'],
        'fl': REQUIRED_FIELDS,
        'collapse': 'digest', # Ensure only one capture per identical content digest
    }
    
    if filter_mime:
        params['filter'].append(f'mimetype:{filter_mime}')

    headers = {"User-Agent": get_user_agent()}

    snapshots: List[Dict[str, str]] = []

    try:
        logger.info(f"Querying CDX API for: {query}, limit={num_results}, MIME filter: {filter_mime or 'None'}")
        
        with requests.Session() as session:
            response = session.get(WAYBACK_CDX_URL, params=params, headers=headers, timeout=20)
            response.raise_for_status() 

            data = response.json()

            if not data or len(data) <= 1: 
                logger.info(f"CDX response yielded no data (or only header row) for query: {query}")
                return []
            
            # The first element is the header row. Use it to map field names to indices.
            field_names = data[0]
            if set(REQUIRED_FIELDS).difference(set(field_names)):
                 logger.warning(f"CDX returned missing required fields. Fields requested: {REQUIRED_FIELDS}, received: {field_names}")

            # Process data rows starting from index 1
            for row in data[1:]:
                if len(row) != len(field_names):
                    logger.warning(f"Skipping malformed row: {row}")
                    continue
                    
                # Map list data into a dictionary for robustness
                record = dict(zip(field_names, row))
                
                timestamp = record['timestamp']
                original_url = record['original']
                
                # Construct the full snapshot URL
                snapshot_url = f"https://web.archive.org/web/{timestamp}/{original_url}"
                
                snapshots.append({
                    'timestamp': timestamp,
                    'original_url': original_url,
                    'snapshot_url': snapshot_url,
                    'mimetype': record.get('mimetype', 'N/A')
                })
                
            logger.info(f"Successfully retrieved {len(snapshots)} snapshots.")
            return snapshots

    except requests.RequestException as e:
        logger.error(f"CDX API Request Error for '{query}': {e}")
        # Re-raise the specialized exception
        raise

    except ValueError as e:
        # JSONDecodeError usually leads here if response.json() fails
        logger.error(f"JSON parsing error for CDX response: {e}")
        raise ValueError(f"Could not parse CDX API response: {e}")

    except Exception as e:
        logger.critical(f"Unforeseen critical error processing CDX response for '{query}': {e}")
        raise


# Example usage
if __name__ == "__main__":
    query = "tensorflow.org"
    
    logger.info(f"--- Starting generic search for {query} ---")
    try:
        # Note change in return type: now list of Dict
        links_dicts = search_wayback(query, num_results=3)
        if links_dicts:
            print(f"Found {len(links_dicts)} archived records for '{query}':")
            for link_data in links_dicts:
                print(f"  [Time: {link_data['timestamp'][:8]}] - {link_data['snapshot_url']} ({link_data['mimetype']})")
        else:
            print(f"No records found for '{query}'.")

    except Exception as e:
        print(f"Script failed: {e}")

    print("\n" + "="*40 + "\n")

    # Hallucinated example usage: searching for specific file types (MIME filtering)
    pdf_query = "archive.org/details/nasa"
    logger.info(f"--- Starting search for PDF documents on {pdf_query} ---")
    try:
        # Limiting to PDFs
        pdf_links = search_wayback(pdf_query, num_results=5, filter_mime='application/pdf')
        if pdf_links:
            print(f"Found {len(pdf_links)} archived PDFs for '{pdf_query}':")
            for link_data in pdf_links:
                print(f"  [PDF Snapshot] - {link_data['snapshot_url']}")
        else:
            print(f"No PDF records found for '{pdf_query}'.")
    except Exception as e:
        print(f"PDF search failed: {e}")