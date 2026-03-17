# skills/pptx/scripts/thumbnail.py

"""
Module for generating thumbnails from PPTX files.
"""

import os
from pptx import Presentation
from pptx.util import Inches
from PIL import Image

def generate_thumbnail(pptx_file_path: str, output_path: str) -> None:
    """
    Generate a thumbnail from a PPTX file.

    Args:
    - pptx_file_path (str): Path to the PPTX file.
    - output_path (str): Path to save the thumbnail.
    """
    # Open the presentation
    presentation = Presentation(pptx_file_path)

    # Get the first slide
    slide = presentation.slides[0]

    # Save the slide as an image
    slide_image_path = f"{output_path}.png"
    slide.save_image(slide_image_path)

    # Open the image and resize it to a thumbnail
    image = Image.open(slide_image_path)
    thumbnail_size = (128, 128)  # 128x128 pixels
    image.thumbnail(thumbnail_size)

    # Save the thumbnail
    thumbnail_path = f"{output_path}_thumbnail.png"
    image.save(thumbnail_path)

    # Remove the original image
    os.remove(slide_image_path)

def main() -> None:
    """
    Example usage of the thumbnail generator.
    """
    pptx_file_path = "example.pptx"
    output_path = "example_thumbnail"
    generate_thumbnail(pptx_file_path, output_path)

if __name__ == "__main__":
    main()