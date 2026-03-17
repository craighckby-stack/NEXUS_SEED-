// NOTE: Assuming EnforcementResult and RecourseAction types are imported or globally standardized.
// For self-contained demonstration, defining required structure:
export type RecourseAction = "HALT_AND_QUARANTINE" | "ABORT_INFERENCE_PATH" | "LOG_VETO_PROPAGATE";
export interface ViolationDetails { constraintId: string; [key: string]: any; }
export interface EnforcementResult {
    passed: boolean;
    action?: RecourseAction;
    violationDetails?: ViolationDetails;
}

// NOTE: ILoggerToolKernel assumed to be available
interface ILoggerToolKernel {
    error(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    info(message: string, ...meta: any[]): void;
}

// Strategic abstractions for operational control and audit dispatch
interface ISystemControlToolKernel {
    initiateCriticalShutdown(reason: string, details: any): Promise<void>;
    signalContextAbort(contextId: string, details: any): Promise<void>; 
}
interface IAuditDispatcherToolKernel {
    dispatchVeto(details: ViolationDetails): Promise<void>;
}


/**
 * RecourseActuatorKernel: Responsible for executing the physical/operational 
 * system response mandated by a Constraint Enforcement violation (RecourseAction).
 * Decouples system operational responses from pure enforcement logic using 
 * injected strategic kernels.
 */
export class RecourseActuatorKernel {

    private readonly logger: ILoggerToolKernel;
    private readonly systemControl: ISystemControlToolKernel;
    private readonly auditDispatcher: IAuditDispatcherToolKernel;

    constructor(
        logger: ILoggerToolKernel,
        systemControl: ISystemControlToolKernel,
        auditDispatcher: IAuditDispatcherToolKernel
    ) {
        this.logger = logger;
        this.systemControl = systemControl;
        this.auditDispatcher = auditDispatcher;
        this.#setupDependencies();
    }

    private #setupDependencies(): void {
        // Enforce strict dependency presence during synchronous construction
        if (!this.logger || !this.systemControl || !this.auditDispatcher) {
            throw new Error("RecourseActuatorKernel failed dependency injection setup: Missing required kernels.");
        }
    }

    public async initialize(): Promise<void> {
        // Mandatory asynchronous initialization step
        this.logger.info("[RecourseActuatorKernel] Initializing operational readiness.");
    }

    private async executeHaltAndQuarantine(details: ViolationDetails): Promise<void> {
        const constraintId = details.constraintId;
        
        this.logger.error(
            `!!! L0 KERNEL VIOLATION DETECTED !!! Initiating HALT AND QUARANTINE sequence for constraint: ${constraintId}.`
        );
        
        // Delegate critical system operation to the dedicated tool kernel
        await this.systemControl.initiateCriticalShutdown(
            `Governance Violation: ${constraintId}`, 
            details
        );
        
        this.logger.error(`[REC_ACTUATOR] Critical shutdown signaled via SystemControlTool.`);
    }

    private async executeAbortInferencePath(details: ViolationDetails): Promise<void> {
        const constraintId = details.constraintId;
        
        this.logger.warn(
            `L1/L2 Constraint violation. Signaling context abortion for constraint: ${constraintId}.`
        );
        
        // Delegate graceful execution path termination
        await this.systemControl.signalContextAbort(constraintId, details); 
        
        this.logger.info(`[REC_ACTUATOR] Upstream task abortion signal dispatched. Constraint ID: ${constraintId}.`);
    }

    private async executeLogVetoPropagate(details: ViolationDetails): Promise<void> {
        const constraintId = details.constraintId;

        this.logger.info(
            `Minor L2 Constraint violation. Logging VETO signal and allowing continuation. Constraint ID: ${constraintId}.`
        );
        
        // Delegate high-integrity logging and propagation to Audit Dispatcher
        await this.auditDispatcher.dispatchVeto(details);
        
        this.logger.info(`[REC_ACTUATOR] VETO propagation completed.`);
    }

    /**
     * Executes the mandated recourse action based on the enforcement result.
     * @param result The detailed result from the ConstraintEnforcementEngine.
     */
    public async enactRecourse(result: EnforcementResult): Promise<void> {
        if (result.passed || !result.action || !result.violationDetails) {
            return;
        }

        const action: RecourseAction = result.action;
        const details = result.violationDetails;
        
        const constraintId = details.constraintId || 'UNKNOWN';

        this.logger.info(`[RecourseActuatorKernel] Attempting execution of: ${action} (Constraint: ${constraintId})`);

        try {
            switch (action) {
                case "HALT_AND_QUARANTINE":
                    await this.executeHaltAndQuarantine(details);
                    break;
                case "ABORT_INFERENCE_PATH":
                    await this.executeAbortInferencePath(details);
                    break;
                case "LOG_VETO_PROPAGATE":
                    await this.executeLogVetoPropagate(details);
                    break;
                default:
                    this.logger.error(`[REC_ACTUATOR] Unknown recourse action encountered: ${action}`);
            }
        } catch (error) {
            // CRITICAL: Failure of the actuator must be logged, as the system is now operating 
            // under a violation without the mandated safety response being fully executed.
            this.logger.error(
                `[REC_ACTUATOR] CRITICAL FAILURE: Action execution failed for ${action} (Constraint: ${constraintId}).`,
                error
            );
        }
    }
}