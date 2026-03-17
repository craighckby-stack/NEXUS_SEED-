import logging
import pyperclip
from typing import Dict
from ipywidgets import Text, Button, Output

# Initialize logging
logging.basicConfig(level=logging.INFO)

# Define a function to scrape learning resources
def scrape_learning_resources(topics: list[str]) -> None:
    """Scrape learning resources for the given topics."""
    for topic in topics:
        # Simulate scraping logic (replace with actual implementation)
        logging.info(f"Scraping topic: {topic}")
        # Add topic to all_links and update html_output
        html_output.append(f"<p>Topic: {topic}</p>")

# Define a function to copy all links to clipboard
def copy_all_hashes_to_clipboard() -> None:
    """Copy all SHA-256 hashes to the clipboard."""
    all_hashes_list = []
    for topic, hashes in all_links.items():
        all_hashes_list.extend(hashes)
    if all_hashes_list:
        text_to_copy = "\n".join(all_hashes_list)
        pyperclip.copy(text_to_copy)
        logging.info("All SHA-256 hashes copied to clipboard.")
    else:
        logging.info("No SHA-256 hashes to copy.")

# Define a function to handle add topic button click
def add_topic_clicked(b) -> None:
    """Handle add topic button click."""
    topic = topic_input.value.strip()
    if topic:
        logging.info(f"Adding and searching for topic: {topic}")
        scrape_learning_resources([topic])
        topic_input.value = ''
    else:
        logging.info("Please enter a topic.")

# Define a function to handle scrape all button click
def scrape_all_clicked(b) -> None:
    """Handle scrape all button click."""
    topics = list(all_links.keys())
    if topics:
        scrape_learning_resources(topics)
    else:
        logging.info("No topics to scrape.")

# Define a function to handle clear all button click
def clear_all_clicked(b) -> None:
    """Handle clear all button click."""
    # Clear all topics and hashes
    all_links.clear()
    html_output.clear()
    logging.info("All topics and hashes cleared.")

# Define interactive widgets
topic_input = Text(
    value='',
    placeholder='Enter a topic to search...',
    description='Add Topic:',
    disabled=False
)

add_topic_button = Button(
    description='Add Topic & Search',
    disabled=False,
    button_style='',
    tooltip='Add a topic to the list and search for resources.',
    icon=''
)

scrape_button = Button(
    description="Scrape Learning Resources",
    disabled=False,
    button_style='success',
    tooltip="Search for resources based on the topics.",
    icon='search'
)

clear_all_button = Button(
    description="Clear All Topics and Hashes",
    disabled=False,
    button_style='warning',
    tooltip="Remove all topics and hashes.",
    icon='remove'
)

copy_all_button = Button(
    description="Copy All Hashes",
    disabled=False,
    button_style='info',
    tooltip="Copy all hashes to clipboard.",
    icon='copy'
)

output = Output()

# Define button click event handlers
add_topic_button.on_click(add_topic_clicked)
scrape_button.on_click(scrape_all_clicked)
clear_all_button.on_click(clear_all_clicked)
copy_all_button.on_click(copy_all_hashes_to_clipboard)

# Initialize global variables
all_links: Dict[str, list[str]] = {}
html_output = []

# Display the widgets
from ipywidgets import HBox, VBox
display(VBox([
    HBox([topic_input, add_topic_button]),
    HBox([scrape_button, clear_all_button, copy_all_button]),
    output
]))