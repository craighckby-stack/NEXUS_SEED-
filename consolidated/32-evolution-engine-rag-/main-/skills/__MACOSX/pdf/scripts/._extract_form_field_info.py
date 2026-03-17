// skills/pdf/scripts/extractFormFields.js

/**
 * Extracts form field information from a PDF file.
 */

import { PdfReader } from 'pdfjs';

/**
 * Extracts form field information from a PDF file.
 *
 * @param {string} pdfFilePath - The path to the PDF file.
 * @returns {Promise<Object>} A dictionary containing the form field information.
 */
async function extractFormFields(pdfFilePath) {
  const pdf = await PdfReader.open(pdfFilePath);
  const formFields = {};

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const annotations = await page.getAnnotations();

    annotations.forEach((annotation) => {
      if (annotation.subtype === 'Widget' && annotation.fieldType === 'Tx') {
        formFields[annotation.fieldName] = annotation.fieldValue;
      }
    });
  }

  return formFields;
}

/**
 * The main function.
 */
async function main() {
  const pdfFilePath = 'path_to_your_pdf_file.pdf';
  const formFields = await extractFormFields(pdfFilePath);
  console.log(formFields);
}

if (import.meta.main) {
  main();
}