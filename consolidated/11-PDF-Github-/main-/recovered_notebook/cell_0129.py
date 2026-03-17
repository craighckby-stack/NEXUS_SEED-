import re
from collections import Counter

# Define common Indicators of Compromise (IoC) keywords for log analysis
SUSPICIOUS_KEYWORDS = [
    "threat indicator", "sql injection", "xss", "malware", 
    "forbidden", "403", "401", "denied", "access violation", 
    "shell", "base64", "eval(", 
    "connect method", "ldap", "rmi", "jndi" 
]

# Regex to capture standard log levels (e.g., [INFO], [ERROR])
LOG_LEVEL_PATTERN = r'\[(INFO|DEBUG|WARNING|ERROR|CRITICAL)\]'

def extract_urls(log_data):
    """
    Extracts URLs from the log data using a more robust pattern.

    Args:
        log_data (str): The log data to extract URLs from.

    Returns:
        list: A list of extracted URLs.
    """
    # Pattern matching http/https followed by non-whitespace characters, robust for logs.
    url_pattern = r'https?://[\S]+'
    urls = re.findall(url_pattern, log_data)
    return urls

def extract_ip_addresses(log_data):
    """
    Extracts IPv4 addresses and counts their occurrences.

    Args:
        log_data (str): The log data to analyze.

    Returns:
        dict: A dictionary mapping IP addresses to their counts.
    """
    # Simple IPv4 pattern (reliable enough for standard log formats)
    ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
    ips = re.findall(ip_pattern, log_data)
    return dict(Counter(ips))

def identify_suspicious_lines(log_data):
    """
    Identifies lines containing common suspicious keywords (IOCs) and details which keywords triggered the flag.

    Args:
        log_data (str): The log data to search for suspicious activity.

    Returns:
        list: A list of dictionaries, each containing the suspicious line and its triggers.
    """
    flagged_entries = []
    for line in log_data.splitlines():
        line = line.strip()
        if not line:
            continue
        line_lower = line.lower()
        
        # Identify all matching keywords
        triggers = [keyword for keyword in SUSPICIOUS_KEYWORDS if keyword in line_lower]
        
        if triggers:
            flagged_entries.append({
                "line": line,
                "triggers": triggers
            })
    return flagged_entries

def analyze_log_levels(log_data):
    """
    Counts the occurrences of standard log levels (INFO, ERROR, etc.).

    Args:
        log_data (str): The log data to analyze.

    Returns:
        dict: A dictionary mapping log levels to their counts.
    """
    # Note: .upper() ensures reliable matching even if logs vary in case (e.g., [error] vs [ERROR])
    levels = re.findall(LOG_LEVEL_PATTERN, log_data.upper())
    return dict(Counter(levels))

def analyze_log_data(log_data):
    """
    Analyzes the log data and extracts comprehensive relevant information.

    Args:
        log_data (str): The log data to analyze.

    Returns:
        dict: A dictionary containing the extracted information.
    """
    extracted_info = {
        "urls": extract_urls(log_data),
        "source_ip_counts": extract_ip_addresses(log_data),
        "suspicious_lines_detailed": identify_suspicious_lines(log_data), # Renamed for clarity
        "log_level_counts": analyze_log_levels(log_data)
    }
    return extracted_info

# Example usage:
log_data = """
10.0.0.1 - [2025-02-26T07:11:41.671482] [DEBUG] Successfully fetched sitemap from https://sbi.co.in/web
192.168.1.100 - [2025-02-26T07:11:54.365690] [WARNING] Client error 403 encountered. Retrying in 5 seconds.
1.2.3.4 - [2025-02-26T07:12:19.470695] [ERROR] HTTP Error 403 Client Error: Forbidden for url: https://malicious.com/shell?id=base64
10.0.0.1 - [2025-02-26T07:12:21.472480] [INFO] Attempt from 10.0.0.1: https://www.ucobank.com/Hindi/homehindi.aspx: OK
[2025-02-26T07:12:23.925240] [INFO] Scraping complete. No threat indicator found here.
"""

extracted_info = analyze_log_data(log_data)

print("Extracted Analysis:")
# print(extracted_info)

print("\nSuspicious Lines (IOC Detection, detailed):")
for entry in extracted_info["suspicious_lines_detailed"]:
    print(f"[TRIGGERS: {', '.join(entry['triggers'])}] {entry['line']}")

print("\nLog Level Summary:")
print(extracted_info["log_level_counts"])

print("\nIP Address Frequency:")
print(extracted_info["source_ip_counts"])
