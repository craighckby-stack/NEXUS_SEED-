import json
import os
from typing import Dict, List

def extract_form_field_info(input_pdf: str, output_json: str) -> None:
    """
    Extract form field information from a PDF and save it to a JSON file.
    
    Args:
    input_pdf (str): The path to the input PDF file.
    output_json (str): The path to the output JSON file.
    """
    # Run the script to extract form field information
    os.system(f"python scripts/extract_form_field_info.py {input_pdf} {output_json}")

def convert_pdf_to_images(input_pdf: str, output_directory: str) -> None:
    """
    Convert a PDF to PNG images, one image per page.
    
    Args:
    input_pdf (str): The path to the input PDF file.
    output_directory (str): The path to the output directory.
    """
    # Run the script to convert the PDF to images
    os.system(f"python scripts/convert_pdf_to_images.py {input_pdf} {output_directory}")

def create_field_values_json(field_info_json: str, output_json: str) -> None:
    """
    Create a JSON file with field values to be entered for each field.
    
    Args:
    field_info_json (str): The path to the JSON file containing field information.
    output_json (str): The path to the output JSON file.
    """
    # Load the field information from the JSON file
    with open(field_info_json, 'r') as f:
        field_info = json.load(f)
    
    # Create a list to store the field values
    field_values = []
    
    # Iterate over the fields and create a field value entry for each one
    for field in field_info:
        field_value = {
            "field_id": field["field_id"],
            "description": f"Enter a value for {field['field_id']}",
            "page": field["page"],
            "value": ""  # Initialize the value to an empty string
        }
        
        # If the field is a checkbox, set the value to the checked value
        if field["type"] == "checkbox":
            field_value["value"] = field["checked_value"]
        
        # Add the field value entry to the list
        field_values.append(field_value)
    
    # Save the field values to the output JSON file
    with open(output_json, 'w') as f:
        json.dump(field_values, f, indent=4)

def fill_fillable_fields(input_pdf: str, field_values_json: str, output_pdf: str) -> None:
    """
    Fill in a PDF form with the provided field values.
    
    Args:
    input_pdf (str): The path to the input PDF file.
    field_values_json (str): The path to the JSON file containing field values.
    output_pdf (str): The path to the output PDF file.
    """
    # Run the script to fill in the PDF form
    os.system(f"python scripts/fill_fillable_fields.py {input_pdf} {field_values_json} {output_pdf}")

def create_fields_json(input_pdf: str, output_directory: str, output_json: str) -> None:
    """
    Create a JSON file with field information and bounding boxes for a non-fillable PDF form.
    
    Args:
    input_pdf (str): The path to the input PDF file.
    output_directory (str): The path to the output directory.
    output_json (str): The path to the output JSON file.
    """
    # Convert the PDF to PNG images
    convert_pdf_to_images(input_pdf, output_directory)
    
    # Create a list to store the page information
    pages = []
    
    # Iterate over the pages and create a page entry for each one
    for page_number in range(1, get_number_of_pages(input_pdf) + 1):
        page = {
            "page_number": page_number,
            "image_width": get_image_width(os.path.join(output_directory, f"page_{page_number}.png")),
            "image_height": get_image_height(os.path.join(output_directory, f"page_{page_number}.png"))
        }
        
        # Add the page entry to the list
        pages.append(page)
    
    # Create a list to store the form field information
    form_fields = []
    
    # Iterate over the pages and create a form field entry for each one
    for page in pages:
        # Load the image for the current page
        image_path = os.path.join(output_directory, f"page_{page['page_number']}.png")
        
        # Analyze the image to determine the field bounding boxes
        field_bounding_boxes = analyze_image(image_path)
        
        # Iterate over the field bounding boxes and create a form field entry for each one
        for field_bounding_box in field_bounding_boxes:
            form_field = {
                "page_number": page["page_number"],
                "description": f"Enter a value for field {len(form_fields) + 1}",
                "field_label": field_bounding_box["label"],
                "label_bounding_box": field_bounding_box["label_bounding_box"],
                "entry_bounding_box": field_bounding_box["entry_bounding_box"],
                "entry_text": {
                    "text": ""  # Initialize the text to an empty string
                }
            }
            
            # Add the form field entry to the list
            form_fields.append(form_field)
    
    # Save the field information to the output JSON file
    with open(output_json, 'w') as f:
        json.dump({
            "pages": pages,
            "form_fields": form_fields
        }, f, indent=4)

def get_number_of_pages(input_pdf: str) -> int:
    """
    Get the number of pages in a PDF file.
    
    Args:
    input_pdf (str): The path to the input PDF file.
    
    Returns:
    int: The number of pages in the PDF file.
    """
    # Run the script to get the number of pages
    import subprocess
    output = subprocess.check_output(f"python scripts/get_number_of_pages.py {input_pdf}", shell=True)
    return int(output.decode('utf-8').strip())

def get_image_width(image_path: str) -> int:
    """
    Get the width of an image file.
    
    Args:
    image_path (str): The path to the image file.
    
    Returns:
    int: The width of the image file.
    """
    # Run the script to get the image width
    import subprocess
    output = subprocess.check_output(f"python scripts/get_image_width.py {image_path}", shell=True)
    return int(output.decode('utf-8').strip())

def get_image_height(image_path: str) -> int:
    """
    Get the height of an image file.
    
    Args:
    image_path (str): The path to the image file.
    
    Returns:
    int: The height of the image file.
    """
    # Run the script to get the image height
    import subprocess
    output = subprocess.check_output(f"python scripts/get_image_height.py {image_path}", shell=True)
    return int(output.decode('utf-8').strip())

def analyze_image(image_path: str) -> List[Dict]:
    """
    Analyze an image to determine the field bounding boxes.
    
    Args:
    image_path (str): The path to the image file.
    
    Returns:
    List[Dict]: A list of dictionaries containing the field bounding boxes.
    """
    # Run the script to analyze the image
    import subprocess
    output = subprocess.check_output(f"python scripts/analyze_image.py {image_path}", shell=True)
    return json.loads(output.decode('utf-8').strip())

def create_validation_image(page_number: int, fields_json: str, input_image_path: str, output_image_path: str) -> None:
    """
    Create a validation image for a page.
    
    Args:
    page_number (int): The page number.
    fields_json (str): The path to the JSON file containing field information.
    input_image_path (str): The path to the input image file.
    output_image_path (str): The path to the output image file.
    """
    # Run the script to create the validation image
    os.system(f"python scripts/create_validation_image.py {page_number} {fields_json} {input_image_path} {output_image_path}")

def check_bounding_boxes(fields_json: str) -> None:
    """
    Check the bounding boxes in a JSON file for errors.
    
    Args:
    fields_json (str): The path to the JSON file containing field information.
    """
    # Run the script to check the bounding boxes
    os.system(f"python scripts/check_bounding_boxes.py {fields_json}")

def fill_pdf_form_with_annotations(input_pdf: str, fields_json: str, output_pdf: str) -> None:
    """
    Fill in a PDF form with annotations.
    
    Args:
    input_pdf (str): The path to the input PDF file.
    fields_json (str): The path to the JSON file containing field information.
    output_pdf (str): The path to the output PDF file.
    """
    # Run the script to fill in the PDF form
    os.system(f"python scripts/fill_pdf_form_with_annotations.py {input_pdf} {fields_json} {output_pdf}")

#