#!/usr/bin/env python
"""Script to determine whether a PDF has fillable form fields."""

import sys
from pypdf import PdfReader

def check_fillable_fields(pdf_path: str) -> None:
    """Check if a PDF has fillable form fields."""
    try:
        reader = PdfReader(pdf_path)
        has_fields = bool(reader.get_fields())
        result = "has" if has_fields else "does not have"
        print(f"This PDF {result} fillable form fields.")
        if not has_fields:
            print("You will need to visually determine where to enter data.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_fillable_fields.py <pdf_file>")
    else:
        check_fillable_fields(sys.argv[1])