/**
 * Validation Tool
 * Validates HTML, JSON, and configuration files
 */

const fs = require('fs');
const path = require('path');

function validateFile(filePath, validator) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return validator(content);
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

function validateHTML(content) {
    // Basic HTML validation
    if (!content.includes('<!DOCTYPE html>')) {
        return { valid: false, error: 'Missing DOCTYPE declaration' };
    }
    if (!content.includes('</html>')) {
        return { valid: false, error: 'Missing closing HTML tag' };
    }
    return { valid: true };
}

function validateJSON(content) {
    try {
        JSON.parse(content);
        return { valid: true };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// Validate main files
console.log('Validating index.html...');
const htmlResult = validateFile('index.html', validateHTML);
console.log(htmlResult.valid ? '✅ HTML is valid' : `❌ HTML error: ${htmlResult.error}`);

console.log('\nValidating config/evolution.json...');
const configResult = validateFile('config/evolution.json', validateJSON);
console.log(configResult.valid ? '✅ Config is valid' : `❌ Config error: ${configResult.error}`);

console.log('\nValidation complete!');
