// skills/pdf/scripts/fill_pdf_form_with_annotations.js

import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { PdfReader, PdfWriter } from 'pdfjs';

/**
 * Fill a PDF form with annotations.
 *
 * @param {string} pdfFilePath - The path to the PDF file.
 * @param {Object<string, string>} annotations - A dictionary of annotations where the key is the field name and the value is the field value.
 * @returns {Promise<void>}
 */
async function fillPdfFormWithAnnotations(pdfFilePath, annotations) {
  // Check if the PDF file exists
  if (!existsSync(pdfFilePath)) {
    throw new Error(`The PDF file ${pdfFilePath} does not exist.`);
  }

  // Open the PDF file
  const pdfReader = new PdfReader(pdfFilePath);
  const pdfWriter = new PdfWriter();

  // Get the form fields
  const formFields = await pdfReader.getFormTextFields();

  // Fill the form fields with annotations
  for (const [fieldName, fieldValue] of Object.entries(annotations)) {
    if (fieldName in formFields) {
      await pdfReader.updatePageFormFieldValues(0, { [fieldName]: fieldValue });
    }
  }

  // Save the updated PDF file
  const pdfBuffer = await pdfWriter.write(pdfReader);
  await Deno.writeFile(pdfFilePath, pdfBuffer);
}

// Example usage
if (import.meta.main) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const pdfFilePath = join(__dirname, 'path_to_your_pdf_file.pdf');
  const annotations = { field1: 'value1', field2: 'value2' };
  fillPdfFormWithAnnotations(pdfFilePath, annotations).catch((error) => console.error(error));
}