import { AbstractKernel } from '@core/AbstractKernel';

// Constants defining lifecycle stages
const LIFECYCLE_STATES = {
    INIT: 'INIT',
    STARTING: 'STARTING',
    RUNNING: 'RUNNING',
    DEPRECATION_STAGING: 'DEPRECATION_STAGING',
    RETIREMENT_PREP: 'RETIREMENT_PREP',
    RETIRED: 'RETIRED',
    ERROR: 'ERROR'
};

/**
 * Manages the transition and execution flow for a component's lifecycle.
 * Utilizes high-integrity tool kernels for dependency resolution, policy enforcement,
 * and staged, asynchronous execution of critical, non-reversible operations.
 */
class ComponentLifecycleActuatorKernel extends AbstractKernel {
    static dependencies = [
        'ILoggerToolKernel',
        'IServiceResolutionToolKernel', 
        'IConceptualPolicyEvaluatorKernel', 
        'IExecutionStageOrchestratorToolKernel'
    ];

    private componentId: string;
    private currentState: string;
    private logger: ILoggerToolKernel;
    private serviceResolver: IServiceResolutionToolKernel;
    private policyEvaluator: IConceptualPolicyEvaluatorKernel;
    private stageOrchestrator: IExecutionStageOrchestratorToolKernel;

    constructor(
        componentId: string,
        dependencies
    ) {
        super();
        this.componentId = componentId;
        this.currentState = LIFECYCLE_STATES.INIT;
        // Dependency assignment handled via injection
        Object.assign(this, dependencies);
    }

    #setupDependencies(): void {
        if (!this.logger || !this.serviceResolver || !this.policyEvaluator || !this.stageOrchestrator) {
            throw new Error(`${this.constructor.name}: Missing required kernel dependencies.`);
        }
    }

    async initialize(): Promise<void> {
        this.#setupDependencies();
        this.logger.debug(`${this.constructor.name} initialized for component: ${this.componentId}`);
    }

    /**
     * Attempts a state transition, managing asynchronous stages.
     * Handles non-reversible system modifications (Deprecation/Retirement).
     * @param targetState The state to transition to.
     */
    public async transitionTo(targetState: string): Promise<void> {
        this.logger.info({
            message: `Transitioning component lifecycle stage.`,
            componentId: this.componentId,
            fromState: this.currentState,
            toState: targetState
        });

        if (this.currentState === LIFECYCLE_STATES.RETIRED) {
            this.logger.warn(`Attempted transition on retired component: ${this.componentId}`);
            throw new Error(`Component ${this.componentId} is retired and cannot transition.`);
        }

        const previousState = this.currentState;
        
        try {
            switch (targetState) {
                case LIFECYCLE_STATES.STARTING:
                    await this._executeStartingStage();
                    this.currentState = LIFECYCLE_STATES.RUNNING;
                    break;

                case LIFECYCLE_STATES.DEPRECATION_STAGING:
                    // Step 1: Governance check for non-reversible action
                    await this._verifyDeprecationPolicy();
                    // Step 2: Execute stages
                    await this._executeDeprecationStage();
                    this.currentState = LIFECYCLE_STATES.DEPRECATION_STAGING;
                    break;

                case LIFECYCLE_STATES.RETIRED:
                    // Critical non-reversible action execution
                    await this._executeRetirementStage();
                    this.currentState = LIFECYCLE_STATES.RETIRED;
                    break;
                
                default:
                    throw new Error(`Unknown or invalid target state: ${targetState}`);
            }
            this.logger.info({
                message: `Transition complete.`,
                componentId: this.componentId,
                newState: this.currentState
            });

        } catch (e) {
            this.currentState = LIFECYCLE_STATES.ERROR;
            this.logger.error({
                message: `Lifecycle transition failed (reverting to ERROR state).`,
                componentId: this.componentId,
                revertedFrom: previousState,
                error: e.message
            });
            throw e;
        }
    }

    private async _verifyDeprecationPolicy(): Promise<void> {
        // Use IConceptualPolicyEvaluatorKernel for high-integrity governance checks
        const policyContext = { componentId: this.componentId, action: 'DEPRECATION' };
        
        // The policy evaluation must handle the specific context
        const compliance = await this.policyEvaluator.evaluate('STAGED_DEPRECATION_MANDATE', policyContext); 
        
        if (!compliance || !compliance.isCompliant) {
            // VETO logging for non-reversible governance failure
            this.logger.veto({
                message: "Mandated policy violation detected for staged deprecation.",
                componentId: this.componentId,
                policyId: 'STAGED_DEPRECATION_MANDATE'
            });
            throw new Error("Mandated policy violation detected for staged deprecation. VETO initiated.");
        }
        this.logger.debug(`Deprecation policy check passed for ${this.componentId}.`);
    }

    /**
     * Executes the sequence required to bring the component online.
     */
    private async _executeStartingStage(): Promise<void> {
        // Use service resolver to get required component interfaces
        const initializer = await this.serviceResolver.resolve('ComponentInitializer');

        await this.stageOrchestrator.executeSequence(`Startup_${this.componentId}`, [
            { name: 'LoadConfiguration', task: async () => { /* load config logic */ } },
            { name: 'InitializeDependencies', task: async () => { /* init dependencies logic */ } },
            // Assumes initializer is a service with a callable runSetup method
            { name: 'RunSetupHooks', task: () => initializer.runSetup(this.componentId) }
        ]);
    }

    /**
     * Executes the sequence for staged deprecation (non-reversible soft stop).
     */
    private async _executeDeprecationStage(): Promise<void> {
        const retirementService = await this.serviceResolver.resolve('RetirementService');

        await this.stageOrchestrator.executeSequence(`Deprecation_${this.componentId}`, [
            { name: 'HaltIngress', task: async () => { /* stop new requests */ } },
            { name: 'DrainQueues', task: async () => { /* gracefully handle existing tasks */ } },
            { name: 'NotifyConsumers', task: () => retirementService.stageDeprecation(this.componentId) }
        ]);
    }

    /**
     * Executes the sequence for final retirement (non-reversible hard stop/cleanup).
     */
    private async _executeRetirementStage(): Promise<void> {
        const dbCleaner = await this.serviceResolver.resolve('DatabaseCleaner');
        const assetManager = await this.serviceResolver.resolve('AssetDecommissioner');

        await this.stageOrchestrator.executeSequence(`Retirement_${this.componentId}`, [
            { name: 'ShutdownProcesses', task: async () => { /* force shutdown remaining instances */ } },
            { name: 'DecommissionAssets', task: () => assetManager.decommission(this.componentId) },
            { name: 'DatabaseCleanup', task: () => dbCleaner.removeRecords(this.componentId) }
        ]);
    }
}

export { ComponentLifecycleActuatorKernel, LIFECYCLE_STATES };