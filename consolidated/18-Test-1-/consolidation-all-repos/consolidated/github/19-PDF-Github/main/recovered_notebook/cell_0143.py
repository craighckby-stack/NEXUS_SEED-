import re
from urllib.robotparser import RobotFileParser

class LogAnalyzer:
    """
    A class dedicated to parsing and analyzing log data, 
    improving structure and reusability over standalone functions.
    """
    def __init__(self, log_data: str):
        self.log_data = log_data
        self.log_lines = log_data.splitlines()

    def extract_urls(self) -> list:
        """
        Extracts URLs using a more encompassing regex pattern for log scraping.
        """
        # Regex matching http/https followed by non-whitespace characters
        # Designed to catch URLs even if paths are incomplete in truncated logs
        url_pattern = r'https?://[^\s]+'
        urls = re.findall(url_pattern, self.log_data)
        
        # Basic filtering to remove potentially overly truncated matches like 'https:'
        return [url for url in urls if len(url) > 10]

    def find_anomalous_events(self, indicators=('ERROR', 'WARNING', '403', 'Forbidden')) -> list:
        """
        Identifies lines containing common anomalous or failure indicators.

        Args:
            indicators (tuple): Strings (case-insensitive) to flag an anomaly.

        Returns:
            list: A list of lines containing indicators.
        """
        anomalous_lines = []
        upper_indicators = [ind.upper() for ind in indicators]
        
        for line in self.log_lines:
            if any(indicator in line.upper() for indicator in upper_indicators):
                anomalous_lines.append(line.strip())
        return anomalous_lines

def analyze_robots_txt(base_url: str, user_agent: str = "*", path: str = "/") -> dict:
    """
    Analyzes robots.txt directives and checks path allowance.

    Args:
        base_url (str): The base URL to analyze.
        user_agent (str): The user agent to check permissions for.
        path (str): The path to check (e.g., '/admin/').

    Returns:
        dict: Analysis result containing status and allowance check.
    """
    try:
        robots_url = f"{base_url.rstrip('/')}/robots.txt"
        rp = RobotFileParser()
        rp.set_url(robots_url)
        rp.read()  

        is_allowed = rp.can_fetch(user_agent, path)
        
        return {
            "status": "success",
            "url": robots_url,
            "user_agent": user_agent,
            "path_checked": path,
            "is_allowed": is_allowed
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error analyzing robots.txt: {e}",
            "url": f"{base_url.rstrip('/')}/robots.txt"
        }

def main():
    log_data = """
[DEBUG] Successfully fetched sitemap from https://sbi.co.in/web 
[2025-02-26T07:11:43.600116] 
[DEBUG] Successfully fetched sitemap from https://sbi.co.in/web 
[2025-02-26T07:11:44.585616] 
[ERROR] Malicious activity detected, threat indicators found in payload. 
[WARNING] Client error 403 encountered. Retrying in 5 seconds. 
[ERROR] HTTP Error 403 Client Error: Forbidden for url: https: 
[ERROR] Failed to fetch robots.txt for https://www.unionbankof
https://www.unionbankofindia.co.in/english/home.aspx: Error -
https://www.ucobank.com/Hindi/homehindi.aspx: OK - robots.txt f 
[INFO] Scraping complete. The hardcore journey is done!
"""
    
    analyzer = LogAnalyzer(log_data)

    urls = analyzer.extract_urls()
    print("Extracted URLs:")
    for url in urls:
        print(url)

    anomalous_lines = analyzer.find_anomalous_events()
    print("\nLines containing anomalous events:")
    for line in anomalous_lines:
        print(line)

    base_url = "https://www.sbi.co.in"
    analysis_result = analyze_robots_txt(base_url, path="/private/api")
    print("\nRobots.txt Analysis Result:")
    print(analysis_result)

if __name__ == "__main__":
    main()