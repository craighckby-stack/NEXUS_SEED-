import { IHighPerformanceSchemaCompiler } from "./plugins/HighPerformanceSchemaCompiler";

/**
 * Manages policy schema validation using a highly optimized, memoized compiler.
 * This ensures that policy schemas are compiled once and reused across multiple validation runs.
 */
export class PolicySchemaValidator {
    private schemaCompiler: IHighPerformanceSchemaCompiler;

    constructor(compiler: IHighPerformanceSchemaCompiler) {
        this.schemaCompiler = compiler;
    }

    /**
     * Validates a policy payload against its expected schema.
     * @param policySchema The schema definition.
     * @param policyData The data payload to validate.
     * @returns A validation result object.
     */
    public async validate(policySchema: object, policyData: object): Promise<{ isValid: boolean, errors: string[] }> {
        // Leverage the memoized compiler for high efficiency
        const result = this.schemaCompiler.execute({
            schema: policySchema,
            data: policyData
        });

        // Additional recursive abstraction or parallel processing logic could be inserted here
        // based on the specific policy structure, but the core validation is delegated.

        return result;
    }

    /**
     * Utility to check schema compilation status for debugging/pre-flight checks.
     * @param policySchema The schema definition.
     * @returns boolean indicating if the schema is cached (simulated check).
     */
    public checkCacheStatus(policySchema: object): boolean {
        // Since the compiler handles internal caching, we might expose a status check if necessary
        // For simplicity, assume the plugin's execution handles the check implicitly.
        return true; // Simplified for demonstration
    }
}