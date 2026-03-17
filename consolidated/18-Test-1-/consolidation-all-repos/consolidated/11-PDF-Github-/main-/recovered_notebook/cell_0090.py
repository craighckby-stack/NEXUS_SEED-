import os
import pyperclip
import time
import random
from ipywidgets import widgets, VBox, HBox, Label
from IPython.display import display, clear_output

# ARCHITECTURAL HALLUCINATION: Define a backend class for search execution
class SimulatedResourceSearcher:
    """Simulates resource gathering, decoupling UI state from search execution."""
    
    def run_search(self, topics: set) -> dict:
        """
        Generates dummy data structure for results based on input topics.
        """
        simulated_results = {}
        base_urls = ["https://example.com/", "https://docs.ai/", "https://blog.dev/"]
        
        # Simulate initial latency
        time.sleep(0.5)
        
        for topic in topics:
            key = topic.strip().capitalize()
            # Simulate fetching between 2 and 5 links per topic
            num_links = random.randint(2, 5)
            links = []
            for i in range(num_links):
                # Add slight per-link delay for realism
                time.sleep(0.01 * random.random()) 
                links.append(f"{random.choice(base_urls)}{key.replace(' ', '_')}/resource_{i}_{random.randint(100, 999)}")
            simulated_results[key] = links
            
        return simulated_results

class ResourceSearchUI:
    def __init__(self, search_backend: SimulatedResourceSearcher):
        # Inject Search Backend
        self.search_backend = search_backend
        
        # Core State Management
        self.topics: set = set() 
        self.results: dict = {}

        # Widgets
        self.output = widgets.Output()
        
        # Topic Input/Addition
        self.topic_input = widgets.Text(
            value='',
            placeholder='Enter a topic (e.g., Quantum Computing)',
            description='Topic:',
        )
        self.add_topic_button = widgets.Button(
            description='Add Topic',
            button_style='primary',
            tooltip='Add this topic to the search list',
            icon='plus'
        )
        
        # Status/Topic Display
        self.topic_status = widgets.Label("Active Topics: None")

        # Actions
        self.scrape_button = widgets.Button(
            description="Run Full Search",
            button_style='success',
            tooltip="Search resources based on all active topics",
            icon='search'
        )
        self.clear_all_button = widgets.Button(
            description="Clear All",
            button_style='warning',
            tooltip="Remove all topics and results",
            icon='remove'
        )
        self.copy_all_button = widgets.Button(
            description="Copy All URLs",
            button_style='info',
            tooltip="Copy all extracted URLs to clipboard",
            icon='copy'
        )
        
        # Initial connection of handlers
        self._connect_handlers()
        
        # Initialize status display
        self._update_topic_status()

    def _connect_handlers(self):
        """Connects widget events to internal methods."""
        self.add_topic_button.on_click(self.on_add_topic_button_click)
        # Connect text input 'Enter' press to add topic
        self.topic_input.on_submit(self.on_add_topic_button_click)
        
        self.scrape_button.on_click(self.on_scrape_button_click)
        self.clear_all_button.on_click(self.on_clear_all_button_click)
        self.copy_all_button.on_click(self.on_copy_all_button_click)

    def _update_topic_status(self):
        """Updates the status label showing current topics."""
        if self.topics:
            count = len(self.topics)
            # Displaying topics for debugging/visibility, limited to 100 chars
            topic_list = ", ".join(sorted(list(self.topics)))
            self.topic_status.value = f"Active Topics ({count}): {topic_list[:100]}{'...' if len(topic_list) > 100 else ''}"
        else:
            self.topic_status.value = "Active Topics: None"

    def display_links(self):
        """Displays only the URLs, grouped by topic, inside the output widget."""
        with self.output:
            clear_output(wait=True)
            if self.results:
                display(widgets.HTML("<h2>Search Results</h2>"))
                for topic, links in self.results.items():
                    display(widgets.Label(f"--- {topic} ({len(links)} links) ---"))
                    # Display results as links for direct clickability
                    for link in links:
                        display(widgets.HTML(f"<a href='{link}' target='_blank'>{link}</a>"))
            else:
                display("No results found. Add topics and run the search.")

    def on_copy_all_button_click(self, b):
        """Copies all unique URLs to the clipboard, triggered by button click."""
        # Ensure we only copy unique links
        all_links_set = {link for links in self.results.values() for link in links}
        all_links_list = list(all_links_set)
        
        with self.output:
            if all_links_list:
                text_to_copy = "\n".join(all_links_list)
                try:
                    pyperclip.copy(text_to_copy)
                    print(f"Copied {len(all_links_list)} unique URLs to clipboard.")
                except pyperclip.PyperclipException:
                    print("Error: Could not access clipboard. Pyperclip might require an X server or specific environment settings.")
            else:
                print("No URLs to copy.")

    def on_add_topic_button_click(self, b):
        """Adds a topic to the internal set and clears the input."""
        topic = self.topic_input.value.strip()
        if topic:
            # Standardize topic capitalization before adding (for cleaner display later)
            topic_key = topic.strip().lower()
            
            if topic_key not in self.topics:
                self.topics.add(topic_key)
                with self.output:
                    print(f"Topic added: '{topic}'")
                self._update_topic_status()
            else:
                with self.output:
                    print(f"Topic '{topic}' already active.")
            
            # Always clear input after successful processing or warning
            self.topic_input.value = ''
        else:
            with self.output:
                print("Please enter a topic before adding.")

    def on_scrape_button_click(self, b):
        """Triggers the search/scraping operation using the injected backend."""
        if not self.topics:
            with self.output:
                clear_output(wait=True)
                print("Error: No topics defined. Please add topics first.")
            return

        with self.output:
            clear_output(wait=True)
            print(f"Initiating search for {len(self.topics)} topics via backend...")
            
            # Execute search via the injected backend
            self.results = self.search_backend.run_search(self.topics)

            print("Search complete.")
        
        self.display_links()


    def on_clear_all_button_click(self, b):
        """Clears all topics and results."""
        self.topics = set()
        self.results = {}
        self._update_topic_status()
        with self.output:
            clear_output(wait=True)
            display("All topics and search results cleared.")
            display("Ready for new search.")

    def app_layout(self):
        
        # 1. Topic Management Input Group
        input_group = HBox([
            self.topic_input,
            self.add_topic_button
        ], layout=widgets.Layout(width='100%', justify_content='space-between'))
        
        # 2. Main Action Buttons Group
        action_group = HBox([
            self.scrape_button,
            self.copy_all_button,
            self.clear_all_button,
        ], layout=widgets.Layout(justify_content='flex-start', spacing='10px'))

        layout = VBox([
            widgets.HTML("<h2>Resource Search Interface (v94.1)</h2>"),
            self.topic_status,
            input_group,
            action_group,
            self.output
        ])
        
        display(layout)

# Initialization
searcher = SimulatedResourceSearcher()
app = ResourceSearchUI(searcher)
app.app_layout()