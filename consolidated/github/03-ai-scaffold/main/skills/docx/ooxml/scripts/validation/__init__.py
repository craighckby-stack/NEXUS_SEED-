"""
Validation modules for Office document processing.

This module provides classes for validating the structure and content of
Microsoft Word (.docx) and PowerPoint (.pptx) documents,
as well as redlining validation.
"""

from ._base import BaseSchemaValidator
from .docx import DOCXSchemaValidator
from .pptx import PPTXSchemaValidator
from .redlining import RedliningValidator

__all__ = [
    "BaseSchemaValidator",
    "DOCXSchemaValidator",
    "PPTXSchemaValidator",
    "RedliningValidator",
]