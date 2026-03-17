/**
 * Dedicated utility for advanced template processing (beyond simple string replacement).
 * This is required if the system needs complex logic like conditionals, loops, or custom formatting
 * within SMS, Email, or Notification content, decoupling substitution complexity from specific utilities.
 *
 * @param {string} templateString - The template containing logic (e.g., Handlebars or EJS syntax).
 * @param {Object} data - The data context for rendering.
 * @param {Object} [options={}] - Rendering options (e.g., engine type, caching).
 * @returns {string} The fully rendered message.
 */

// Note: Actual implementation would rely on installing a library like Handlebars or Mustache.
// Since we cannot install external libraries here, this serves as a placeholder for the integrated utility.

function renderTemplate(templateString, data, options = {}) {
    // Placeholder implementation using basic substitution for demonstration.
    // In a real system, this would invoke a dedicated template engine library.
    
    const finalMessage = Object.entries(data || {}).reduce((msg, [key, value]) => {
        const replacement = String(value ?? ''); 
        const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
        return msg.replace(regex, replacement);
    }, templateString);
    
    // TODO: Integrate Handlebars, Nunjucks, or similar for complex logic.
    
    return finalMessage;
}

module.exports = { renderTemplate };