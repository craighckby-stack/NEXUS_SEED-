import json
from typing import Dict
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from pypdf.annotations import FreeText

def transform_coordinates(
    bbox: list, 
    image_width: int, 
    image_height: int, 
    pdf_width: int, 
    pdf_height: int
) -> tuple:
    """Transform bounding box from image coordinates to PDF coordinates"""
    x_scale = pdf_width / image_width
    y_scale = pdf_height / image_height
    
    left = bbox[0] * x_scale
    right = bbox[2] * x_scale
    
    top = pdf_height - (bbox[1] * y_scale)
    bottom = pdf_height - (bbox[3] * y_scale)
    
    return (left, bottom, right, top)


def fill_pdf_form(
    input_pdf_path: Path, 
    fields_json_path: Path, 
    output_pdf_path: Path
) -> None:
    """Fill the PDF form with data from fields.json"""
    
    fields_data = json.loads(fields_json_path.read_text())
    
    input_pdf = PdfReader(input_pdf_path)
    writer = PdfWriter()
    
    for page in input_pdf.pages:
        writer.append(page)
        
    pdf_dimensions = {i + 1: page.mediabox for i, page in enumerate(input_pdf.pages)}
    
    annotations = []
    for field in fields_data["form_fields"]:
        page_num = field["page_number"]
        
        page_info = next(p for p in fields_data["pages"] if p["page_number"] == page_num)
        image_width = page_info["image_width"]
        image_height = page_info["image_height"]
        pdf_width, pdf_height = pdf_dimensions[page_num]
        
        transformed_entry_box = transform_coordinates(
            field["entry_bounding_box"],
            image_width, image_height,
            pdf_width, pdf_height
        )
        
        if "entry_text" in field and "text" in field["entry_text"]:
            entry_text = field["entry_text"]
            text = entry_text["text"]
            if text:
                font_name = entry_text.get("font", "Arial")
                font_size = str(entry_text.get("font_size", 14)) + "pt"
                font_color = entry_text.get("font_color", "000000")
                
                annotation = FreeText(
                    text=text,
                    rect=transformed_entry_box,
                    font=font_name,
                    font_size=font_size,
                    font_color=font_color,
                    border_color=None,
                    background_color=None,
                )
                annotations.append(annotation)
                writer.add_annotation(page_number=page_num - 1, annotation=annotation)
    
    output_pdf_path.write_bytes(writer.write())
    print(f"Successfully filled PDF form and saved to {output_pdf_path}")
    print(f"Added {len(annotations)} text annotations")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: fill_pdf_form_with_annotations.py [input pdf] [fields.json] [output pdf]")
        sys.exit(1)
    
    input_pdf = Path(sys.argv[1])
    fields_json = Path(sys.argv[2])
    output_pdf = Path(sys.argv[3])
    
    fill_pdf_form(input_pdf, fields_json, output_pdf)
```

**SUMMARY**: 

1. Added type hints for functions and variables.
2. Used the `pathlib` library for path manipulation.
3. Used `json.loads()` to load JSON data from a file instead of `json.load()`.
4. Used the `read_text()` method to read the contents of a file as a string instead of `open()` and `read()`.
5. Used the `write_bytes()` method to write bytes to a file instead of `open()` and `write()`.
6. Removed unnecessary type conversions.
7. Improved code formatting and indentation.