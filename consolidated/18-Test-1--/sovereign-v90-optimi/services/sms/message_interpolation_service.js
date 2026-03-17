/**
 * Utility class to safely interpolate variables into a template string.
 */

// Assuming the SimpleTemplateInterpolator utility is made available via module resolution or dependency injection
const SimpleTemplateInterpolator = require('./plugins/SimpleTemplateInterpolator'); 

class MessageInterpolationService {

  /**
   * Performs variable substitution in the template content.
   * 
   * Delegates core logic to the reusable SimpleTemplateInterpolator plugin.
   * 
   * @param {string} templateContent - The string containing placeholders (e.g., 'Hello {{name}}').
   * @param {Object} data - Key/value pairs for substitution.
   * @returns {string} The fully interpolated message string.
   */
  static interpolate(templateContent, data) {
    // Delegation to the extracted plugin
    return SimpleTemplateInterpolator.interpolate(templateContent, data);
  }

}

module.exports = MessageInterpolationService;