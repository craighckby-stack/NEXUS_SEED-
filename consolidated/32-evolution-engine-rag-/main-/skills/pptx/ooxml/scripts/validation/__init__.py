"""
Validation modules for Office Open XML (OOXML) document processing.
"""

# Import and expose validation classes
from .base import BaseSchemaValidator
from .docx import DOCXSchemaValidator
from .pptx import PPTXSchemaValidator
from .redlining import RedliningValidator

# Define the public API
__all__ = [
    "BaseSchemaValidator",  # Base schema validation class
    "DOCXSchemaValidator",  # DOCX schema validation class
    "PPTXSchemaValidator",  # PPTX schema validation class
    "RedliningValidator",   # Redlining validation class
]