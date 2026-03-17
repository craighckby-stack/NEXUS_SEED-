# -*- coding: utf-8 -*-

"""
PDF-to-Image Converter
======================

A tool for converting PDFs into individual images.

Requirements
------------

* `pdf2image` library
* `Pillow` library

Usage
-----

1. Install dependencies: `pip install pdf2image pillow`
2. Run the script: `python convert_pdf_to_images.py input.pdf output_directory`

Args:
    input_pdf (str): Path to the input PDF file
    output_dir (str): Path to the output directory
"""

import os
from pdf2image import convert_from_path
from PIL import Image

def convert_pdf_to_images(input_pdf, output_dir):
    """
    Convert a PDF into individual images.

    Args:
        input_pdf (str): Path to the input PDF file
        output_dir (str): Path to the output directory
    """
    # Check if output directory exists, create it if not
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Convert PDF to images
    pages = convert_from_path(input_pdf)

    # Save each page as a separate image
    for i, page in enumerate(pages):
        page.save(os.path.join(output_dir, f"page_{i+1}.png"), "PNG")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="PDF-to-Image Converter")
    parser.add_argument("input_pdf", help="Path to the input PDF file")
    parser.add_argument("output_dir", help="Path to the output directory")
    args = parser.parse_args()

    convert_pdf_to_images(args.input_pdf, args.output_dir)