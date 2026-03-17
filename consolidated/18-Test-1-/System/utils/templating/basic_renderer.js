/**
 * @module BasicRenderer
 * Dedicated utility for handling basic variable substitution (templating).
 * This separates rendering concerns from SMS constraints logic (Single Responsibility Principle).
 */

/**
 * Performs basic substitution of variables wrapped in {{ double brackets }}.
 * This utility is meant for simple placeholder replacement and does not support loops or conditionals.
 *
 * @param {string} template - The content string with placeholders.
 * @param {Object} [data={}] - Key-value pairs for substitution.
 * @returns {string} The rendered output string.
 */
function renderTemplate(template, data = {}) {
    if (!data || Object.keys(data).length === 0) {
        return template;
    }

    return Object.entries(data).reduce((output, [key, value]) => {
        // Ensure null/undefined values are rendered as empty strings
        const replacement = String(value ?? '');
        
        // Matches {{key}}, {{ key }}, {{key }} (case-sensitive)
        const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
        
        return output.replace(regex, replacement);
    }, template);
}

module.exports = {
    renderTemplate
};
