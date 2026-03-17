/**
 * ArtifactDefinitionComposer.js
 * Facilitates the creation and management of complex ArtifactStructuralDefinitions
 * by allowing composition of reusable structural templates (patterns).
 * This utility reduces boilerplate and enforces consistency across large projects.
 */

class ArtifactDefinitionComposer {

  constructor() {
    this.templates = {};
  }

  /**
   * Registers a reusable structural template.
   * @param {string} name - Template name (e.g., 'ReactComponent', 'NodeModule').
   * @param {Object} definition - The partial definition structure.
   */
  registerTemplate(name, definition) {
    if (this.templates[name]) {
      console.warn(`Template '${name}' is being overwritten.`);
    }
    this.templates[name] = definition;
  }

  /**
   * Retrieves a registered template.
   * @param {string} name - Template name.
   * @returns {Object|null}
   */
  getTemplate(name) {
    return this.templates[name] || null;
  }

  /**
   * Merges multiple definitions/templates into a single output structure.
   * Note: This is a shallow merge, deeper merging logic should be handled by the caller
   * or through recursive specific merge strategies if complexity dictates.
   *
   * @param {Array<Object>} definitions - Array of definitions or template names to merge.
   * @returns {Object} The consolidated ArtifactStructuralDefinition.
   */
  compose(definitions) {
    const finalDefinition = {};

    for (const item of definitions) {
      let definitionToMerge;
      
      if (typeof item === 'string') {
        definitionToMerge = this.getTemplate(item);
        if (!definitionToMerge) {
          throw new Error(`Template '${item}' not found during composition.`);
        }
      } else if (typeof item === 'object' && item !== null) {
        definitionToMerge = item;
      } else {
        continue; 
      }

      // Simple key-level merge (deep merging is left to specific utilities if necessary)
      Object.assign(finalDefinition, definitionToMerge);
    }

    return finalDefinition;
  }
}

module.exports = ArtifactDefinitionComposer;