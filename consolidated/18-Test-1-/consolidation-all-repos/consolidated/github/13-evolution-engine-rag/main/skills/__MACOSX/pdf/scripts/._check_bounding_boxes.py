// skills/pdf/scripts/check_bounding_boxes.js

/**
 * Checks if the bounding boxes in a PDF file are valid.
 * 
 * @param {string} pdfFilePath - The path to the PDF file.
 * @returns {boolean} True if the bounding boxes are valid, False otherwise.
 */
async function checkBoundingBoxes(pdfFilePath) {
    try {
        // Import the required libraries
        const { PdfReader } = await import('pdfjs');

        // Open the PDF file
        const pdf = await PdfReader.open(pdfFilePath);

        // Iterate over each page in the PDF
        for (let pageNum = 0; pageNum < pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum + 1);

            // Get the text and layout of the page
            const text = await page.getTextContent();
            const layout = await page.getLayout();

            // Check if the bounding boxes are valid
            for (const element of layout.items) {
                if (!isBoundingBoxValid(element)) {
                    return false;
                }
            }
        }

        return true;
    } catch (error) {
        // Handle any exceptions that occur
        console.error(`An error occurred: ${error}`);
        return false;
    }
}

/**
 * Checks if a bounding box is valid.
 * 
 * @param {object} element - The bounding box element.
 * @returns {boolean} True if the bounding box is valid, False otherwise.
 */
function isBoundingBoxValid(element) {
    // Check if the element has the required keys
    const requiredKeys = ['x', 'y', 'width', 'height'];
    if (!requiredKeys.every(key => key in element)) {
        return false;
    }

    // Check if the coordinates are valid
    if (element.x < 0 || element.y < 0 || element.width < 0 || element.height < 0) {
        return false;
    }

    return true;
}

// Example usage
if (import.meta.main) {
    const pdfFilePath = "path_to_your_pdf_file.pdf";
    checkBoundingBoxes(pdfFilePath).then(result => {
        if (result) {
            console.log("The bounding boxes are valid.");
        } else {
            console.log("The bounding boxes are not valid.");
        }
    });
}