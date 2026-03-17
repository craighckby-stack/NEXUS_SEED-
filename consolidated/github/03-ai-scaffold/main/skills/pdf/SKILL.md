"""
PDF Processing Guide

Comprehensive guide for extracting text and tables, creating new PDFs, merging/splitting documents,
handling forms, and performing common tasks like adding watermarks and password protection.
"""

import os
import subprocess
from typing import List, Dict

# Project Root
ROOT = os.path.dirname(os.path.dirname(__file__))

# pypdf (Basic Operations)
def merge_pdfs(pdfs: List[str]) -> str:
    """
    Merge multiple PDFs into one.
    
    Args:
    - pdfs (List[str]): List of PDF file paths to merge.
    
    Returns:
    - str: Path to the merged PDF file.
    """
    # Read PDFs
    pdfs = [PdfReader(pdf) for pdf in pdfs]
    
    # Merge pages
    merged_pdf = PdfWriter()
    for pdf in pdfs:
        for page in pdf.pages:
            merged_pdf.add_page(page)
    
    # Save merged PDF
    with open("merged.pdf", "wb") as output:
        merged_pdf.write(output)
    
    return os.path.join(ROOT, "merged.pdf")

def split_pdf(input_pdf: str, output_dir: str) -> None:
    """
    Split a PDF into individual pages.
    
    Args:
    - input_pdf (str): Path to the PDF file to split.
    - output_dir (str): Directory to save individual pages.
    """
    # Read PDF
    reader = PdfReader(input_pdf)
    
    # Split pages
    for i, page in enumerate(reader.pages):
        writer = PdfWriter()
        writer.add_page(page)
        with open(os.path.join(output_dir, f"page_{i+1}.pdf"), "wb") as output:
            writer.write(output)

# pdfplumber (Text and Table Extraction)
def extract_text_with_layout(pdf_path: str) -> str:
    """
    Extract text from a PDF with layout.
    
    Args:
    - pdf_path (str): Path to the PDF file to extract text from.
    
    Returns:
    - str: Extracted text.
    """
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text()
        return text

def extract_tables(pdf_path: str) -> List[Dict]:
    """
    Extract tables from a PDF.
    
    Args:
    - pdf_path (str): Path to the PDF file to extract tables from.
    
    Returns:
    - List[Dict]: List of extracted tables.
    """
    with pdfplumber.open(pdf_path) as pdf:
        tables = []
        for page in pdf.pages:
            tables.extend(page.extract_tables())
        return tables

# reportlab (Create PDFs)
def create_basic_pdf(title: str, content: str, output_path: str) -> None:
    """
    Create a basic PDF with title and content.
    
    Args:
    - title (str): Title of the PDF.
    - content (str): Content of the PDF.
    - output_path (str): Path to save the PDF file.
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    
    c = canvas.Canvas(output_path, pagesize=letter)
    c.drawString(100, 750, title)
    c.drawString(100, 720, content)
    c.save()

# Command-Line Tools
def merge_pdfs_cmd(pdfs: List[str]) -> None:
    """
    Merge multiple PDFs into one using qpdf.
    
    Args:
    - pdfs (List[str]): List of PDF file paths to merge.
    """
    command = f"qpdf --empty --pages {' '.join(pdfs)} merged.pdf"
    subprocess.run(command, shell=True)

def extract_text_cmd(pdf_path: str) -> None:
    """
    Extract text from a PDF using pdftotext.
    
    Args:
    - pdf_path (str): Path to the PDF file to extract text from.
    """
    command = f"pdftotext -layout {pdf_path} output.txt"
    subprocess.run(command, shell=True)

# Common Tasks
def add_watermark(input_pdf: str, watermark_pdf: str, output_pdf: str) -> None:
    """
    Add a watermark to a PDF using pypdf.
    
    Args:
    - input_pdf (str): Path to the PDF file to add a watermark to.
    - watermark_pdf (str): Path to the PDF file with the watermark.
    - output_pdf (str): Path to save the PDF with the watermark.
    """
    reader = PdfReader(input_pdf)
    watermark = PdfReader(watermark_pdf).pages[0]
    writer = PdfWriter()
    for page in reader.pages:
        page.merge_page(watermark)
        writer.add_page(page)
    with open(output_pdf, "wb") as output:
        writer.write(output)