/**
 * @fileoverview Utility script to generate the concept ID constants file.
 * This script reads concept definitions from src/core/conceptRegistry.js
 * and converts them into standardized, exportable constant names (e.g., AGI_C_04) at
 * src/constants/conceptIds.js to ensure compile-time type safety throughout the codebase.
 */

const fs = require('fs');
const path = require('path');

// NOTE: We rely on the raw structure definition here to avoid module import complexities in a build script.
const registryPath = path.resolve(__dirname, '..', 'core', 'conceptRegistry.js');
const outputPath = path.resolve(__dirname, '..', 'constants', 'conceptIds.js');

// Simple extraction function (avoids complex parser needed for full JS execution)
function extractRawConceptDefinitions() {
    const content = fs.readFileSync(registryPath, 'utf8');
    const regex = /RAW_CONCEPT_DEFINITIONS\s*=\s*Object\.freeze\((\s*\[[\s\S]*?\])\)/;
    const match = content.match(regex);
    
    if (!match || match.length < 2) {
        throw new Error('Could not find or parse RAW_CONCEPT_DEFINITIONS in registry file.');
    }
    
    // Safely execute the extracted array definition to get the list of IDs.
    // NOTE: This assumes a trusted source (our own code).
    const conceptDefinitionsString = match[1].replace(/\n/g, '').replace(/\s{2,}/g, ' ');
    // eslint-disable-next-line no-eval
    const definitions = eval(`(${conceptDefinitionsString})`);
    
    return definitions;
}

/**
 * Converts a concept ID (e.g., 'AGI-C-04') into a safe, snake_case constant name (e.g., 'AGI_C_04').
 * @param {string} id 
 */
function formatIdToConstant(id) {
    return id.toUpperCase().replace(/-/g, '_');
}

function generateConceptIdsFile() {
    let definitions;
    try {
        definitions = extractRawConceptDefinitions();
    } catch (error) {
        console.error('Error extracting concept definitions:', error.message);
        return;
    }

    let outputContent = '/**\n * @fileoverview AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.\n * Generated from src/core/conceptRegistry.js by src/tools/conceptIdGenerator.js\n */\n\n';
    
    const allIds = definitions.map(def => def.id);
    
    outputContent += '/**\n * A centralized collection of all immutable concept ID strings.\n * Use these constants to reference core AGI concepts instead of raw strings.\n * @readonly\n * @enum {string}\n */\n';
    outputContent += 'export const ConceptIds = Object.freeze({\n';

    allIds.forEach(id => {
        const constantName = formatIdToConstant(id);
        outputContent += `    ${constantName}: '${id}',\n`;
    });
    
    outputContent += '});\n';

    // Individual exports for better tooling support (e.g., TypeScript imports)
    outputContent += '\n// Individual ID exports for convenience\n';
    allIds.forEach(id => {
        const constantName = formatIdToConstant(id);
        outputContent += `export const ${constantName} = ConceptIds.${constantName};\n`;
    });

    fs.writeFileSync(outputPath, outputContent, 'utf8');
    console.log(`[AGI] Successfully generated ${allIds.length} concept constants to ${outputPath}`);
}

// In a production environment, this would run as a pre-commit hook or build step.
// Example execution: generateConceptIdsFile();

module.exports = { generateConceptIdsFile, extractRawConceptDefinitions };
