/**
 * GovernanceStateTrackerKernel (GST)
 * Monitors and records the current phase, active ruleset execution, and decision lifecycle against the RCDM config.
 */

class GovernanceStateTrackerKernel {
    private readonly logger: ILoggerToolKernel;
    private readonly rcdmConfigRegistry: IRCDMConfigRegistryKernel;
    private readonly rcdmValidator: IRCDMPhaseTransitionValidatorToolKernel; // Formalized validator interface

    private currentState: {
        phase: string;
        ruleset: string | null;
        active_proposals: Record<string, any>;
        metrics_cache: Record<string, any>;
    };
    private rcdmConfiguration: Record<string, any> = {}; // Cache for asynchronously loaded config

    constructor(
        dependencies: {
            logger: ILoggerToolKernel;
            rcdmConfigRegistry: IRCDMConfigRegistryKernel;
            rcdmValidator: IRCDMPhaseTransitionValidatorToolKernel;
        }
    ) {
        this.currentState = {
            phase: 'initialization',
            ruleset: null,
            active_proposals: {},
            metrics_cache: {}
        };
        this.#setupDependencies(dependencies);
    }

    #setupDependencies(dependencies: any): void {
        if (!dependencies.logger || !dependencies.rcdmConfigRegistry || !dependencies.rcdmValidator) {
            throw new Error("GovernanceStateTrackerKernel requires logger, RCDM config registry, and validator.");
        }
        // NOTE: ILoggerToolKernel is assumed available as a ubiquitous dependency.
        this.logger = dependencies.logger;
        this.rcdmConfigRegistry = dependencies.rcdmConfigRegistry;
        this.rcdmValidator = dependencies.rcdmValidator;
    }

    /**
     * Asynchronously loads necessary configurations and initializes dependencies.
     */
    async initialize(): Promise<void> {
        // 1. Asynchronously load the configuration data, eliminating synchronous RCDM.json import.
        try {
            this.rcdmConfiguration = await this.rcdmConfigRegistry.getRCDMConfig();
            this.logger.info("GovernanceStateTrackerKernel initialized. RCDM Configuration loaded.");
        } catch (error) {
            this.logger.error(`Failed to load RCDM Configuration during initialization: ${error.message}`);
            throw new Error("Initialization failed due to RCDM configuration load error.");
        }
        // Optional: Initialize the validator if needed (e.g., if it has internal caching).
        // await this.rcdmValidator.initialize();
    }

    async updatePhase(newPhaseId: string): Promise<boolean> {
        if (Object.keys(this.rcdmConfiguration).length === 0) {
             this.logger.warn("RCDM configuration not loaded or available. Cannot perform phase transition.");
             return false;
        }

        // Delegate configuration lookup and validation to the injected tool
        const validationResult = this.rcdmValidator.execute({
            rcdmConfig: this.rcdmConfiguration, 
            newPhaseId: newPhaseId
        });
        
        if (validationResult.success && validationResult.rulesetId) {
            this.currentState.phase = newPhaseId;
            this.currentState.ruleset = validationResult.rulesetId;
            this.logger.log(`Transitioned to Phase: ${newPhaseId}. Ruleset: ${validationResult.rulesetId}`);
            return true;
        }
        
        this.logger.error(`Failed to transition phase to '${newPhaseId}'. Error: ${validationResult.error || 'Unknown validation failure.'}`);
        return false;
    }

    async recordProposalVote(proposalId: string, actorId: string, score: number): Promise<void> {
        // Logic to track individual actor scores and apply ruleset weighting (from RCDM) to calculate consensus.
        // If consensus is met, trigger dynamic_transition check.
        this.logger.debug(`Recording vote for proposal ${proposalId} from ${actorId}.`);
    }

    async checkTransitionCriteria(): Promise<void> {
        // Checks if current metrics satisfy the required exit/dynamic criteria defined in the active RCDM phase.
        this.logger.debug("Checking transition criteria...");
    }

    getState() {
        return this.currentState;
    }
}

export default GovernanceStateTrackerKernel;