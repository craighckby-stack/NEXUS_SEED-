import json
import sys
from PIL import Image, ImageDraw

/**
 * Creates "validation" images with rectangles for the bounding box information.
 * 
 * @param {number} pageNumber - The page number to create the validation image for.
 * @param {string} fieldsJsonPath - The path to the fields.json file.
 * @param {string} inputImagePath - The path to the input image.
 * @param {string} outputImagePath - The path to the output image.
 */
function createValidationImage(pageNumber, fieldsJsonPath, inputImagePath, outputImagePath) {
    // Load fields.json data
    const fieldsData = loadFieldsData(fieldsJsonPath);

    // Open the input image
    const img = Image.open(inputImagePath);
    const draw = ImageDraw.Draw(img);
    let numBoxes = 0;

    // Iterate over form fields and draw bounding boxes
    fieldsData.formFields.forEach((field) => {
        if (field.pageNumber === pageNumber) {
            const entryBox = field.entryBoundingBox;
            const labelBox = field.labelBoundingBox;

            // Draw red rectangle over entry bounding box and blue rectangle over the label
            drawRectangle(draw, entryBox, 'red', 2);
            drawRectangle(draw, labelBox, 'blue', 2);
            numBoxes += 2;
        }
    });

    // Save the output image
    img.save(outputImagePath);
    console.log(`Created validation image at ${outputImagePath} with ${numBoxes} bounding boxes`);
}

/**
 * Loads fields.json data from the specified path.
 * 
 * @param {string} fieldsJsonPath - The path to the fields.json file.
 * @returns {object} The loaded fields.json data.
 */
function loadFieldsData(fieldsJsonPath) {
    const fs = require('fs');
    const data = fs.readFileSync(fieldsJsonPath, 'utf8');
    return JSON.parse(data);
}

/**
 * Draws a rectangle on the image.
 * 
 * @param {ImageDraw} draw - The ImageDraw object.
 * @param {array} box - The bounding box coordinates.
 * @param {string} color - The color of the rectangle.
 * @param {number} width - The width of the rectangle.
 */
function drawRectangle(draw, box, color, width) {
    draw.rectangle(box, outline=color, width=width);
}

if (require.main === module) {
    if (process.argv.length !== 5) {
        console.log("Usage: create_validation_image.py [page number] [fields.json file] [input image path] [output image path]");
        process.exit(1);
    }
    const pageNumber = parseInt(process.argv[2]);
    const fieldsJsonPath = process.argv[3];
    const inputImagePath = process.argv[4];
    const outputImagePath = process.argv[5];
    createValidationImage(pageNumber, fieldsJsonPath, inputImagePath, outputImagePath);
}