/**
 * Autonomous SCoT/ACVD Verification Protocol Executor (VPE v94.1).
 * Implements logic defined in ASGL_v94.1_config.json's 'check_protocol'.
 */

class VerificationProtocolExecutor {
    constructor(config) {
        this.rules = config.verification_rules;
    }

    async executeAllChecks() {
        const results = [];
        for (const rule of this.rules) {
            let status = { passed: false, message: "Protocol execution failed." };
            
            try {
                // Dynamic execution based on rule.check_protocol.method
                status = await SystemAPI.executeProtocol(rule.check_protocol.method, rule.check_protocol.params);
            } catch (error) {
                status.message = `Engine Error during ${rule.id}: ${error.message}`;
            }

            if (!status.passed) {
                this.handleFailure(rule.id, status.message, rule.failure_policy);
            }
            results.push({ ruleId: rule.id, status: status.passed, policy: rule.failure_policy });
        }
        return results;
    }

    handleFailure(ruleId, message, policy) {
        LogService.captureIntegrityBreach(ruleId, message, policy.severity);
        
        if (policy.trigger_audit) {
            SystemAPI.initiateComplianceAudit(ruleId, policy.severity);
        }

        if (policy.severity === 'CRITICAL' && policy.handler.includes('HALT')) {
            SystemAPI.emergencyHalt({ reason: 'ASGL_CRITICAL_FAILURE', ruleId });
        }
    }
}

module.exports = VerificationProtocolExecutor;