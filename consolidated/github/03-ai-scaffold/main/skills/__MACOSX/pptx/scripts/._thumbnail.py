# Import necessary modules
import os
import logging

# Set up logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

def generate_thumbnail(image_path):
    """
    Generate a thumbnail from a given image.

    Args:
        image_path (str): Path to the image file.

    Returns:
        None
    """
    if not image_path.endswith(('.jpg', '.jpeg', '.png')):
        logging.warning("Only JPEG and PNG image formats are supported.")
        return

    try:
        # Use the Pillow library to generate the thumbnail
        from PIL import Image
        with Image.open(image_path) as img:
            output_size = (128, 128)  # Set the output size to 128x128 pixels
            img.thumbnail(output_size)
            img.save(image_path.replace('.jpg', '_thumbnail.jpg').replace('.jpeg', '_thumbnail.jpeg').replace('.png', '_thumbnail.png'))

        logging.info(f"Thumbnail generated successfully for {image_path}")

    except Exception as e:
        logging.error(f"Error generating thumbnail for {image_path}: {str(e)}")

def main():
    # Get the script directory path
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Get the list of image files in the current directory
    image_files = [f for f in os.listdir(script_dir) if f.endswith(('.jpg', '.jpeg', '.png'))]

    # Generate thumbnails for each image file
    for image_path in image_files:
        generate_thumbnail(image_path)

if __name__ == '__main__':
    main()
```

**