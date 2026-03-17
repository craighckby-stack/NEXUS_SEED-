/**
 * Autonomous SCoT/ACVD Verification Protocol Executor (VPE v94.1).
 * Implements logic defined in ASGL_v94.1_config.json's 'check_protocol'.
 */

declare const IntegrityFailurePolicyEnforcerTool: {
 enforce: (ruleId: string, message: string, policy: any, actions: any) => { halted: boolean }
}; // Tool declaration
declare const SystemAPI: any; // External dependency
declare const LogService: any; // External dependency (unused but kept for context)
declare const SystemIntegrityActionsProvider: {
 getActions: () => {
 logBreach: (rid: string, msg: string, sev: string) => void;
 initiateAudit: (rid: string, sev: string) => void;
 emergencyHalt: (payload: any) => void;
 }
}; // New abstraction dependency

class VerificationProtocolExecutor {
 #rules;
 #IntegrityFailurePolicyEnforcerTool;
 #SystemIntegrityActionsProvider;
 #SystemAPI;

 constructor(config) {
 this.#setupDependencies(config);
 }

 /**
 * Goal: Extract synchronous dependency resolution and initialization.
 */
 #setupDependencies(config) {
 // Resolve external dependencies (assuming global availability as declared)
 this.#IntegrityFailurePolicyEnforcerTool = IntegrityFailurePolicyEnforcerTool;
 this.#SystemIntegrityActionsProvider = SystemIntegrityActionsProvider;
 this.#SystemAPI = SystemAPI;

 // Initialize internal state
 this.#rules = config.verification_rules;
 }

 // --- I/O Proxies for External Interactions (Optimized Set) ---

 #delegateToSystemAPIExecution(method, params) {
 // Proxy for SystemAPI.executeProtocol
 return this.#SystemAPI.executeProtocol(method, params);
 }

 #delegateToPolicyEnforcement(ruleId, message, policy, enforcementActions) {
 // Proxy for IntegrityFailurePolicyEnforcerTool.enforce
 const tool = this.#IntegrityFailurePolicyEnforcerTool;

 if (typeof tool === 'object' && tool && tool.enforce) {
 return tool.enforce(ruleId, message, policy, enforcementActions);
 }
 return null; // Indicates tool missing or unavailable
 }

 // --- Core Logic ---

 async executeAllChecks() {
 const results = [];
 for (const rule of this.#rules) {
 let status = { passed: false, message: "Protocol execution failed." };

 try {
 // Use I/O Proxy
 status = await this.#delegateToSystemAPIExecution(rule.check_protocol.method, rule.check_protocol.params);
 } catch (error) {
 status.message = `Engine Error during ${ rule.id }: ${error.message}`;
 }

 let isHalt = false;
 if (!status.passed) {
 // Use private failure handler
 isHalt = this.#handleFailure(rule.id, status.message, rule.failure_policy);
 }

 if (isHalt) {
 // Stop further checks if a critical halt occurred due to policy enforcement
 results.push({ ruleId: rule.id, status: status.passed, policy: rule.failure_policy, halted: true });
 break;
 }
 results.push({ ruleId: rule.id, status: status.passed, policy: rule.failure_policy, halted: false });
 }
 return results;
 }

 /**
 * Handles failure based on policy using the IntegrityFailurePolicyEnforcer Tool.
 * Optimized: Resolves actions directly and eliminates trivial action proxies.
 * @returns {boolean} True if the system was instructed to halt.
 */
 #handleFailure(ruleId, message, policy) {
 // 1. Resolve standardized system actions directly (eliminates #resolveSystemActions proxy)
 const enforcementActions = this.#SystemIntegrityActionsProvider.getActions();

 // 2. Delegate to policy enforcement tool via proxy
 const result = this.#delegateToPolicyEnforcement(ruleId, message, policy, enforcementActions);

 if (result) {
 return result.halted;
 } else {
 // CRITICAL: Fallback logic if tool is missing.
 // Eliminates #logError, #logBreach, #initiateAudit, #emergencyHalt proxies.
 console.error("IntegrityFailurePolicyEnforcerTool missing. Executing manual failure policy.");

 // Execute standardized actions directly
 enforcementActions.logBreach(ruleId, message, policy.severity);

 if (policy.trigger_audit) {
 enforcementActions.initiateAudit(ruleId, policy.severity);
 }
 if (policy.severity === 'CRITICAL' && policy.handler && policy.handler.includes('HALT')) {
 enforcementActions.emergencyHalt({ reason: 'ASGL_CRITICAL_FAILURE_MANUAL', ruleId });
 return true;
 }
 return false;
 }
 }
}

module.exports = VerificationProtocolExecutor;
