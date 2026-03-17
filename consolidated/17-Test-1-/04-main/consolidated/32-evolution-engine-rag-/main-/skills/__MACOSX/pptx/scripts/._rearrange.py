// skills/pptx/scripts/rearrange.js is not a valid Python file, 
// assuming the correct file is skills/pptx/scripts/rearrange.py

# skills/pptx/scripts/rearrange.py

from pptx import Presentation
from pptx.util import Inches

def load_presentation(file_path: str) -> Presentation:
    """Loads a PPTX presentation from a file."""
    return Presentation(file_path)

def rearrange_placeholders(slide):
    """Rearranges placeholders in a slide."""
    for shape in slide.shapes:
        if hasattr(shape, "placeholder"):
            shape.left = Inches(1)
            shape.top = Inches(1)

def rearrange_pptx_elements(file_path: str) -> None:
    """
    Rearranges elements in a PPTX file.

    Args:
        file_path (str): Path to the PPTX file.
    """
    presentation = load_presentation(file_path)
    for slide in presentation.slides:
        rearrange_placeholders(slide)
    presentation.save(file_path)

if __name__ == "__main__":
    file_path = "example.pptx"
    rearrange_pptx_elements(file_path)