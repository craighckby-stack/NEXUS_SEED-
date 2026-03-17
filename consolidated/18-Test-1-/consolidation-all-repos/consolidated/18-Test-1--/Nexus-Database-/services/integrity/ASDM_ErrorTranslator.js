/**
 * ASDM_ErrorTranslator V1.0
 * Component responsible for converting standardized internal validation issues (StandardIssue)
 * into finalized, human-readable error messages for consumption by external APIs or UI.
 * This separation ensures the core ValidationResultProcessor remains focused purely on data transformation, 
 * delegating message presentation concerns here.
 */

/**
 * @typedef {object} StandardIssue
 * @property {string} schema - The key of the schema validated against.
 * @property {string} field - The canonical path of the invalid data.
 * @property {string} code - The type of validation failure (Ajv keyword).
 * @property {string} message - The original generated error message (used as fallback).
 */

/**
 * Takes a standardized issue and formats a highly contextual message.
 * Placeholder for a future localization and template system.
 * 
 * @param {StandardIssue} issue 
 * @param {string} [locale='en-US'] - Optional locale setting.
 * @returns {string} The final, user-ready error message.
 */
export function translateIssueToUserMessage(issue, locale = 'en-US') {
    const { field, code, message } = issue;

    // In production, load messages from a configuration file mapped by schema/code.
    
    // Convert JSON Pointer path to dot notation for user readability
    const cleanedField = field.startsWith('/') ? field.substring(1).replace(/\//g, '.') : field;

    let userMessage = message;

    switch (code) {
        case 'required':
            userMessage = `The field '${cleanedField}' is required and missing.`;
            break;
        case 'type':
            // Assumes Ajv message contains necessary details about expected type
            userMessage = `The value provided for '${cleanedField}' is the wrong data type. Details: ${message}`;
            break;
        default:
            // Use the generic Ajv message as a default fallback
            userMessage = `Field ${cleanedField} failed validation check '${code}'.`;
    }

    return userMessage;
}

export const ASDM_ErrorTranslator = {
    translate: translateIssueToUserMessage
};
