import re
from urllib.robotparser import RobotFileParser
from typing import List, Optional, Tuple


class LogAnalyzer:
    """A class dedicated to analyzing security and operational logs.
    
    Note: For large scale logs (>=1GB), this class should be refactored 
    to process data in streams or batches to avoid high memory usage.
    """

    def __init__(self, log_data: str):
        self.log_data = log_data

    def extract_urls(self) -> List[str]:
        """
        Extracts URLs from the stored log data. Uses a robust regex 
        to capture schemes, domains, optional ports, and path/query segments.
        
        NOTE: This pattern prioritizes speed and common formats over strict RFC compliance.
        """
        # Robust pattern for typical log URLs, ensuring domain structure and path capture.
        url_pattern = r'https?://[a-zA-Z0-9.-]+(?::\d+)?(?:/[^\s]*)?'
        urls = re.findall(url_pattern, self.log_data)
        return sorted(list(set(urls)))

    def extract_ips(self) -> List[str]:
        """
        Extracts unique IPv4 addresses from the log data. 
        (IPv6 extraction omitted for regex clarity, requires dedicated parsing if critical).
        """
        # IPv4 pattern (strict validation for all four octets)
        ipv4_pattern = r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'
        ips = re.findall(ipv4_pattern, self.log_data)
        return sorted(list(set(ips)))

    def find_matching_lines(self, keywords: List[str], case_sensitive: bool = False) -> List[Tuple[str, str]]:
        """
        Identifies lines containing specified keywords (generalized indicator search).

        Args:
        keywords (List[str]): The keywords or phrases to search for.
        case_sensitive (bool): Whether the search should be case sensitive.

        Returns:
        List[Tuple[str, str]]: A list of tuples (keyword found, matching line).
        
        Note: Stops search upon finding the first keyword match within a single line.
        """
        matching_lines = []
        lines = self.log_data.splitlines()

        for line in lines:
            line_to_check = line if case_sensitive else line.lower()
            
            for keyword in keywords:
                keyword_to_check = keyword if case_sensitive else keyword.lower()

                if keyword_to_check in line_to_check:
                    matching_lines.append((keyword, line.strip()))
                    # Stop after finding the first keyword match in a line
                    break
        return matching_lines


def analyze_robots_txt_compliance(base_url: str, user_agent: str = "AGI_Crawler", test_paths: Optional[List[str]] = None) -> dict:
    """
    Analyzes robots.txt directives and tests compliance for specific paths. 
    
    WARNING: This function performs synchronous network I/O which can block execution.
    Consider using asynchronous libraries (e.g., aiohttp + async robots parser) 
    for high concurrency usage in a production AGI pipeline.

    Args:
    base_url (str): The base URL (e.g., 'https://example.com').
    user_agent (str): The User-Agent string to test against.
    test_paths (Optional[List[str]]): List of paths (e.g., ['/admin', '/api/v1']).
    
    Returns:
    dict: Analysis results.
    """
    results = {
        "robots_url": f"{base_url.rstrip('/')}/robots.txt",
        "fetch_success": False,
        "compliance_checks": {}
    }

    try:
        rp = RobotFileParser()
        rp.set_url(results['robots_url'])
        rp.read() # Blocking operation, fetches and parses
        results['fetch_success'] = True

        paths_to_check = test_paths if test_paths is not None else ["/", "/admin"]
        
        for path in paths_to_check:
            is_allowed = rp.can_fetch(user_agent, path)
            results['compliance_checks'][path] = {
                "user_agent": user_agent,
                "allowed": is_allowed
            }

    except Exception as e:
        results['error'] = f"Failed to analyze robots.txt: {e}"
        
    return results

def main() -> None:
    log_data = """
    # Output/logs:
    # [2025-02-26T07:11:45.893951] [DEBUG] Successfully fetched sitemap from https://sbi.co.in/web
    # [2025-02-26T07:11:49.327756] [WARNING] Client error 403 encountered. Retrying in 5 seconds. This requires threat indicators analysis.
    # [2025-02-26T07:11:54.365690] [WARNING] Client error 403 encountered. Retrying in 5 seconds. 
    # [2025-02-26T07:12:01.000000] [INFO] Connection established from 192.168.1.100.
    # [2025-02-26T07:12:19.470695] [ERROR] HTTP Error 403 Client Error: Forbidden for url: https://www.unionbankofindia.co.in/english/home.aspx
    # [2025-02-26T07:12:23.925240] [INFO] Scraping complete. The hardcore journey is done! Attempted to access https://internal.corp:8443/secret/config. Remote IP: 10.0.0.50.
    """
    
    analyzer = LogAnalyzer(log_data)

    # 1. URL Analysis
    urls = analyzer.extract_urls()
    print("Extracted URLs:")
    for url in urls:
        print(f" - {url}")

    # 1.5 IP Analysis
    ips = analyzer.extract_ips()
    print("\nExtracted IPs:")
    for ip in ips:
        print(f" - {ip}")

    # 2. Threat/Keyword Analysis (Searching for generalized keywords)
    suspicious_keywords = ["403", "Forbidden", "Error", "secret", "threat indicators", "192.168.1.100"]
    matching_lines = analyzer.find_matching_lines(suspicious_keywords)
    
    print(f"\nLines matching suspicious keywords ({', '.join(suspicious_keywords)}):")
    for keyword, line in matching_lines:
        print(f"[Match: {keyword}] {line}")

    # 3. Robots.txt Compliance Check
    base_url = "https://www.sbi.co.in"
    test_paths = ["/personal", "/admin", "/search?query=test"]
    robot_analysis = analyze_robots_txt_compliance(base_url, user_agent="SecurityBot", test_paths=test_paths)
    
    print(f"\nRobots.txt Analysis for {base_url}:")
    if robot_analysis.get('error'):
        print(f"[ERROR] {robot_analysis['error']}")
    elif robot_analysis['fetch_success']:
        for path, result in robot_analysis['compliance_checks'].items():
            status = "ALLOWED" if result['allowed'] else "DISALLOWED"
            print(f"[Path: {path}] Agent '{result['user_agent']}' is {status}")
    else:
        print("Robots.txt could not be fetched/parsed.")

if __name__ == "__main__":
    main()