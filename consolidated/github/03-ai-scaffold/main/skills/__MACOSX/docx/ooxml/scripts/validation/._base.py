"""
Base class for validation scripts.

This module provides a base class for validation scripts that can be used
to validate user input or system state.

Classes:
    BaseValidator
"""

import abc

class BaseValidator(abc.ABC):
    """
    Abstract base class for validators.

    This class provides a basic implementation of a validator and can be
    subclassed to create custom validators.

    Attributes:
        validate (callable): The validation function.
    """

    def __init__(self, validate):
        """
        Initialize the validator.

        Args:
            validate (callable): The validation function.
        """
        self.validate = validate

    @abc.abstractmethod
    def validate_input(self, input_data):
        """
        Validate the input data.

        This method should be implemented by subclasses and should raise
        a ValueError if the input data is invalid.

        Args:
            input_data (any): The input data to validate.

        Returns:
            bool: True if the input data is valid, False otherwise.
        """
        pass

    def validate(self, input_data):
        """
        Validate the input data.

        This method will call the validate_input method and raise a
        ValueError if the input data is invalid.

        Args:
            input_data (any): The input data to validate.

        Returns:
            bool: True if the input data is valid, False otherwise.
        """
        try:
            return self.validate_input(input_data)
        except ValueError as e:
            raise ValueError(f"Invalid input: {e}")

    def validate_list(self, input_data):
        """
        Validate a list of input data.

        This method will call the validate_input method on each item in
        the list and raise a ValueError if any item is invalid.

        Args:
            input_data (list): The list of input data to validate.

        Returns:
            bool: True if all items in the list are valid, False otherwise.
        """
        for item in input_data:
            if not self.validate_input(item):
                return False
        return True

    def validate_dict(self, input_data):
        """
        Validate a dictionary of input data.

        This method will call the validate_input method on each value in
        the dictionary and raise a ValueError if any value is invalid.

        Args:
            input_data (dict): The dictionary of input data to validate.

        Returns:
            bool: True if all values in the dictionary are valid, False otherwise.
        """
        for value in input_data.values():
            if not self.validate_input(value):
                return False
        return True
```

```python
#