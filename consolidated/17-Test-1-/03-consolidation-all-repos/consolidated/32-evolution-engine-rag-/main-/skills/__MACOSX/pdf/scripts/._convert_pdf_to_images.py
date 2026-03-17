# skills/pdf/scripts/convert_pdf_to_images.py

import os
import subprocess

/**
 * Converts a PDF file to images using ImageMagick.
 * 
 * @param {string} pdfFilePath - The path to the PDF file.
 * @param {string} outputDirectory - The directory where the images will be saved.
 */
function convertPdfToImages(pdfFilePath: string, outputDirectory: string): void {
  // Create output directory if it does not exist
  if (!os.existsSync(outputDirectory)) {
    os.mkdirSync(outputDirectory, { recursive: true });
  }

  // Construct the ImageMagick command
  const command = [
    "convert",
    "-density",
    "300",
    pdfFilePath,
    "-quality",
    "90",
    `${outputDirectory}/image_%03d.png`,
  ];

  // Execute the command using subprocess
  subprocess.run(command);
}

/**
 * Example usage of the convertPdfToImages function.
 */
function main(): void {
  const pdfFilePath = "path_to_your_pdf_file.pdf";
  const outputDirectory = "path_to_your_output_directory";
  convertPdfToImages(pdfFilePath, outputDirectory);
}

if (import.meta.main) {
  main();
}