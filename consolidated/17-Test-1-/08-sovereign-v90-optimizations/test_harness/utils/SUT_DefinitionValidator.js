declare const StructuralKeyValidatorTool: {
    validate: (payload: any, requiredKeys: string[]) => { success: boolean; missingKeys: string[] };
};

/**
 * SUT_DefinitionValidator.js
 * Ensures consistency between test configurations and the formal GSEP.L3.SUT_Definition.
 */

class SUT_DefinitionValidator {
    private definition: any;
    // Assuming the structural validation tool is globally accessible or injected.
    private validator = StructuralKeyValidatorTool;

    constructor(definition: any) {
        this.definition = definition;
    }

    /**
     * Validates the essential top-level structure using the StructuralKeyValidatorTool.
     * @throws {Error} if required keys are missing.
     */
    validateStructure(): boolean {
        const requiredKeys = ['metadata', 'systemInfo', 'constraints', 'dataStructures'];
        
        const result = this.validator.validate(this.definition, requiredKeys);

        if (!result.success) {
            throw new Error(`Structural validation failed for SUT Definition. Missing required keys: ${result.missingKeys.join(', ')}`);
        }
        return true;
    }

    validateConstraints(): boolean {
        // Checks if all constraints in OperationalLimits have min/max bounds defined if type is 'physical'.
        // This complex constraint validation should ideally use a DeclarativeConstraintValidator tool.
        // (Implementation details omitted for brevity)
        return true;
    }

    // Method stub to validate input test cases against defined OperationalLimits
    validateTestCaseInput(testCaseInput: any): boolean {
        // Implementation needed to iterate over input and check compliance.
        // return this.definition.constraints.OperationalLimits.check(testCaseInput)
        return true;
    }
}

export = SUT_DefinitionValidator;