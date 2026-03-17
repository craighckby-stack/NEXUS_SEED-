import pypdfium2 as pdfium
from PIL import Image
import numpy as np
import logging
from pypdf import PdfReader, PdfWriter
import os
import glob
from pdfplumber import open as pdf_open
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def render_pdf_to_image(pdf_path, output_path, scale=2.0):
    """
    Render PDF to image.
    
    Args:
        pdf_path (str): Path to the PDF file.
        output_path (str): Path to save the image.
        scale (float, optional): Scale factor. Defaults to 2.0.
    """
    pdf = pdfium.PdfDocument(pdf_path)
    page = pdf[0]
    bitmap = page.render(scale=scale)
    img = bitmap.to_pil()
    img.save(output_path, "PNG")

def extract_text_with_pypdfium2(pdf_path):
    """
    Extract text from PDF using pypdfium2.
    
    Args:
        pdf_path (str): Path to the PDF file.
    
    Returns:
        str: Extracted text.
    """
    pdf = pdfium.PdfDocument(pdf_path)
    text = ""
    for page in pdf:
        text += page.get_text()
    return text

def extract_text_with_pdfplumber(pdf_path):
    """
    Extract text from PDF using pdfplumber.
    
    Args:
        pdf_path (str): Path to the PDF file.
    
    Returns:
        str: Extracted text.
    """
    with pdf_open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text()
        return text

def create_report_with_reportlab(data, output_path):
    """
    Create a report with reportlab.
    
    Args:
        data (list): Data to include in the report.
        output_path (str): Path to save the report.
    """
    doc = SimpleDocTemplate(output_path)
    elements = []
    
    # Add title
    styles = getSampleStyleSheet()
    title = Paragraph("Quarterly Sales Report", styles['Title'])
    elements.append(title)
    
    # Add table with advanced styling
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(table)
    
    doc.build(elements)

def batch_process_pdfs(input_dir, operation='merge'):
    """
    Batch process PDFs.
    
    Args:
        input_dir (str): Directory containing PDF files.
        operation (str, optional): Operation to perform. Defaults to 'merge'.
    """
    pdf_files = glob.glob(os.path.join(input_dir, "*.pdf"))
    
    if operation == 'merge':
        writer = PdfWriter()
        for pdf_file in pdf_files:
            try:
                reader = PdfReader(pdf_file)
                for page in reader.pages:
                    writer.add_page(page)
                logger.info(f"Processed: {pdf_file}")
            except Exception as e:
                logger.error(f"Failed to process {pdf_file}: {e}")
                continue
        
        with open("batch_merged.pdf", "wb") as output:
            writer.write(output)
    
    elif operation == 'extract_text':
        for pdf_file in pdf_files:
            try:
                reader = PdfReader(pdf_file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                
                output_file = pdf_file.replace('.pdf', '.txt')
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(text)
                logger.info(f"Extracted text from: {pdf_file}")
                
            except Exception as e:
                logger.error(f"Failed to extract text from {pdf_file}: {e}")
                continue

def main():
    # Example usage
    pdf_path = "document.pdf"
    output_path = "output.png"
    render_pdf_to_image(pdf_path, output_path)
    
    text = extract_text_with_pypdfium2(pdf_path)
    print(text)
    
    data = [
        ['Product', 'Q1', 'Q2', 'Q3', 'Q4'],
        ['Widgets', '120', '135', '142', '158'],
        ['Gadgets', '85', '92', '98', '105']
    ]
    create_report_with_reportlab(data, "report.pdf")
    
    input_dir = "input_pdfs"
    batch_process_pdfs(input_dir, operation='merge')

if __name__ == "__main__":
    main()