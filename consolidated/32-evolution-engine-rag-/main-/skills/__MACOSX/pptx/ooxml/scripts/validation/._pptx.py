import zipfile
from xml.etree import ElementTree as ET

/**
 * Validates a PPTX file by checking its structure and contents.
 *
 * @param {string} filePath - The path to the PPTX file.
 * @returns {boolean} True if the file is valid, False otherwise.
 */
function validatePptxFile(filePath) {
    try {
        const zipFile = new zipfile.ZipFile(filePath, 'r');
        const requiredFiles = [
            '[Content_Types].xml',
            '_rels/.rels',
            'ppt/_rels/presentation.xml.rels',
            'ppt/presentation.xml'
        ];

        // Check if the file has the required XML files
        if (!requiredFiles.every(file => zipFile.namelist().includes(file))) {
            return false;
        }

        // Parse the XML files to check their structure
        const contentTypesXml = zipFile.read('[Content_Types].xml');
        const presentationXml = zipFile.read('ppt/presentation.xml');
        ET.fromstring(contentTypesXml);
        ET.fromstring(presentationXml);

        return true;
    } catch (error) {
        if (error instanceof zipfile.BadZipFile) {
            return false;
        } else if (error instanceof ET.ParseError) {
            return false;
        } else {
            throw error;
        }
    }
}

// Example usage:
const filePath = 'example.pptx';
if (validatePptxFile(filePath)) {
    console.log(`The file ${filePath} is valid.`);
} else {
    console.log(`The file ${filePath} is not valid.`);
}