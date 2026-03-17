#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Fill Fillable Fields Script

This script fills fillable fields in a PDF document using the PyPDF2 library.

Usage:
    python fill_fillable_fields.py <input_pdf> <output_pdf> <data_dict>
"""

import PyPDF2
from typing import Dict

def fill_fillable_fields(input_pdf: str, output_pdf: str, data_dict: Dict) -> None:
    """
    Fill fillable fields in a PDF document.

    Args:
        input_pdf (str): The path to the input PDF file.
        output_pdf (str): The path to the output PDF file.
        data_dict (Dict): A dictionary containing the data to fill the fields.
    """
    # Create a PyPDF2 reader object
    with open(input_pdf, 'rb') as in_pdf:
        pdf_reader = PyPDF2.PdfReader(in_pdf)

    # Iterate over each page in the PDF
    for page in range(len(pdf_reader.pages)):
        # Get the page object
        page_obj = pdf_reader.pages[page]

        # Iterate over each field in the page
        for field in page_obj.fields:
            # Get the field value from the data dictionary
            field_value = data_dict.get(field.name, '')

            # Set the field value
            page_obj.fields[field.name] = PyPDF2.generic.NameObject(field_value)

    # Create a PyPDF2 writer object
    with open(output_pdf, 'wb') as out_pdf:
        pdf_writer = PyPDF2.PdfWriter()

        # Add the pages from the input PDF to the writer
        for page in pdf_reader.pages:
            pdf_writer.add_page(page)

        # Write the PDF to the output file
        pdf_writer.write(out_pdf)

if __name__ == '__main__':
    import argparse
    import json

    # Parse the command line arguments
    parser = argparse.ArgumentParser(description='Fill fillable fields in a PDF document')
    parser.add_argument('input_pdf', help='The path to the input PDF file')
    parser.add_argument('output_pdf', help='The path to the output PDF file')
    parser.add_argument('data_dict', help='The path to the data dictionary file (JSON format)')

    args = parser.parse_args()

    # Load the data dictionary from JSON
    with open(args.data_dict, 'r') as data_file:
        data_dict = json.load(data_file)

    # Fill the fillable fields
    fill_fillable_fields(args.input_pdf, args.output_pdf, data_dict)