import os
import sys
from pdf2image import convert_from_path
from typing import List

def get_scaled_image(image, max_dim: int) -> object:
    """Scales an image to fit within a maximum dimension."""
    width, height = image.size
    if width > max_dim or height > max_dim:
        scale_factor = min(max_dim / width, max_dim / height)
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)
        return image.resize((new_width, new_height))
    return image

def save_image(image, output_dir: str, page_number: int) -> None:
    """Saves an image to a file."""
    image_path = os.path.join(output_dir, f"page_{page_number}.png")
    image.save(image_path)
    print(f"Saved page {page_number} as {image_path} (size: {image.size})")

def convert_pdf_to_images(pdf_path: str, output_dir: str, max_dim: int = 1000) -> None:
    """Converts each page of a PDF to a PNG image."""
    images = convert_from_path(pdf_path, dpi=200)
    for i, image in enumerate(images, start=1):
        scaled_image = get_scaled_image(image, max_dim)
        save_image(scaled_image, output_dir, i)
    print(f"Converted {len(images)} pages to PNG images")

def main() -> None:
    """Runs the PDF to image conversion script."""
    if len(sys.argv) != 3:
        print("Usage: convert_pdf_to_images.py [input pdf] [output directory]")
        sys.exit(1)
    pdf_path = sys.argv[1]
    output_directory = sys.argv[2]
    convert_pdf_to_images(pdf_path, output_directory)

if __name__ == "__main__":
    main()