import json
import logging
from typing import Dict, List

PERSISTENT_MEMORY_FILE = 'persistent_memory.json'

def load_persistent_memory() -> Dict:
    """Loads persistent memory from file."""
    try:
        with open(PERSISTENT_MEMORY_FILE, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return {'threat_indicators': [], 'site_status': {}}

def save_persistent_memory(memory: Dict) -> None:
    """Saves persistent memory to file."""
    try:
        with open(PERSISTENT_MEMORY_FILE, 'w') as file:
            json.dump(memory, file, indent=4)
    except Exception as error:
        logging.error(f"Error saving persistent memory: {error}")

def analyze_robots_txt(robots_content: str, site_url: str, verbose: bool = False) -> List[Dict]:
    """Analyzes robots.txt content for potential threats."""
    threat_indicators = []
    if not robots_content:
        return threat_indicators

    def add_threat(threat_type: str, description: str, severity: str = 'medium', details: str = None) -> None:
        """Adds a threat indicator."""
        indicator = {
            'type': threat_type,
            'description': description,
            'severity': severity
        }
        if details:
            indicator['details'] = details
        threat_indicators.append(indicator)

    rules = [
        ("Disallow: /admin", 'critical_path_disallowed', 'Admin path disallowed - potential misconfiguration'),
        ("Disallow: /wp-admin", 'critical_path_disallowed', 'WordPress admin path disallowed - potential'),
        ("Disallow: /*.php", 'wildcard_disallow', 'Wildcard disallow for .php files. This might indicate penetration testing'),
        (len(robots_content) > 10000, 'large_robots_txt', 'Unusually large robots.txt file - might indicate penetration testing'),
        ("Allow:" in robots_content, 'allow_directive_present', 'Allow directives found in robots.txt - potential misconfiguration'),
        ("Crawl-delay:" in robots_content, 'crawl_delay_present', 'Crawl-delay directive found - indicates rate limiting')
    ]

    for rule in rules:
        if rule[0]:
            add_threat(rule[1], rule[2])

    return threat_indicators

def main():
    # Example usage
    robots_content = """
User-agent: *
Disallow: /admin
Allow: /public
"""
    site_url = "https://example.com"
    threat_indicators = analyze_robots_txt(robots_content, site_url)
    print(threat_indicators)

if __name__ == "__main__":
    main()