import datetime
from typing import Optional
import requests

def get_timestamp() -> str:
    """Returns the current date and time in a formatted string."""
    now = datetime.datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S")

def get_user_input(prompt: str) -> str:
    """Simulates user input by prompting the user with the provided message."""
    return input(prompt)

def display_output(text: str) -> None:
    """Displays output to the console."""
    print(text)

def scrape_resources() -> list:
    """Scrapes resources and returns a list of results."""
    try:
        resources = []
        # Example scraping code using requests library
        url = "https://example.com/resources"
        response = requests.get(url)
        if response.status_code == 200:
            resources = response.json()
        return resources
    except Exception as e:
        print(f"An error occurred: {e}")
        return []
    except requests.exceptions.RequestException as e:
        print(f"Error during resource scraping: {e}")
        return []
    else:
        # successful execution, return resources
        return resources
    finally:
        # always execute, regardless of exceptions
        pass

def main():
    display_output("Program started at: " + get_timestamp())
    user_input = get_user_input("Please enter a URL to scrape: ")
    resources = scrape_resources()
    display_output("Scraped resources: ")
    for resource in resources:
        display_output(resource)

if __name__ == "__main__":
    main()