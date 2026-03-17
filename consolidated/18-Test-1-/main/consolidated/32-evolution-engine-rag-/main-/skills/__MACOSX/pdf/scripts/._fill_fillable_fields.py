// skills/pdf/scripts/fill_fillable_fields.mjs

/**
 * Module for filling fillable fields in PDFs.
 */

import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import pypdf from 'pypdf';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Fill fillable fields in a PDF.
 * 
 * @param {string} pdfPath - Path to the input PDF.
 * @param {string} outputPath - Path to the output PDF.
 * @param {Object<string, string>} fields - Dictionary of field names and values.
 */
async function fillFillableFields(pdfPath, outputPath, fields) {
  try {
    // Open the PDF in read-binary mode
    const pdfReader = await pypdf.PdfReader.open(pdfPath);

    // Create a PdfWriter object
    const pdfWriter = new pypdf.PdfWriter();

    // Iterate over the pages in the PDF
    for (let page of pdfReader.pages) {
      // Add the page to the PdfWriter object
      pdfWriter.addPage(page);

      // Iterate over the fields
      for (const [fieldName, fieldValue] of Object.entries(fields)) {
        // Update the field value
        pdfWriter.updatePageFormFieldValues(page, { [fieldName]: fieldValue });
      }
    }

    // Open the output PDF in write-binary mode
    const outputFile = await Deno.open(outputPath, { create: true, write: true });
    // Write the PdfWriter object to the output PDF
    await pdfWriter.write(outputFile);
    outputFile.close();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Main function.
 */
async function main() {
  try {
    // Define the input and output PDF paths
    const pdfPath = join(__dirname, 'input.pdf');
    const outputPath = join(__dirname, 'output.pdf');

    // Define the fields to fill
    const fields = {
      field1: 'value1',
      field2: 'value2',
    };

    // Fill the fillable fields
    await fillFillableFields(pdfPath, outputPath, fields);
  } catch (error) {
    console.error(error);
  }
}

if (import.meta.main) {
  main();
}