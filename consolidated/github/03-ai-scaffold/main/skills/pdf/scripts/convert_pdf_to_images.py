import os
import sys
from pathlib import Path
from pdf2image import convert_from_path

def convert_pdf_to_images(pdf_path: str, output_dir: str, max_dim: int = 1000) -> None:
    """
    Converts each page of a PDF to a PNG image.

    Args:
    - pdf_path (str): Path to the input PDF file.
    - output_dir (str): Directory to save the output images.
    - max_dim (int): Maximum dimension for scaling images. Defaults to 1000.

    Returns:
    None
    """
    try:
        images = convert_from_path(pdf_path, dpi=200)
        
        # Create output directory if it does not exist
        output_dir_path = Path(output_dir)
        output_dir_path.mkdir(parents=True, exist_ok=True)

        for i, image in enumerate(images):
            # Scale image if needed to keep width/height under `max_dim`
            width, height = image.size
            if width > max_dim or height > max_dim:
                scale_factor = min(max_dim / width, max_dim / height)
                new_size = (int(width * scale_factor), int(height * scale_factor))
                image = image.resize(new_size)
            
            image_path = os.path.join(output_dir, f"page_{i+1}.png")
            image.save(image_path)
            print(f"Saved page {i+1} as {image_path} (size: {image.size})")

        print(f"Converted {len(images)} pages to PNG images")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: convert_pdf_to_images.py [input pdf] [output directory]")
        sys.exit(1)
    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    convert_pdf_to_images(pdf_path, output_dir)
```

**