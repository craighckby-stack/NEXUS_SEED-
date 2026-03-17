import zipfile
import os

/**
 * Unpacks an OOXML file to the specified output directory.
 * 
 * @param {string} filePath - The path to the OOXML file.
 * @param {string} outputDir - The directory where the unpacked files will be written.
 */
function unpackOoxml(filePath: string, outputDir: string): void {
    const zipRef = new zipfile.ZipFile(filePath, 'r');
    try {
        zipRef.extractAll(outputDir);
    } finally {
        zipRef.close();
    }
}

/**
 * Main entry point for the script.
 */
function main(): void {
    // Example usage:
    const filePath = 'example.docx';
    const outputDir = 'unpacked';
    os.mkdirSync(outputDir, { recursive: true });
    unpackOoxml(filePath, outputDir);
}

if (require.main === module) {
    main();
}