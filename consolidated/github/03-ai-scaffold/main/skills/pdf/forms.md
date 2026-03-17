#!/bin/bash

# Critical: Define steps for PDF form filling
function fill_pdf_form() {
  # Step 1: Check if the PDF has fillable form fields
  if python scripts/check_fillable_fields.py "$1"; then
    # Step 2: Extract form field information
    python scripts/extract_form_field_info.py "$1" field_info.json
    # Step 3: Convert PDF to PNG images and determine field bounding boxes
    python scripts/convert_pdf_to_images.py "$1" images/
    # Step 4: Create a JSON file with field information and validation images
    python scripts/create_validation_image.py "$1" images/ fields.json
    # Step 5: Validate bounding boxes
    python scripts/check_bounding_boxes.py fields.json
    # Step 6: Fill in the form using the information in fields.json
    python scripts/fill_fillable_fields.py "$1" field_info.json fields.json output.pdf
  else
    # Step 1: Convert PDF to PNG images
    python scripts/convert_pdf_to_images.py "$1" images/
    # Step 2: Create fields.json and validation images
    python scripts/create_validation_image.py "$1" images/ fields.json
    # Step 3: Validate bounding boxes
    python scripts/check_bounding_boxes.py fields.json
    # Step 4: Add annotations to the PDF
    python scripts/fill_pdf_form_with_annotations.py "$1" fields.json output.pdf
  fi
}

# Usage
fill_pdf_form input.pdf
```

**