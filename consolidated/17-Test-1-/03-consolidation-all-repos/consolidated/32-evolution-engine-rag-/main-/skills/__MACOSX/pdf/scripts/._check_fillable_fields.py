// skills/pdf/scripts/check_fillable_fields.mjs

/**
 * Module to check fillable fields in a PDF document.
 */

import { PdfReader } from 'pdfjs';

/**
 * Checks if a PDF document has fillable fields.
 *
 * @param {string} filePath - The path to the PDF file.
 * @returns {Promise<boolean>} True if the PDF has fillable fields, False otherwise.
 */
async function hasFillableFields(filePath) {
  try {
    const pdfBuffer = await readFile(filePath);
    const pdf = await PdfReader.open(pdfBuffer);
    for (const page of pdf.pages) {
      if (page.getAnnotations().length > 0) {
        for (const annotation of page.getAnnotations()) {
          if (annotation.getSubtype() === 'Widget' && annotation.getWidget().getFieldType() === 'Tx') {
            return true;
          }
        }
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`File not found: ${filePath}`);
    } else {
      console.error(`Error reading PDF: ${filePath}`);
    }
  }
  return false;
}

/**
 * Reads a file asynchronously.
 *
 * @param {string} filePath - The path to the file.
 * @returns {Promise<Buffer>} The file buffer.
 */
async function readFile(filePath) {
  const fs = await import('fs/promises');
  return fs.readFile(filePath);
}

/**
 * Main function.
 */
async function main() {
  const filePath = 'path_to_your_pdf_file.pdf'; // replace with your file path
  if (await hasFillableFields(filePath)) {
    console.log("The PDF has fillable fields.");
  } else {
    console.log("The PDF does not have fillable fields.");
  }
}

if (import.meta.main) {
  main();
}