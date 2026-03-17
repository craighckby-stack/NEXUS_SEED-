import json
import ipywidgets as widgets
from IPython.display import display
import uuid # Added dependency for unique topic tracking

class NotebookUI:
    def __init__(self):
        # 0. State Management: Using dictionary for topic tracking (name -> metadata)
        self.topic_states = {}

        # 1. Widget Initialization
        self.topic_input = widgets.Text(
            value='',
            placeholder='Enter a topic to search...', 
            description='Topic:',
            layout=widgets.Layout(width='60%')
        )
        self.add_topic_button = widgets.Button(
            description='Add Topic & Search',
            button_style='info',
            tooltip='Add a topic to the list and initiate search/scraping process',
            icon='search'
        )
        self.scrape_button = widgets.Button(
            description='Scrape All Pending',
            button_style='success',
            tooltip='Execute scraping against all currently listed topics',
            icon='cloud-download-alt',
            disabled=True # Start disabled
        )

        # Visualization Widgets
        self.topic_count_label = widgets.Label(value='--- Pending Topics (0) ---')
        self.topic_list_container = widgets.VBox([]) # Container for displayed topics
        
        self.output_area = widgets.HTML(
            value='Ready. Enter a topic above.',
            layout=widgets.Layout(border='1px solid lightgray', padding='10px', min_height='50px', max_height='150px', overflow_y='scroll')
        )

        # 2. Layout Definition
        input_group = widgets.HBox([self.topic_input, self.add_topic_button])
        controls_group = widgets.HBox([self.scrape_button])

        self.root_container = widgets.VBox([
            input_group,
            controls_group,
            self.topic_count_label, 
            self.topic_list_container, 
            widgets.Label(value='--- Status & Console Output ---'),
            self.output_area
        ])

        # 3. Event Binding
        self.add_topic_button.on_click(self._handle_add_topic)
        self.scrape_button.on_click(self._handle_scrape)

        # 4. Initial Display
        display(self.root_container)

    def _update_topic_list_display(self):
        """Renders the visual list of topics based on current state, including removal buttons.
        """
        topic_widgets = []
        
        for topic_name, data in self.topic_states.items():
            
            # Topic Label
            label_text = f"[{data['status'].upper()}] {topic_name}"
            label_style = 'color: black;' if data['status'] == 'pending' else 'color: gray;'
            label = widgets.Label(label_text, layout=widgets.Layout(width='85%', style={'color': label_style}))
            
            # Remove Button
            remove_button = widgets.Button(
                description='',
                button_style='danger',
                icon='times',
                tooltip=f'Remove {topic_name}',
                layout=widgets.Layout(width='15%')
            )
            
            # Bind removal handler, passing the specific topic name
            # Note: Using a lambda capture for topic_name is necessary for closures in a loop
            remove_button.on_click(lambda b, name=topic_name: self._handle_remove_topic(name))
            
            topic_widgets.append(widgets.HBox([label, remove_button]))
        
        self.topic_list_container.children = tuple(topic_widgets)
        count = len(self.topic_states)
        self.topic_count_label.value = f'--- Pending Topics ({count}) ---'
        self.scrape_button.disabled = (count == 0)

    def _handle_add_topic(self, b):
        topic = self.topic_input.value.strip()
        
        if not topic:
            self.update_output('<p style="color:red;">Error: Please enter a topic before adding.</p>')
            return
            
        if topic in self.topic_states:
            self.update_output(f'<p style="color:red;">Error: Topic <b>{topic}</b> is already pending.</p>')
            return

        # Add to state dictionary
        self.topic_states[topic] = {'status': 'pending', 'id': str(uuid.uuid4())}
        
        self._update_topic_list_display() 
        self.update_output(f'<p style="color:blue;">Topic added: <b>{topic}</b>. {len(self.topic_states)} topics pending.</p>')
        self.topic_input.value = '' 

    def _handle_remove_topic(self, topic_name):
        if topic_name in self.topic_states:
            del self.topic_states[topic_name]
            self._update_topic_list_display()
            self.update_output(f'<p style="color:gray;">Topic removed: <b>{topic_name}</b>.</p>')

    def _handle_scrape(self, b):
        if not self.topic_states:
            self.update_output('<p style="color:red;">Cannot scrape: No topics currently pending.</p>')
            return

        # Indicate busy state
        self.scrape_button.description = 'Scraping... (Working)'
        self.scrape_button.button_style = 'warning'
        self.scrape_button.disabled = True

        topic_count = len(self.topic_states)
        topic_list = list(self.topic_states.keys())
        
        # Placeholder: This is where asynchronous scraping would start
        self.update_output(f'<p style="color:orange;">Initiating batch scraping process for {topic_count} topics: {', '.join(topic_list[:3])}...</p>')

        # TODO: Implement asynchronous callback to reset button upon completion

    def update_output(self, new_html, max_history=7):
        """Updates the integrated HTML output area by prepending content and truncating history (Architectural Fix).
        """
        current_content = self.output_area.value
        
        if current_content.strip().startswith('Ready'):
            current_content = ''
        
        # Define the new message structure
        new_message_block = f'<div style="border-bottom: 1px solid #eee; padding: 2px 0;">{new_html}</div>'

        # Prepend the new message
        updated_content = new_message_block + current_content
        
        # Simple truncation by counting </div> elements
        message_blocks = updated_content.split('</div>')
        truncated_blocks = [block + '</div>' for block in message_blocks if block.strip()][:max_history]
        
        self.output_area.value = "".join(truncated_blocks)

    def display_output(self):
        # Not needed after refactoring update_output to handle logging directly
        pass

ui = NotebookUI()