// Import required modules
import fs from 'fs/promises';
import { Presentation } from 'pptx';

/**
 * Converts an HTML string to a PPTX presentation.
 * 
 * @param {string} htmlString - The HTML string to convert.
 * @param {string} [outputFile='output.pptx'] - The file path to save the PPTX presentation.
 * @returns {Promise<void>} A promise that resolves when the PPTX presentation is saved.
 */
async function convertHtmlToPptx(htmlString, outputFile = 'output.pptx') {
  // Create a new PPTX presentation
  const presentation = new Presentation();

  // Add a slide to the presentation
  const slide = presentation.addSlide();

  // Add a text box to the slide
  const textBox = slide.addTextBox();

  // Set the text box content to the HTML string
  textBox.text = htmlString;

  // Save the presentation to a file
  await presentation.save(outputFile);
}

// Export the function
export default convertHtmlToPptx;