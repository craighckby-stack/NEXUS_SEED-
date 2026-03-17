/**
 * Validation Tool (Optimized Async)
 * Validates HTML, JSON, and configuration files using non-blocking I/O.
 */

const fs = require('fs').promises; // Use async promises API
const path = require('path');

/**
 * Reads a file content asynchronously and applies a validator function.
 * @param {string} filePath - The path to the file.
 * @param {function(string): {valid: boolean, error?: string}} validator - The validation function.
 * @returns {Promise<{valid: boolean, error?: string}>} The validation result.
 */
async function validateFile(filePath, validator) {
    try {
        // Optimized: Non-blocking file read operation
        const content = await fs.readFile(filePath, 'utf-8');
        return validator(content);
    } catch (error) {
        // Handle file reading or access errors efficiently
        return { valid: false, error: `File Read Error: ${error.message}` };
    }
}

/**
 * Performs basic HTML structure validation.
 */
function validateHTML(content) {
    if (!content.includes('<!DOCTYPE html>')) {
        return { valid: false, error: 'Missing DOCTYPE declaration' };
    }
    if (!content.includes('</html>')) {
        return { valid: false, error: 'Missing closing HTML tag' };
    }
    // Note: For real HTML validation, external libraries like 'html-validate' should be used.
    return { valid: true };
}

/**
 * Performs JSON parsing validation.
 */
function validateJSON(content) {
    try {
        // Optimization: Rely on native, highly optimized JSON.parse
        JSON.parse(content);
        return { valid: true };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

/**
 * Main execution function to coordinate asynchronous validation.
 */
async function main() {
    const filesToValidate = [
        { path: 'index.html', type: 'HTML', validator: validateHTML },
        { path: 'config/evolution.json', type: 'Config JSON', validator: validateJSON }
    ];
    
    console.log('--- Validation Tool (Optimized Async) ---\n');

    for (const file of filesToValidate) {
        console.log(`Validating ${file.path}...`);
        
        // Use await to ensure sequential logging, while file I/O remains non-blocking.
        const result = await validateFile(file.path, file.validator);
        
        const status = result.valid ? '✅' : '❌';
        const message = result.valid ? `${file.type} is valid` : `${file.type} error: ${result.error}`;
        
        console.log(`${status} ${message}`);
    }

    console.log('\nValidation complete!');
}

main().catch(err => {
    console.error('An unexpected error occurred during validation:', err);
    process.exit(1);
});