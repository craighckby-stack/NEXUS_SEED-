from difflib import Differ
import requests
import json
import os
from bs4 import BeautifulSoup
from typing import Dict, List

class Analyzer:
    def __init__(self, previous_code: str, current_code: str):
        self.previous_code = previous_code
        self.current_code = current_code
        self.analysis = self._compare_codes()

    def _compare_codes(self) -> Dict:
        """Compare the previous and current code."""
        diff = Differ().compare(self.previous_code.splitlines(), self.current_code.splitlines())
        analysis = {"deletions": [], "additions": [], "modifications": []}
        for line in diff:
            if line.startswith('- '):
                analysis["deletions"].append(line[2:])
            elif line.startswith('+ '):
                analysis["additions"].append(line[2:])
            elif line.startswith('? '):
                analysis["modifications"].append(line[2:])

        return analysis

    def _generate_questions(self) -> List[str]:
        """Generate questions based on the analysis."""
        questions = []
        if "additions" in self.analysis:
            questions.append("What are the implications of the newly added features or functionality?")
        if "deletions" in self.analysis:
            questions.append("Why were certain features or functionalities removed? Are there any implications?")
        if "modifications" in self.analysis:
            questions.append("How have the modified features or functionalities impacted the overall system?")

        return questions

def main():
    # Configuration
    ROBOTS_LOG_FILE = 'robots_log.json'
    PERSISTENT_MEMORY_FILE = 'persistent_memory.json'
    LOG_FILE = 'scraper.log'
    USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.3'
    DEFAULT_RATE_LIMIT_DELAY = 2
    MAX_RETRIES = 3
    RETRY_DELAY = 5
    OUTPUT_FOLDER = "banks_not_gov"

    # Bank URLs (Hardcoded)
    BANK_SITES = [
        "https://www.bankofbaroda.in/",
        "https://www.bankofindia.co.in/",
        "https://bankofmaharashtra.in/",
        "https://canarabank.com/",
        "https://www.centralbankofindia.co.in/"
    ]

    analyzer = Analyzer(previous_code="", current_code="")
    self_questions = analyzer._generate_questions()
    print(self_questions)

if __name__ == "__main__":
    main()