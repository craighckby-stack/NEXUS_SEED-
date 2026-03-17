import { 
    GAXConstraintSet, 
    TxContext, 
    ConstraintViolation
} from './types';
import { IKernel } from '../../interfaces/IKernel';
import { ILoggerToolKernel } from '../../tools/ILoggerToolKernel';
import { IGAXConstraintSetConfigRegistryKernel } from './IGAXConstraintSetConfigRegistryKernel';
import { ILimitCheckAndViolationToolKernel } from '../../tools/ILimitCheckAndViolationToolKernel';

/**
 * Manages, validates, and enforces all system constraints (GAX).
 * Decouples constraint logic from transaction execution flow and provides generalization for checking limits.
 */
export class ConstraintEnforcerKernel implements IKernel {
    // --- Dependencies ---
    private readonly gaxConfigRegistry: IGAXConstraintSetConfigRegistryKernel;
    private readonly logger: ILoggerToolKernel;
    private readonly limitChecker: ILimitCheckAndViolationToolKernel;
    
    // Internal state storage (set during initialize)
    private constraints: GAXConstraintSet;
    private isInitialized: boolean = false;

    constructor(dependencies: {
        gaxConfigRegistry: IGAXConstraintSetConfigRegistryKernel;
        logger: ILoggerToolKernel;
        limitChecker: ILimitCheckAndViolationToolKernel;
    }) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Isolates dependency assignment and validation, satisfying the synchronous setup extraction mandate.
     */
    #setupDependencies(dependencies: any): void {
        if (!dependencies.gaxConfigRegistry) {
            throw new Error("ConstraintEnforcerKernel: Dependency 'gaxConfigRegistry' is required.");
        }
        if (!dependencies.logger) {
            throw new Error("ConstraintEnforcerKernel: Dependency 'logger' is required.");
        }
        if (!dependencies.limitChecker) {
            throw new Error("ConstraintEnforcerKernel: Dependency 'limitChecker' is required.");
        }
        this.gaxConfigRegistry = dependencies.gaxConfigRegistry;
        this.logger = dependencies.logger;
        this.limitChecker = dependencies.limitChecker;
    }

    /**
     * Loads the validated constraint configuration from the registry and initializes internal state.
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        // Ensure the configuration registry is ready (which handles I/O and validation upstream)
        if (!this.gaxConfigRegistry.isInitialized()) {
            await this.gaxConfigRegistry.initialize();
        }
        
        // Retrieve the canonical, validated, and immutable constraints structure.
        this.constraints = this.gaxConfigRegistry.getConstraints();
        
        this.logger.info(`GAX Constraint Enforcer initialized (v${this.constraints.schema_version}). Constraints loaded from Registry.`);
        this.isInitialized = true;
    }

    /** 
     * Runs the transaction context through all configured constraints. 
     *
     * @param txContext The standardized transaction context object containing runtime execution metadata.
     * @returns An array of structured ConstraintViolation objects, or null if compliant.
     */
    public checkTransaction(txContext: TxContext): ConstraintViolation[] | null {
        if (!this.isInitialized) {
            throw new Error("ConstraintEnforcerKernel not initialized. Call initialize() first.");
        }

        const violations: ConstraintViolation[] = [];

        // Phase 1: Global Execution Limits (Gas, Size, Memory, etc.)
        violations.push(...this._checkGlobalExecutionLimits(txContext));

        // Phase 2: System Integrity/Protocol Specific Limits 

        return violations.length > 0 ? violations : null;
    }

    /** Retrieves the state of a system governance feature toggle. */
    public getToggle(feature: keyof GAXConstraintSet['system_governance_toggles']): boolean {
        if (!this.isInitialized) {
            throw new Error("ConstraintEnforcerKernel not initialized. Call initialize() first.");
        }
        return this.constraints.system_governance_toggles[feature];
    }

    /**
     * Handles all constraints defined under the 'global_execution_limits' section.
     * Delegates limit checking and violation object generation to the dedicated tool kernel.
     * @private
     */
    private _checkGlobalExecutionLimits(txContext: TxContext): ConstraintViolation[] {
        const violations: ConstraintViolation[] = [];
        const limits = this.constraints.global_execution_limits;

        // Check 1: Max Gas Units
        const gasUsed = txContext.resources?.gas || 0;
        
        const gasViolation = this.limitChecker.execute({
            contextValue: gasUsed,
            limitConfig: limits.max_gas_units_per_tx,
            constraintName: 'MAX_GAS_UNITS',
            messageGenerator: (used, limit) => `Tx exceeded max gas limit: ${limit}. Used: ${used}.`
        });
        
        if (gasViolation) violations.push(gasViolation);

        // Check 2: Max Payload Size
        const payloadSize = txContext.payload_size || 0;
        
        const sizeViolation = this.limitChecker.execute({
            contextValue: payloadSize,
            limitConfig: limits.max_payload_bytes,
            constraintName: 'MAX_PAYLOAD_SIZE',
            messageGenerator: (size, limit) => `Tx payload size (${size}B) exceeded limit: ${limit}B.`
        });
        
        if (sizeViolation) violations.push(sizeViolation);

        return violations;
    }
}