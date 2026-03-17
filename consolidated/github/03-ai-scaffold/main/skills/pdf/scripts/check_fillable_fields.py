import sys
from PyPDF2 import PdfReader

def check_fillable_fields(pdf_path):
    """Check if a PDF has fillable form fields."""
    try:
        reader = PdfReader(pdf_path)
        return bool(reader.get_form_text_fields())
    except IndexError:
        print("Invalid PDF path")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_fillable_fields.py <pdf_path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    has_fillable_fields = check_fillable_fields(pdf_path)

    if has_fillable_fields:
        print("This PDF has fillable form fields")
    else:
        print("This PDF does not have fillable form fields; you will need to visually determine where to enter data")