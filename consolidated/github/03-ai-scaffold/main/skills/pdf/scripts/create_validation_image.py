import json
import sys
from PIL import Image, ImageDraw

def create_validation_image(
    page_number: int, 
    fields_json_path: str, 
    input_path: str, 
    output_path: str
) -> None:
    """
    Create a validation image with bounding box rectangles from the fields.json file.

    Args:
    page_number (int): The page number to draw bounding boxes for.
    fields_json_path (str): The path to the fields.json file.
    input_path (str): The path to the input image.
    output_path (str): The path to save the output image.

    Returns:
    None
    """
    try:
        with open(fields_json_path, 'r') as f:
            data = json.load(f)
            img = Image.open(input_path)
            draw = ImageDraw.Draw(img)
            num_boxes = 0
            
            for field in data["form_fields"]:
                if field["page_number"] == page_number:
                    entry_box = field['entry_bounding_box']
                    label_box = field['label_bounding_box']
                    # Draw rectangles with 2px width for better visibility
                    draw.rectangle(entry_box, outline='red', width=2)
                    draw.rectangle(label_box, outline='blue', width=2)
                    num_boxes += 2
        
        img.save(output_path)
        print(f"Created validation image at {output_path} with {num_boxes} bounding boxes")
    
    except FileNotFoundError as e:
        print(f"Error: File not found - {e}")
    
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}")
    
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: create_validation_image.py [page number] [fields.json file] [input image path] [output image path]")
        sys.exit(1)
    
    try:
        page_number = int(sys.argv[1])
        fields_json_path = sys.argv[2]
        input_image_path = sys.argv[3]
        output_image_path = sys.argv[4]
        
        create_validation_image(page_number, fields_json_path, input_image_path, output_image_path)
    
    except ValueError as e:
        print(f"Error: Invalid page number - {e}")
        sys.exit(1)
```

**