const PRECONDITION_SETUP_ERROR_PREFIX = "[DCM Precondition Validator Setup]";

// Standardized type for the external executor utility
interface IPreconditionExecutorUtility {
    execute(context: { preconditions: any, checkLibrary: { [key: string]: Function }, stateFeed: SystemStateFeed }): Promise<{ success: boolean, failure_reasons: string[] }>;
}

export class DCM_Precondition_Validator {
    private #checkLibrary: { [key: string]: Function };
    private #systemStateFeed: SystemStateFeed; 
    private #executorUtility: IPreconditionExecutorUtility | undefined; 

    /**
     * @param systemStateFeed An object implementing SystemStateFeed interface to query current state.
     */
    constructor(systemStateFeed: SystemStateFeed) {
        if (!systemStateFeed) {
            throw new Error(`${PRECONDITION_SETUP_ERROR_PREFIX} Must provide a SystemStateFeed instance.`);
        }
        this.#systemStateFeed = systemStateFeed; 

        // Resolve external utility dependency once upon initialization
        this.#executorUtility = this.#getValidatedExecutorUtility();

        // Load atomic check functions
        this.#checkLibrary = this.#loadAtomicChecks(); 
    }

    /**
     * Executes all required checks and validates system state context for a given action.
     * Delegates execution to the PreconditionExecutorUtility plugin.
     * @param preconditions The 'preconditions' object from the Action Registry.
     * @returns {success: boolean, failure_reasons: string[]}
     */
    public async validate(preconditions: any): Promise<{success: boolean, failure_reasons: string[]}> {
        
        const executor = this.#executorUtility;

        if (executor) {
            return executor.execute({
                preconditions: preconditions,
                checkLibrary: this.#checkLibrary,
                stateFeed: this.#systemStateFeed
            });
        } else {
            // Error reporting if tool is missing or invalid
            return { 
                success: false, 
                failure_reasons: [`${PRECONDITION_SETUP_ERROR_PREFIX} Precondition validation service unavailable (PreconditionExecutorUtility missing or invalid).`] 
            };
        }
    }
    
    /**
     * Resolves the external PreconditionExecutorUtility and validates its contract.
     */
    private #getValidatedExecutorUtility(): IPreconditionExecutorUtility | undefined {
        const utility = globalThis.PreconditionExecutorUtility as IPreconditionExecutorUtility | undefined;
        if (utility && typeof utility.execute === 'function') {
            return utility;
        }
        return undefined;
    }

    /**
     * Resolves system dependencies (like OS) and calculates necessary context parameters.
     */
    private #getSystemCheckContext(): { os: any, cpuCount: number } {
        // Resolve OS dependency once during check loading
        const os = globalThis.os || { 
            loadavg: () => [0, 0, 0], 
            cpus: () => [{}] 
        };
        // Determine CPU count, defaulting to 1 to prevent division by zero
        const cpuCount = os.cpus().length || 1; 
        return { os, cpuCount };
    }

    /**
     * Loads the defined atomic checks into a dictionary map.
     */
    private #loadAtomicChecks(): { [key: string]: Function } {
        const { os, cpuCount } = this.#getSystemCheckContext();

        // Returns an immutable map of standard checks
        return Object.freeze({
            'INPUT_STABILITY_CHECK': async () => true, 
            // Checks system load average against CPU count (75% threshold).
            'SYSTEM_LOAD_BELOW_75_PERCENT': async () => (os.loadavg()[0] / cpuCount) < 0.75 
        });
    }
}

// Placeholder Interface for compilation context
interface SystemStateFeed {
    getCurrent(key: string): any;
}