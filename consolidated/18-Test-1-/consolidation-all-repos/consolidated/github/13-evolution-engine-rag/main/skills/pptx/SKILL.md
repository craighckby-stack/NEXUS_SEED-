// Import required modules
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sharp = require('sharp');
const pptxgen = require('pptxgenjs');
const { exec } = require('child_process');

// Define constants
const TEMPLATE_DIR = 'templates';
const OUTPUT_DIR = 'output';
const THUMBNAIL_PREFIX = 'thumbnails';

// Function to create thumbnail grid
async function createThumbnailGrid(pptxFile, outputPrefix = THUMBNAIL_PREFIX) {
  const presentation = new pptxgen();
  await presentation.load(pptxFile);
  const slides = presentation.slides;
  const thumbnailWidth = 200;
  const thumbnailHeight = 150;
  const columns = 5;
  const rows = Math.ceil(slides.length / columns);

  for (let i = 0; i < rows; i++) {
    const rowSlides = slides.slice(i * columns, (i + 1) * columns);
    const rowImages = await Promise.all(rowSlides.map((slide) => {
      const image = sharp({
        create: {
          width: thumbnailWidth,
          height: thumbnailHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        },
      });
      return image.composite([{
        input: slide.image,
        top: 0,
        left: 0,
      }]);
    }));

    const rowImage = sharp({
      create: {
        width: thumbnailWidth * columns,
        height: thumbnailHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      },
    });
    await rowImage.composite(rowImages.map((image, index) => ({
      input: image,
      top: 0,
      left: index * thumbnailWidth,
    })));

    const outputFile = path.join(OUTPUT_DIR, `${outputPrefix}-${i}.jpg`);
    await rowImage.toFile(outputFile);
  }
}

// Function to convert PPTX to PDF
async function convertPptxToPdf(pptxFile) {
  const pdfFile = pptxFile.replace('.pptx', '.pdf');
  const command = `soffice --headless --convert-to pdf ${pptxFile}`;
  await promisify(exec)(command);
  return pdfFile;
}

// Function to convert PDF to images
async function convertPdfToImages(pdfFile) {
  const command = `pdftoppm -jpeg -r 150 ${pdfFile} slide`;
  await promisify(exec)(command);
  const images = [];
  const files = await promisify(fs.readdir)(OUTPUT_DIR);
  for (const file of files) {
    if (file.startsWith('slide-') && file.endsWith('.jpg')) {
      images.push(file);
    }
  }
  return images;
}

// Main function
async function main() {
  const pptxFile = 'example.pptx';
  await createThumbnailGrid(pptxFile);
  const pdfFile = await convertPptxToPdf(pptxFile);
  const images = await convertPdfToImages(pdfFile);
  console.log(images);
}

main();