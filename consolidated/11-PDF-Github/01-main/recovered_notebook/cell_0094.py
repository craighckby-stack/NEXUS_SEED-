import logging
import traitlets as t
from ipywidgets import widgets, VBox, HBox, Layout, Textarea, Button, HTML
import time

# Configure standard logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

class SearchApp(t.HasTraits):
    """Widgets-based application for searching and scraping resources.
    Manages application state reactively using Traitlets.
    """

    # Application State Traitlets
    active_topics = t.List(trait=t.Unicode, default_value=[], help="List of topics currently queued.")
    search_results = t.List(trait=t.Unicode, default_value=[], help="List of discovered URLs.")
    is_scraping = t.Bool(default_value=False, help="Indicates if scraping operation is running.")

    def __init__(self, initial_topics=None):
        super().__init__()
        self.logger = logging.getLogger(__name__)
        if initial_topics: 
            self.active_topics = initial_topics

        self._initialize_widgets()
        self._setup_connections()

    # --- UI Component Initialization ---
    
    def _initialize_widgets(self):
        self.topic_input = widgets.Text(
            placeholder='Enter a topic to search...', 
            description='Topic:',
            layout=Layout(width='300px')
        )
        self.add_topic_button = Button(
            description='Add Topic & Search',
            button_style='primary',
            tooltip='Add a topic to the list and initiate search/scrape',
            icon='plus'
        )
        self.scrape_button = Button(
            description="Scrape All Topics",
            button_style='info',
            tooltip="Search for URLs across all stored topics",
            icon='search'
        )
        self.clear_all_button = Button(
            description="Clear All",
            button_style='warning',
            tooltip="Clear topics and results",
            icon='trash'
        )
        
        self.results_textarea = Textarea(
            value='Results will appear here.',
            description='Found URLs:',
            disabled=True,
            layout=Layout(height='200px', width='95%')
        )
        
        self.status_label = HTML(value="Ready.")

    # --- Connection and Observation Setup ---

    def _setup_connections(self):
        """Configures and connects event handlers and observers."""
        self.add_topic_button.on_click(self._handle_add_topic)
        self.scrape_button.on_click(self._handle_scrape_all)
        self.clear_all_button.on_click(self._handle_clear_all)

        # Reactive Traitlet linkages
        self.observe(self._update_results_display, names='search_results')
        self.observe(self._update_status_and_buttons, names=['is_scraping'])

    # --- Observer Methods ---
    
    def _update_results_display(self, change):
        """Updates the results Textarea whenever search_results changes."""
        urls = change['new']
        if urls:
            self.results_textarea.value = "\n".join(urls)
        else:
            self.results_textarea.value = "No URLs found."
            
    def _update_status_and_buttons(self, change):
        """Updates UI based on current operation status and disables controls when busy."""
        is_scraping = change['new']
        if is_scraping:
            self.status_label.value = "<b>Processing...</b> Please wait." 
            self.add_topic_button.disabled = True
            self.scrape_button.disabled = True
        else:
            self.status_label.value = f"Ready. {len(self.search_results)} results displayed. Topics: {len(self.active_topics)}."
            self.add_topic_button.disabled = False
            self.scrape_button.disabled = False

    # --- Event Handlers ---

    def _handle_add_topic(self, b):
        """Handles adding a new topic and initiates immediate search."""
        topic = self.topic_input.value.strip()
        if topic:
            self.logger.info(f"Handling new topic: {topic}")
            
            # Update active_topics trait
            current_topics = list(self.active_topics)
            if topic not in current_topics:
                self.active_topics = current_topics + [topic]
            
            self.topic_input.value = ''
            self._execute_search_logic([topic])
        else:
            self.status_label.value = "<span style='color: orange;'>Please enter a topic.</span>"

    def _handle_scrape_all(self, b):
        """Handles scraping for all currently active topics."""
        if self.active_topics:
            self.logger.info(f'Scraping all {len(self.active_topics)} active topics.')
            self._execute_search_logic(self.active_topics)
        else:
            self.status_label.value = "<span style='color: red;'>Error: No topics to scrape.</span>"

    def _handle_clear_all(self, b):
        """Handles clearing all state and results."""
        self.logger.info('Clearing all state.')
        # Resetting traits triggers UI updates automatically
        self.active_topics = []
        self.search_results = [] 

    # --- Core Logic (Simulated) ---
    
    def _execute_search_logic(self, topics):
        """Simulates the synchronous scraping process."""
        if self.is_scraping:
            self.logger.warning("Scraping already in progress. Ignoring new request.")
            return

        self.is_scraping = True
        
        self.logger.info(f"Executing search logic for {topics}")
        
        new_urls = []
        for topic in topics:
            time.sleep(0.1) # Simulate external API call latency
            # HALLUCINATION: Simulated result generation based on input topic
            if 'data' in topic.lower():
                new_urls.append(f"https://data-science-hub.org/{topic.lower()}/robots.txt")
            else:
                new_urls.append(f"https://api-source.com/search?q={topic.lower()}&fmt=robots")

        # Update results, ensuring deduplication and history retention
        current_results = set(self.search_results)
        for url in new_urls:
            current_results.add(url)
                
        # Set the trait to trigger observation handlers
        self.search_results = sorted(list(current_results))
        self.is_scraping = False
        
        self.logger.info("Search logic complete.")

    # --- Application Display ---
    
    def display_app(self):
        """Returns the main VBox container for embedding in a notebook."""
        
        control_panel = HBox([self.topic_input, self.add_topic_button])
        action_buttons = HBox([self.scrape_button, self.clear_all_button], layout=Layout(margin='10px 0 0 0'))
        
        return VBox([
            HTML(value="<h3>Sovereign AGI Resource Search</h3><hr>"),
            control_panel,
            action_buttons,
            self.status_label,
            self.results_textarea
        ])

# Example usage in a notebook cell:
# app = SearchApp(initial_topics=['machine learning', 'devops'])
# app.display_app()