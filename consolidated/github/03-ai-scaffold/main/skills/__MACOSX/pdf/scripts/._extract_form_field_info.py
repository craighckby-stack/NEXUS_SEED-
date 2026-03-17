# -*- coding: utf-8 -*-

"""
Form Field Extractor
=====================

This script extracts form field information from a given PDF document.

Requirements
------------

* `PyPDF2` library
* `reportlab` library

Usage
-----

1. Install the required libraries: `pip install PyPDF2 reportlab`
2. Run the script: `python extract_form_field_info.py <pdf_file_path>`

Args:
    pdf_file_path (str): The path to the PDF document

Returns:
    A dictionary containing the extracted form field information
"""

import pdf2image
import PyPDF2
import reportlab.lib.utils

def extract_form_field_info(pdf_file_path):
    """
    Extracts form field information from a given PDF document.

    Args:
        pdf_file_path (str): The path to the PDF document

    Returns:
        A dictionary containing the extracted form field information
    """
    # Convert the PDF to images
    images = pdf2image.convert_from_path(pdf_file_path)

    # Extract form fields from each image
    form_fields = {}
    for image in images:
        # Extract text from the image
        text = image_to_text(image)

        # Find form fields in the text
        fields = find_form_fields(text)

        # Add the form fields to the dictionary
        form_fields.update(fields)

    return form_fields

def image_to_text(image):
    """
    Extracts text from a given image.

    Args:
        image: The image to extract text from

    Returns:
        The extracted text
    """
    # Convert the image to text using Optical Character Recognition (OCR)
    text = image.ocr()
    return text

def find_form_fields(text):
    """
    Finds form fields in a given text.

    Args:
        text: The text to find form fields in

    Returns:
        A dictionary containing the found form fields
    """
    # Use regular expressions to find form fields in the text
    fields = {}
    for line in text.splitlines():
        if "name=" in line:
            name = line.split("name=")[1].split(",")[0]
            fields[name] = line.split("value=")[1].split(",")[0]
    return fields

def main():
    # Get the PDF file path from the user
    pdf_file_path = input("Enter the path to the PDF document: ")

    # Extract the form field information
    form_fields = extract_form_field_info(pdf_file_path)

    # Print the extracted form field information
    print(form_fields)

if __name__ == "__main__":
    main()