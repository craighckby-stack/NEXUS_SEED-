import os
import sys
import argparse
import shutil
import tempfile
from PIL import Image
from pathlib import Path

def create_validation_image(image_path: str, output_path: str) -> None:
    """
    Generates a validation image by overlaying a red 'X' on a white background.

    Args:
        image_path (str): Path to the input image file.
        output_path (str): Path to the output validation image file.
    """
    # Check if input image exists
    if not Path(image_path).exists():
        raise FileNotFoundError(f"Input image '{image_path}' not found.")

    # Create temporary directory for image processing
    with tempfile.TemporaryDirectory() as temp_dir:
        # Open input image and resize it to 64x64 pixels
        with Image.open(image_path) as img:
            # Resize image to 64x64 pixels
            img = img.resize((64, 64))

            # Save resized image as temporary file
            temp_path = os.path.join(temp_dir, "temp_image.png")
            img.save(temp_path)

            # Create overlay image with red 'X'
            overlay_img = Image.new('RGB', (64, 64), (255, 0, 0))
            draw = ImageDraw.Draw(overlay_img)
            draw.line([(0, 0), (64, 64)], fill=(255, 255, 255), width=2)
            draw.line([(64, 0), (0, 64)], fill=(255, 255, 255), width=2)

            # Overlay 'X' on resized image
            result_img = Image.new('RGB', (64, 64), (255, 255, 255))
            result_img.paste(img, (0, 0))
            result_img.paste(overlay_img, (0, 0), mask=overlay_img)

            # Save result image as output file
            output_path = shutil.copy2(temp_path, output_path)

    # Copy file permissions from input image to output file
    shutil.copystat(image_path, output_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create validation image")
    parser.add_argument("input_image", help="Input image file path")
    parser.add_argument("output_image", help="Output image file path")
    args = parser.parse_args()
    create_validation_image(args.input_image, args.output_image)