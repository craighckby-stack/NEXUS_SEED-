/**
 * @module BasicRenderer
 * Dedicated utility for handling basic variable substitution (templating).
 * This separates rendering concerns from SMS constraints logic (Single Responsibility Principle)
 * by delegating the work to the BasicTemplateRendererUtility plugin.
 */

// Conceptual access to the extracted utility plugin
// In a real environment, this import/access method would be dictated by the host kernel.
// We simulate the delegation call pattern here.
const BasicTemplateRendererUtility = require('@@plugin:BasicTemplateRendererUtility');

/**
 * Performs basic substitution of variables wrapped in {{ double brackets }}.
 * This utility is meant for simple placeholder replacement and does not support loops or conditionals.
 *
 * @param {string} template - The content string with placeholders.
 * @param {Object} [data={}] - Key-value pairs for substitution.
 * @returns {string} The rendered output string.
 */
function renderTemplate(template, data = {}) {
    try {
        if (!BasicTemplateRendererUtility || typeof BasicTemplateRendererUtility.execute !== 'function') {
            throw new Error("BasicTemplateRendererUtility plugin not available or improperly structured.");
        }
        
        // Delegate execution to the dedicated utility
        return BasicTemplateRendererUtility.execute({
            template: template,
            data: data
        });
    } catch (error) {
        // Log error and fall back to returning the original template if rendering fails
        console.error("Template rendering delegation failed:", error);
        return template;
    }
}

module.exports = {
    renderTemplate
};
