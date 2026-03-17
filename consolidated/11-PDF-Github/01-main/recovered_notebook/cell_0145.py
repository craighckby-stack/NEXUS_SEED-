import requests
import xml.etree.ElementTree as ET
import re
from typing import List, Dict, Any, Optional

# --- Hypothesized function covering the fragmented sitemap logic ---
def extract_urls_from_sitemap(sitemap_url: str) -> List[str]:
    """Fetches a sitemap (or index) and extracts contained URLs recursively."""
    try:
        response = requests.get(sitemap_url, timeout=10)
        response.raise_for_status()
        
        # Strip potential BOM/leading whitespace
        xml_content = response.content.lstrip()
        root = ET.fromstring(xml_content)
        
        urls: List[str] = []
        
        # Namespaces are required for XPath lookup
        sitemap_ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
        
        # Check for sitemap index elements
        sitemap_index_tags = root.findall(f'.//{sitemap_ns}sitemap')

        if sitemap_index_tags:
            # Handle sitemap index (recursive call)
            for sitemap_tag in sitemap_index_tags:
                loc_element = sitemap_tag.find(f'.//{sitemap_ns}loc')
                if loc_element is not None:
                    # Original intent was likely recursion via extend
                    urls.extend(extract_urls_from_sitemap(loc_element.text))
        else:
            # Assume a regular sitemap
            for url_tag in root.findall(f'.//{sitemap_ns}url'):
                loc_element = url_tag.find(f'.//{sitemap_ns}loc')
                if loc_element is not None:
                    urls.append(loc_element.text)
            
        return urls

    except requests.exceptions.RequestException as e:
        print(f"Error fetching sitemap {sitemap_url}: {e}")
        return []

    except ET.ParseError as e:
        print(f"Error parsing sitemap {sitemap_url}: {e}")
        return []

    except Exception as e:
        # Catch unexpected errors, including deep recursion issues
        print(f"An unexpected error occurred processing sitemap {sitemap_url}: {e}")
        return []

def find_bitcoin_patterns(text: str) -> Dict[str, List[str]]:
    """Searches text for refined Bitcoin-related patterns.
    NOTE: True validation requires checksum verification, this is indicative only.
    """
    patterns = {
        # P2PKH (1), P2SH (3), Bech32 (bc1) - increased length checks for robustness
        "Bitcoin Address (Legacy/Segwit)": r"\b(bc1[a-zA-HJ-NP-Z0-9]{39,68}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b",
        
        # WIF/WIF-C Private Key attempts (Starts with 5, K, or L) - HIGH RISK of false positives
        "Potential Bitcoin Private Key (WIF)": r"\b([5KL][1-9A-HJ-NP-Za-km-z]{50,51})\b",
        
        "Bitcoin Transaction ID": r"\b[0-9a-fA-F]{64}\b",
        "BTC Balance Mention": r"\b\d{1,10}(\.\d{1,8})?\s*(BTC)\b", # Explicitly looking for unit
        
        "Extended Public Key (xpub/ypub/zpub)": r"\b(xpub|ypub|zpub)[0-9A-Za-z]{100,115}\b",
        "Extended Private Key (xprv/yprv/zprv)": r"\b(xprv|yprv|zprv)[0-9A-Za-z]{100,115}\b",
    }
    matches: Dict[str, List[str]] = {}
    for name, pattern in patterns.items():
        # Use re.DOTALL to ensure multiline match capability if input text is complex
        found = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        
        # Flatten tuple results if necessary (due to capturing groups in pattern)
        if found and isinstance(found[0], tuple):
             found = [item[0] if isinstance(item, tuple) else item for item in found]
             
        matches[name] = found
    return matches

def analyze_page_for_bitcoin(url: str, document: Any) -> Optional[Dict[str, List[str]]]:
    """Fetches a URL, searches for Bitcoin patterns, and adds results to the Word document"""
    try:
        headers = {'User-Agent': 'SovereignAGI/v94.1 Analysis Agent'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Decode text robustly
        text = response.content.decode(response.encoding or 'utf-8', errors='ignore')
        
        bitcoin_matches = find_bitcoin_patterns(text)
        
        # If any Bitcoin patterns are found, add them to the document
        if any(bitcoin_matches.values()):
            document.add_heading(f"Bitcoin Patterns Found in: {url}", level=2)
            for pattern_name, found_matches in bitcoin_matches.items():
                if found_matches:
                    document.add_paragraph(f"{pattern_name}:")
                    for match in found_matches:
                        document.add_paragraph(f"   - {match}")
            return bitcoin_matches
        return None

    except requests.exceptions.HTTPError as e:
        print(f"Error fetching URL {url}: HTTP Status {e.response.status_code}")
        return None
        
    except requests.exceptions.RequestException as e:
        # Completed the previously truncated handler
        print(f"Error connecting to URL {url}: Connection/Timeout Error: {e}")
        return None

    except Exception as e:
        # Catch-all for parsing or document writing errors
        print(f"An unexpected error occurred processing page {url}: {e}")
        return None