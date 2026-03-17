"""
Checks for fillable fields in a PDF document.

This script uses the PyPDF2 library to read the PDF file and extract its contents.
It then searches for fields that can be filled in, such as text fields, checkbox fields,
and dropdown menus.

Requirements:
- PyPDF2 library
- Python 3.8+

Usage:
    python check_fillable_fields.py <pdf_file>
"""

import PyPDF2
import os

def check_fillable_fields(pdf_file):
    """
    Checks for fillable fields in a PDF document.

    Args:
        pdf_file (str): Path to the PDF file to check.

    Returns:
        dict: Dictionary containing the results of the check.
    """
    # Check if the PDF file exists
    if not os.path.exists(pdf_file):
        print(f"Error: The file '{pdf_file}' does not exist.")
        return {}

    # Open the PDF file in read-binary mode
    with open(pdf_file, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)

        # Initialize a dictionary to store the results
        results = {
            'fillable_fields': [],
            'readonly_fields': [],
            'missing_fields': []
        }

        # Iterate over the pages in the PDF
        for page in pdf_reader.pages:
            # Extract the annotations (fillable fields) from the page
            annotations = page.get('/Annots')

            # Check for fillable fields
            if annotations:
                for annotation in annotations:
                    # Check if the field is fillable
                    if annotation.get('/Ff') == 4:
                        # Add the fillable field to the results dictionary
                        results['fillable_fields'].append(annotation.get('/T'))

                    # Check if the field is read-only
                    elif annotation.get('/Ff') == 8:
                        # Add the read-only field to the results dictionary
                        results['readonly_fields'].append(annotation.get('/T'))

            # Check for missing fields
            elif page.get('/Form') is not None:
                # Add the missing field to the results dictionary
                results['missing_fields'].append('Form field missing')

        return results

if __name__ == '__main__':
    import sys

    # Get the PDF file path from the command line
    pdf_file = sys.argv[1] if len(sys.argv) > 1 else None

    if pdf_file:
        # Call the function to check the fillable fields
        results = check_fillable_fields(pdf_file)

        # Print the results
        print("Fillable Fields:")
        for field in results['fillable_fields']:
            print(f"- {field}")

        print("\nRead-only Fields:")
        for field in results['readonly_fields']:
            print(f"- {field}")

        print("\nMissing Fields:")
        for field in results['missing_fields']:
            print(f"- {field}")