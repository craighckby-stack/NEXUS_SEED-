/**
 * ArtifactValidator.js
 * Provides logic for recursively comparing the generated artifact structure
 * against the required ArtifactStructuralDefinition schema.
 */

// Standardized error codes for machine readability
const ARTIFACT_ERRORS = {
  MISSING_ENTRY: 'MISSING_ENTRY',
  TYPE_MISMATCH: 'TYPE_MISMATCH',
  UNEXPECTED_ENTRY: 'UNEXPECTED_ENTRY', // Added support for strict mode validation
  CONTENT_VALIDATION_FAILED: 'CONTENT_VALIDATION_FAILED'
};

class ArtifactValidator {

  /**
   * @param {Object} dependencies - Optional dependencies, notably contentValidatorRegistry.
   */
  constructor({ contentValidatorRegistry } = {}) {
    // Dependency injection allows separation of structural concerns from content concerns
    this.contentValidatorRegistry = contentValidatorRegistry;
  }

  /**
   * Compares the target structure (what was generated) against the
   * required definition (what should have been generated).
   *
   * @param {Object} definitionStructure - The required structure schema (nested definition).
   *                                       Definitions can contain a '$config: { strict: boolean }' key.
   * @param {Object} runtimeArtifact - The generated files/directories object (nested structure).
   * @returns {Promise<{success: boolean, errors: {code: string, path: string, message: string}[]}>}
   */
  async validate(definitionStructure, runtimeArtifact) {
    if (!definitionStructure) {
      return { success: true, errors: [] }; 
    }
    if (!runtimeArtifact) {
      return { 
        success: false, 
        errors: [{
          code: ARTIFACT_ERRORS.MISSING_ENTRY, 
          path: '/', 
          message: "Runtime artifact is entirely missing."
        }]
      };
    }

    const errors = [];
    await this._validateRecursive(definitionStructure, runtimeArtifact, '/', errors);

    return {
      success: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Utility to construct a clean path string.
   * @private
   */
  _buildPath(parentPath, key, isDir) {
    const base = parentPath === '/' ? key : `${parentPath.replace(/\/$/, '')}/${key}`;
    return isDir ? `${base}/` : base;
  }

  /**
   * Recursive validation core logic.
   * Assumes definitionStructure nodes define `type` ('file'/'directory'), `required` (boolean),
   * and optionally `children` or `contentValidator`.
   * Allows metadata via '$config' key in the expected definition map (children object).
   *
   * @private
   */
  async _validateRecursive(expectedNode, actualNode, currentPath, errors) {
    // Extract config and structural keys, filtering out metadata keys (prefixed with $)
    const allExpectedKeys = Object.keys(expectedNode);
    const structuralKeys = allExpectedKeys.filter(key => !key.startsWith('$'));
    const strictMode = expectedNode.$config?.strict === true;

    // 1. Check entries required by definition
    for (const key of structuralKeys) {
      const expected = expectedNode[key];
      const actual = actualNode[key];
      const expectedIsDir = expected.type === 'directory';

      // Clean path generation using helper
      const childPath = this._buildPath(currentPath, key, expectedIsDir);

      if (expected.required && !actual) {
        errors.push({
          code: ARTIFACT_ERRORS.MISSING_ENTRY,
          path: childPath,
          message: `${expectedIsDir ? 'Directory' : 'File'} required by definition is missing.`
        });
        continue; 
      }

      if (actual) {
        // Determine if the actual entry is a directory (nested object without 'content')
        const isActualDirectory = typeof actual === 'object' && actual !== null && !('content' in actual);

        if (expectedIsDir) {
          if (!isActualDirectory) {
             errors.push({
              code: ARTIFACT_ERRORS.TYPE_MISMATCH,
              path: childPath,
              message: `Expected directory, but found a file or malformed structure.`
            });
          } else if (expected.children) {
            // Recurse, passing expected children definition and actual structure
            await this._validateRecursive(expected.children, actual, childPath, errors);
          }
        } else { // Expected type is 'file'
          if (isActualDirectory) {
            errors.push({
              code: ARTIFACT_ERRORS.TYPE_MISMATCH,
              path: childPath,
              message: `Expected file, but found a directory.`
            });
          } else {
            // Extract content robustly: handle wrapped object or direct string
            const content = actual.content ?? actual;

            // Content Validation (if required and registry exists)
            if (expected.contentValidator && this.contentValidatorRegistry) {
              const validator = this.contentValidatorRegistry.getValidator(expected.contentValidator);
              if (validator) {
                try {
                  const validationResult = await validator.validate(content, expected.validationConfig);

                  if (!validationResult.success) {
                    errors.push({
                      code: ARTIFACT_ERRORS.CONTENT_VALIDATION_FAILED,
                      path: childPath,
                      message: `Content validation failed using '${expected.contentValidator}': ${validationResult.details.join('; ')}`
                    });
                  }
                } catch (e) {
                   errors.push({
                      code: ARTIFACT_ERRORS.CONTENT_VALIDATION_FAILED,
                      path: childPath,
                      message: `Content validator '${expected.contentValidator}' threw an exception: ${e.message}`
                    });
                }
              }
            }
          }
        }
      }
    }

    // 2. Check for unexpected entries (Strict Mode)
    if (strictMode) {
      for (const key of Object.keys(actualNode)) {
        // Only report keys that were not expected structurally
        if (!structuralKeys.includes(key) && key !== '$config') { // Safety check against $config usage in actual structure
          const actualEntry = actualNode[key];
          const isActualDirectory = typeof actualEntry === 'object' && actualEntry !== null && !('content' in actualEntry);
          const unexpectedPath = this._buildPath(currentPath, key, isActualDirectory);

          errors.push({
            code: ARTIFACT_ERRORS.UNEXPECTED_ENTRY,
            path: unexpectedPath,
            message: `Unexpected entry found in strict directory: ${key}`
          });
        }
      }
    }
  }
}

ArtifactValidator.ARTIFACT_ERRORS = ARTIFACT_ERRORS;

module.exports = ArtifactValidator;