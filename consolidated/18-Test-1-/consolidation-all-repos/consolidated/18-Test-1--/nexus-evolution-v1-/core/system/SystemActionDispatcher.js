/*
 * System Action Dispatcher (SAD)
 * Objective: Execute mandated actions resulting from Policy Compliance violations or high-level system directives.
 * Role: Interface between the Governance Plane (PCE) and the Execution Plane. Handles logging, auditing, and sequencing of complex actions.
 */

// --- Interfaces and Mock Implementations (External Dependencies) ---

interface IExecutionPlane { enforceIsolation: (id: string) => any; }
interface ISystemManager { executeSecureTermination: (score: number) => any; }
interface IResourceAllocator { adjustCapacity: (delta: number) => any; }
interface IAuditService { recordPolicyViolation: (code: string, details: any) => any; }
interface IMandatedActionExecutionTool {
    register: (code: string, executor: (details: any) => any) => boolean;
    execute: (args: { actionCode: string, details: any }) => { success: boolean, result?: any, error?: string };
}

// Mock implementations of external services
const executionPlane: IExecutionPlane = { enforceIsolation: (id: string) => console.log(`[EXEC] Enforcing isolation on ${id}`) };
const systemManager: ISystemManager = { executeSecureTermination: (score: number) => console.log(`[EXEC] Initiating secure termination (Score: ${score})`) };
const resourceAllocator: IResourceAllocator = { adjustCapacity: (delta: number) => console.log(`[EXEC] Adjusting capacity by ${delta}`) };
const AuditService: IAuditService = { recordPolicyViolation: (code: string, details: any) => console.log(`[AUDIT] Violation recorded: ${code}`) };

// Assume global accessor for the plugin (MandatedActionExecutionTool)
declare var MandatedActionExecutionTool: IMandatedActionExecutionTool;


class SystemActionDispatcher {
    
    // Private static dependencies (Dependency Encapsulation)
    static #tool: IMandatedActionExecutionTool;
    static #executionPlane: IExecutionPlane;
    static #systemManager: ISystemManager;
    static #resourceAllocator: IResourceAllocator;
    static #auditService: IAuditService;
    static #isInitialized = false;

    /**
     * Synchronous setup block: resolves dependencies and registers all actions.
     */
    static {
        // Simulate dependency resolution for synchronous setup
        const dependencies = {
            tool: MandatedActionExecutionTool,
            executionPlane: executionPlane,
            systemManager: systemManager,
            resourceAllocator: resourceAllocator,
            auditService: AuditService,
        };
        try {
            SystemActionDispatcher.#setupDependenciesAndInitialize(dependencies);
            SystemActionDispatcher.#isInitialized = true;
        } catch (e) {
            console.error("SystemActionDispatcher initialization failed:", e);
        }
    }

    /**
     * Extracts synchronous dependency assignment and action registration.
     * (Strategic Goal: Synchronous Setup Extraction & Dependency Encapsulation)
     */
    static #setupDependenciesAndInitialize(deps: {
        tool: IMandatedActionExecutionTool,
        executionPlane: IExecutionPlane,
        systemManager: ISystemManager,
        resourceAllocator: IResourceAllocator,
        auditService: IAuditService
    }) {
        if (typeof deps.tool === 'undefined' || !deps.tool.register) {
            throw new Error("MandatedActionExecutionTool dependency is unavailable. Dispatcher is inert.");
        }

        SystemActionDispatcher.#tool = deps.tool;
        SystemActionDispatcher.#executionPlane = deps.executionPlane;
        SystemActionDispatcher.#systemManager = deps.systemManager;
        SystemActionDispatcher.#resourceAllocator = deps.resourceAllocator;
        SystemActionDispatcher.#auditService = deps.auditService;

        const { #tool, #executionPlane, #systemManager, #resourceAllocator, #auditService } = SystemActionDispatcher;

        // --- AGI-KERNEL OPTIMIZATION: Structured Action Definition Map ---
        
        // Define action executors using a map for clarity, modularity, and easy extension.
        const actionExecutors: Record<string, (details: any) => any> = {
            // 1. ISOLATE_SUBSYSTEM: High-security operation
            'ISOLATE_SUBSYSTEM': (details) => {
                #auditService.recordPolicyViolation('ISOLATE_SUBSYSTEM', details);
                const subsystemId = details?.context?.subsystemId || 'UNKNOWN_SUB';
                return #executionPlane.enforceIsolation(subsystemId);
            },

            // 2. SELF_TERMINATE_MISSION: Critical failure protocol
            'SELF_TERMINATE_MISSION': (details) => {
                #auditService.recordPolicyViolation('SELF_TERMINATE_MISSION', details);
                const score = details?.score || 0;
                return #systemManager.executeSecureTermination(score);
            },

            // 3. ADAPTIVE_SCALE_DOWN: Standard resource adjustment
            'ADAPTIVE_SCALE_DOWN': (details) => {
                #auditService.recordPolicyViolation('ADAPTIVE_SCALE_DOWN', details);
                // Fixed scale down delta as per directive
                return #resourceAllocator.adjustCapacity(-0.1);
            }
        };

        // Register all defined actions iteratively
        for (const [code, executor] of Object.entries(actionExecutors)) {
            if (!#tool.register(code, executor)) {
                console.error(`[SAD] CRITICAL: Failed to register mandated action: ${code}. Dispatcher integrity compromised.`);
                // Note: Failure to register a critical action should be logged prominently.
            }
        }

        console.log("[SAD] Action registry initialization complete.");
    }

    /**
     * I/O Proxy for external tool execution.
     * (Strategic Goal: I/O Proxy Creation)
     */
    static #delegateToToolExecution(actionCode: string, details: any) {
        return SystemActionDispatcher.#tool.execute({
            actionCode: actionCode,
            details: details
        });
    }

    /**
     * Executes the specific mandated system action based on policy evaluation.
     * The execution logic is delegated to the MandatedActionExecutionTool.
     */
    static dispatchAction(actionCode: string, details: any) {
        console.log(`[SAD] Initiating mandated action: ${actionCode}`);
        
        if (!SystemActionDispatcher.#isInitialized) {
             console.error(`[SAD] Failed to dispatch ${actionCode}: Dispatcher is not initialized.`);
             return;
        }

        // Use the I/O proxy to execute the pre-registered action
        const result = SystemActionDispatcher.#delegateToToolExecution(actionCode, details);

        if (!result.success) {
            console.error(`[SAD] Action dispatch failed for ${actionCode}. Reason: ${result.error || 'Action failed unexpectedly.'}`);
        } else {
            console.log(`[SAD] Action ${actionCode} completed.`);
        }
    }
}

export { SystemActionDispatcher };