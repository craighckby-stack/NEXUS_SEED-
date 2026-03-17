/*
 * Module: Configuration Hash Registry (CHR) Verifier
 * Function: Provides synchronous methods for C-ICR validation, refactored for architectural separation.
 */

// NOTE: External AGI-KERNEL tools (SynchronousFileIntegrityCheckerTool, SynchronousIntegrityChecker) 
// are expected to be ambiently available or resolved at runtime via specialized proxies.

class CHRVerifierImpl {
    #baselinePath;
    #baseline;

    // Static dependencies resolved synchronously during initialization
    static #fs = null;

    constructor(baselinePath = 'integrity/baseline_chr.json') {
        CHRVerifierImpl.#setupDependencies();
        this.#baselinePath = baselinePath;
        this.#baseline = this.#loadBaselineInternal();
    }

    /**
     * Goal: Extracts synchronous dependency resolution and setup logic.
     */
    static #setupDependencies() {
        if (CHRVerifierImpl.#fs === null) {
            // Resolve 'fs' dependency immediately upon first instantiation
            CHRVerifierImpl.#fs = CHRVerifierImpl.#resolveDependency('fs');
        }
    }

    // --- I/O Proxy: Dependency Resolution ---

    /**
     * Isolates synchronous dependency lookup (e.g., require).
     */
    static #resolveDependency(moduleName) {
        try {
            // AGI-KERNEL dependency lookup mechanism
            return require(moduleName);
        } catch (e) {
            CHRVerifierImpl.#throwDependencyError(`Required module '${moduleName}' is unavailable.`, e);
        }
    }

    /**
     * Isolates checking and accessing the ambient SynchronousFileIntegrityCheckerTool.
     */
    #resolveFileIntegrityTool() {
        if (typeof SynchronousFileIntegrityCheckerTool === 'undefined' || typeof SynchronousFileIntegrityCheckerTool.execute !== 'function') {
             CHRVerifierImpl.#throwDependencyError("SynchronousFileIntegrityCheckerTool is not available.");
        }
        return SynchronousFileIntegrityCheckerTool;
    }
    
    /**
     * Isolates checking and accessing the ambient SynchronousIntegrityChecker plugin.
     */
    #resolveIntegrityCheckerTool() {
        if (typeof SynchronousIntegrityChecker === 'undefined' || typeof SynchronousIntegrityChecker.execute !== 'function') {
             this.#throwRefactoringError("SynchronousIntegrityChecker");
        }
        return SynchronousIntegrityChecker;
    }

    // --- I/O Proxy: Error Handling ---
    
    static #throwDependencyError(message, innerError = null) {
        throw new Error(`Dependency Error: ${message}` + (innerError ? ` (${innerError.message})` : ''));
    }

    #throwInitializationError(message, innerError) {
        throw new Error(`CHR Initialization Failure: ${message}. ${innerError.message}`);
    }

    #throwIntegrityExecutionError(filePath, innerError) {
        throw new Error(`File hashing failed using tool for path ${filePath}: ${innerError.message}`);
    }
    
    #throwRefactoringError(toolName) {
         throw new Error(`Refactoring Error: ${toolName} plugin is not available.`);
    }

    // --- I/O Proxy: Baseline Loading (FS & JSON) ---

    /**
     * Isolates synchronous file system read operations.
     */
    #delegateToFSSyncRead(path) {
        try {
            return CHRVerifierImpl.#fs.readFileSync(path, 'utf8');
        } catch (e) {
            this.#throwInitializationError(`Could not read baseline registry file at ${path}`, e);
        }
    }

    /**
     * Isolates JSON parsing operations.
     */
    #delegateToJSONParse(data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            this.#throwInitializationError('Failed to parse baseline registry JSON', e);
        }
    }

    #loadBaselineInternal() {
        const data = this.#delegateToFSSyncRead(this.#baselinePath);
        return this.#delegateToJSONParse(data);
    }

    // --- I/O Proxy: External Tool Execution ---

    /**
     * Isolates execution of the SynchronousFileIntegrityCheckerTool.
     */
    #delegateToFileIntegrityExecution(filePath, algorithm) {
        const tool = this.#resolveFileIntegrityTool();
        try {
            return tool.execute({
                filePath: filePath,
                algorithm: algorithm
            });
        } catch (e) {
            this.#throwIntegrityExecutionError(filePath, e);
        }
    }

    /**
     * Internal logic helper for hash calculation, leveraging the I/O proxy.
     */
    #synchronousHashCalculator(filePath) {
        // Uses the baseline algorithm stored in the private field
        return this.#delegateToFileIntegrityExecution(filePath, this.#baseline.integrity_algorithm);
    }

    /**
     * Isolates delegation to the SynchronousIntegrityChecker plugin execution.
     */
    #delegateToValidationDelegation() {
        const tool = this.#resolveIntegrityCheckerTool();
        
        // Delegate the core validation loop to the generic plugin
        return tool.execute(
            this.#baseline,
            (filePath) => this.#synchronousHashCalculator(filePath)
        );
    }

    // --- Public API ---

    async runValidation() {
        return this.#delegateToValidationDelegation();
    }
}

module.exports = CHRVerifierImpl;