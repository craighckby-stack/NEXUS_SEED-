import logging
from typing import List
import numpy as np
import pandas as pd
import threading
from IPython.display import display
from ipywidgets import (
    Button,
    Output,
    HBox,
    VBox,
    Box,
    Textarea,
    ToggleButton,
    ToggleButtons,
    Label,
    HTML
)
from traitlets import default

class Buttons:
    def __init__(self):
        self.topic_input = Textarea(
            value='',
            placeholder='Type something',
            description='Topic:',
            disabled=False
        )
        self.scrape_button = self._create_button(
            description="Scrape Learning Resources",
            button_style='success',
            icon='search'
        )
        self.clear_all_button = self._create_button(
            description="Clear All Topics and Hashes",
            button_style='warning',
            icon='remove'
        )
        self.copy_all_button = self._create_button(
            description="Copy All Hashes",
            button_style='info',
            icon='copy'
        )
        self.output = Output()
        self.setup_button_handlers()

    def _create_button(self, description, button_style, icon):
        button = Button(description=description, disabled=False, button_style=button_style)
        button.tooltip = f"{description.replace(' ', '_')}">
        button.icon = icon
        return button

    def setup_button_handlers(self):
        self.scrape_button.on_click(self._handle_scrape_button_click)
        self.clear_all_button.on_click(self._handle_clear_button_click)
        self.copy_all_button.on_click(self._handle_copy_button_click)

    def _handle_scrape_button_click(self, b):
        with self.output:
            topic = self.topic_input.value.strip()
            if topic:
                print(f"Adding and searching for {topic}")
                # scrape_learning_resources([topic])  # This function is not defined in the provided code
                self.topic_input.value = ''
            else:
                print("Please enter a topic.")

    def _handle_clear_button_click(self, b):
        # Clear all topics and hashes
        self.topic_input.value = ''
        with self.output:
            print("All topics and hashes cleared.")

    def _handle_copy_button_click(self, b):
        # Copy all hashes
        with self.output:
            print("All hashes copied.")

    def display(self):
        display(VBox([self.topic_input, self.scrape_button, self.clear_all_button, self.copy_all_button, self.output]))

buttons = Buttons()
buttons.display()
