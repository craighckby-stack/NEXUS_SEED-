/**
 * Validates OOXML documents.
 *
 * @module validate
 */

import fs from 'fs';
import xml2js from 'xml2js';

/**
 * Validates an OOXML document.
 *
 * @param {string} filePath - The path to the OOXML document.
 * @returns {boolean} True if the document is valid, false otherwise.
 */
function validateOoxmlDocument(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const parser = new xml2js.Parser();
    parser.parseString(fileBuffer, (err, result) => {
      if (err) {
        throw err;
      }
    });
    return true;
  } catch (error) {
    console.error(`Error validating OOXML document: ${error}`);
    return false;
  }
}

export default validateOoxmlDocument;