/**
 * AGI-KERNEL Schema Validator Proxy Kernel
 * Delegates high-integrity schema compilation and validation tasks 
 * to the specialized ISpecValidatorKernel.
 * 
 * Adheres to AIA Enforcement Layer mandates:
 * 1. Asynchronous initialization via initialize().
 * 2. Explicit dependency injection.
 * 3. Maximum Recursive Abstraction (MRA) by delegating core logic.
 */
class SchemaValidatorKernel {
    /**
     * @param {object} tools 
     * @param {ISpecValidatorKernel} tools.iSpecValidatorKernel
     */
    constructor({ iSpecValidatorKernel }) {
        // High-integrity check: Ensure the dependency exists and exposes required methods.
        if (!iSpecValidatorKernel || 
            typeof iSpecValidatorKernel.compile !== 'function' ||
            typeof iSpecValidatorKernel.validate !== 'function') {
            throw new Error("[SchemaValidatorKernel] Initialization failure: ISpecValidatorKernel dependency is missing or incomplete (missing compile/validate methods).");
        }
        /** @type {ISpecValidatorKernel} */
        this.specValidator = iSpecValidatorKernel;
    }

    /**
     * Initializes the kernel and ensures dependencies are ready.
     * This method is mandatory for AIA compliance.
     * It chains initialization to the underlying specialized kernel.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Ensure the underlying specialized kernel is initialized and ready, if it exposes an initialize method.
        if (typeof this.specValidator.initialize === 'function') {
            await this.specValidator.initialize();
        }
    }

    /**
     * Compiles a JSON Schema into a reusable, high-performance validation function.
     * Delegates to the ISpecValidatorKernel.
     * 
     * NOTE: This proxy maintains a synchronous facade for high-performance usage 
     * post-initialization, relying on the underlying kernel's optimized runtime path.
     * 
     * @param {object} schema - The JSON Schema definition.
     * @returns {Function} The compiled validation function.
     * @throws {Error} If schema compilation fails.
     */
    compile(schema) {
        // Delegate compilation to the specialized tool kernel.
        return this.specValidator.compile(schema);
    }

    /**
     * Helper method to directly validate data against a raw schema.
     * Delegates to the ISpecValidatorKernel.
     * 
     * @param {object} schema - The JSON Schema definition.
     * @param {any} data - The data to validate.
     * @returns {{isValid: boolean, errors: Array<object>}} Validation result object.
     */
    validate(schema, data) {
        // Delegate direct validation to the specialized tool kernel.
        return this.specValidator.validate(schema, data);
    }
}

module.exports = SchemaValidatorKernel;