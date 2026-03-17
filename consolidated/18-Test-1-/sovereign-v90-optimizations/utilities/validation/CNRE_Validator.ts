import CNRE_V1_Schema from '../../components/types/CNRE_Envelope_V1.json';

// Assume injection/access via Global Kernel context or dependency injection for plugins
declare const plugins: {
    DeclarativeSchemaValidationUtility: {
        execute: (args: { schema: object, data: any }) => { isValid: boolean, errors: any[] | null };
    };
};

/**
 * CNRE_Validator: Enforces structural compliance for all Cognitive Network Response Envelopes.
 */
export class CNRE_Validator {
  private static V1_SCHEMA = CNRE_V1_Schema;

  /**
   * Validates an incoming object against the CNRE V1 specification using the validation utility.
   * @param data The object to validate.
   * @returns boolean true if valid, throws error if invalid.
   */
  public static validateV1(data: any): boolean {
    // Check for plugin availability (simulated access)
    if (typeof plugins === 'undefined' || !plugins.DeclarativeSchemaValidationUtility) {
        throw new Error("DeclarativeSchemaValidationUtility plugin is not available.");
    }
    
    const validator = plugins.DeclarativeSchemaValidationUtility;

    const validationResult = validator.execute({
        schema: CNRE_Validator.V1_SCHEMA,
        data: data
    });
    
    if (!validationResult.isValid) {
      // Use the errors provided by the utility
      const errorDetails = validationResult.errors ? JSON.stringify(validationResult.errors) : 'No specific errors reported.';
      throw new Error(`CNRE V1 Validation Failed. Errors: ${errorDetails}`);
    }
    return true;
  }

  // Future methods for V2, V3 migration checks, etc.
}