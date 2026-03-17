/**
 * Utility class to safely interpolate variables into a template string.
 */
class MessageInterpolationService {

  /**
   * Performs variable substitution in the template content.
   * 
   * Note: This simple implementation uses RegExp replacement (e.g., {{variable}}).
   * For complex scenarios, dedicated templating libraries (Handlebars, Lodash.template) 
   * should be integrated.
   * 
   * @param {string} templateContent - The string containing placeholders (e.g., 'Hello {{name}}').
   * @param {Object} data - Key/value pairs for substitution.
   * @returns {string} The fully interpolated message string.
   */
  static interpolate(templateContent, data) {
    if (!templateContent) return "";
    
    // Use a simple, non-greedy regex to find placeholders like {{key}}
    return templateContent.replace(/\{\{(.*?)\}\}?/g, (match, key) => {
      const trimmedKey = key.trim();
      const value = data && data[trimmedKey] !== undefined ? data[trimmedKey] : '';
      
      // Safely convert value to string, defaulting to empty string if undefined/null
      return String(value);
    });
  }

}

module.exports = MessageInterpolationService;