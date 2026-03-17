# pdf_processor.py

from pypdf import PdfReader, PdfWriter
import pdfplumber
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
import pytesseract
from pdf2image import convert_from_path

class PDFProcessor:
    def __init__(self, file_path):
        self.file_path = file_path

    def read_pdf(self):
        """Read a PDF file."""
        reader = PdfReader(self.file_path)
        return reader

    def extract_text(self):
        """Extract text from a PDF file."""
        reader = self.read_pdf()
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text

    def extract_tables(self):
        """Extract tables from a PDF file."""
        with pdfplumber.open(self.file_path) as pdf:
            tables = []
            for page in pdf.pages:
                tables.extend(page.extract_tables())
            return tables

    def create_pdf(self, output_file):
        """Create a new PDF file."""
        c = canvas.Canvas(output_file, pagesize=letter)
        width, height = letter
        c.drawString(100, height - 100, "Hello World!")
        c.drawString(100, height - 120, "This is a PDF created with reportlab")
        c.line(100, height - 140, 400, height - 140)
        c.save()

    def merge_pdfs(self, output_file, pdf_files):
        """Merge multiple PDF files."""
        writer = PdfWriter()
        for pdf_file in pdf_files:
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                writer.add_page(page)
        with open(output_file, "wb") as output:
            writer.write(output)

    def split_pdf(self, output_prefix):
        """Split a PDF file into individual pages."""
        reader = PdfReader(self.file_path)
        for i, page in enumerate(reader.pages):
            writer = PdfWriter()
            writer.add_page(page)
            with open(f"{output_prefix}_{i+1}.pdf", "wb") as output:
                writer.write(output)

    def extract_metadata(self):
        """Extract metadata from a PDF file."""
        reader = self.read_pdf()
        meta = reader.metadata
        return {
            "title": meta.title,
            "author": meta.author,
            "subject": meta.subject,
            "creator": meta.creator,
        }

    def rotate_pages(self, output_file, angle):
        """Rotate pages in a PDF file."""
        reader = self.read_pdf()
        writer = PdfWriter()
        for page in reader.pages:
            page.rotate(angle)
            writer.add_page(page)
        with open(output_file, "wb") as output:
            writer.write(output)

    def ocr_scanned_pdf(self):
        """Perform OCR on a scanned PDF file."""
        images = convert_from_path(self.file_path)
        text = ""
        for i, image in enumerate(images):
            text += f"Page {i+1}:\n"
            text += pytesseract.image_to_string(image)
            text += "\n\n"
        return text

    def add_watermark(self, output_file, watermark_file):
        """Add a watermark to a PDF file."""
        watermark = PdfReader(watermark_file).pages[0]
        reader = self.read_pdf()
        writer = PdfWriter()
        for page in reader.pages:
            page.merge_page(watermark)
            writer.add_page(page)
        with open(output_file, "wb") as output:
            writer.write(output)

    def extract_images(self, output_prefix):
        """Extract images from a PDF file."""
        # Using pdfimages (poppler-utils)
        # pdfimages -j input.pdf output_prefix
        pass

    def password_protect(self, output_file, user_password, owner_password):
        """Add password protection to a PDF file."""
        reader = self.read_pdf()
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.encrypt(user_password, owner_password)
        with open(output_file, "wb") as output:
            writer.write(output)


def main():
    pdf_file = "document.pdf"
    processor = PDFProcessor(pdf_file)
    print(processor.extract_text())
    print(processor.extract_tables())
    processor.create_pdf("hello.pdf")
    processor.merge_pdfs("merged.pdf", ["doc1.pdf", "doc2.pdf", "doc3.pdf"])
    processor.split_pdf("page_")
    print(processor.extract_metadata())
    processor.rotate_pages("rotated.pdf", 90)
    print(processor.ocr_scanned_pdf())
    processor.add_watermark("watermarked.pdf", "watermark.pdf")
    processor.extract_images("image_")
    processor.password_protect("encrypted.pdf", "userpassword", "ownerpassword")


if __name__ == "__main__":
    main()