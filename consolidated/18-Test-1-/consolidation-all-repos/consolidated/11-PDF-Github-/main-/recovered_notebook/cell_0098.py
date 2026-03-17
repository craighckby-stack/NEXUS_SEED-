import datetime
import random
import re
import requests
from bs4 import BeautifulSoup

def scrape_resources(query: str) -> list:
    """
    Scrapes the first three Google search results for the provided query.

    Args:
        query (str): The search query.

    Returns:
        list: A list of dictionaries containing the title, URL, and snippet of each result.
    """
    search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

    try:
        response = requests.get(search_url, headers=headers, timeout=5)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        search_results = soup.find_all("div", class_="yuRUbf")
        resources = []

        for result in search_results[:3]:
            try:
                link = result.find("a")
                result_data = {
                    "title": link.text,
                    "url": link["href"],
                    "snippet": result.find("span").text
                }
                resources.append(result_data)
            except Exception as e:
                print(f"Error parsing a search result: {e}")

        return resources
    except requests.exceptions.RequestException as e:
        print(f"Error during resource scraping: {e}")
        return []

def main():
    query = "python programming"
    resources = scrape_resources(query)
    for resource in resources:
        print(resource)

if __name__ == "__main__":
    main()