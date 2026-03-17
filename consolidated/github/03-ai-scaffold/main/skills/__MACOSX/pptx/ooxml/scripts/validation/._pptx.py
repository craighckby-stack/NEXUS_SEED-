# skills/__MACOSX/pptx/ooxml/scripts/validation/pptx.py

import logging
from typing import Dict, List

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define constants
PPTX_FORMAT = 'pptx'

class PresentationValidator:
    def __init__(self, presentation: Dict):
        """
        Initialize the validator with a presentation dictionary.

        Args:
            presentation (Dict): A dictionary containing the presentation data.
        """
        self.presentation = presentation
        self.errors: List[str] = []

    def validate(self) -> bool:
        """
        Validate the presentation data.

        Returns:
            bool: True if the presentation is valid, False otherwise.
        """
        # Validate presentation attributes
        self._validate_attributes()
        # Validate presentation content
        self._validate_content()

        return not self.errors

    def _validate_attributes(self):
        """
        Validate the presentation attributes.

        Raises:
            ValueError: If the presentation attributes are invalid.
        """
        # Validate presentation format
        if self.presentation.get('format') != PPTX_FORMAT:
            self.errors.append('Invalid presentation format.')

    def _validate_content(self):
        """
        Validate the presentation content.

        Raises:
            ValueError: If the presentation content is invalid.
        """
        # Validate presentation title
        if 'title' not in self.presentation:
            self.errors.append('Missing presentation title.')

# Example usage
presentation = {
    'format': PPTX_FORMAT,
    'title': 'Presentation Title',
    'content': [
        {'slide': 'Slide 1'},
        {'slide': 'Slide 2'}
    ]
}

validator = PresentationValidator(presentation)
if validator.validate():
    logging.info('Presentation is valid.')
else:
    logging.error('Presentation is invalid.')
    for error in validator.errors:
        logging.error(error)