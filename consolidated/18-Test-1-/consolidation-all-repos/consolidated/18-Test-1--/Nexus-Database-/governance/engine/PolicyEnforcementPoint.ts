import * as fs from 'fs';
// Assuming SE_PCF_Policy type is defined elsewhere for strict typing
// type SE_PCF_Policy = any;

export class PolicyEnforcementPoint {
    private policy: any;
    
    constructor(policyPath: string) {
        try {
            this.policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
            console.log(`[PEP] Loaded Policy: ${this.policy.policyId} v${this.policy.policyVersion}`);
        } catch (e) {
            throw new Error(`Failed to load governance policy: ${e}`);
        }
    }

    /** Synchronously checks input data against defined filters based on target scope. */
    public enforce(scope: string, data: string): { allowed: boolean, action: string, message?: string } {
        if (!this.policy.enabled) return { allowed: true, action: 'SKIP' };
        
        // Iterate policies in priority order (high priority first)
        const filters = Object.values(this.policy.filters).sort((a: any, b: any) => b.priority - a.priority);

        for (const filter of filters as any[]) {
            if (!filter.enabled) continue;
            
            for (const rule of filter.rules) {
                if (rule.target_scope === scope && rule.regex) {
                    const regex = new RegExp(rule.regex, 'i');
                    if (regex.test(data)) {
                        if (filter.mode === 'DENY_HARD') {
                            return { allowed: false, action: 'DENY', message: `Violation [P${filter.priority}]: ${rule.name}` };
                        }
                        // LOG_SOFT and MASK actions would proceed with logging/mutation but potentially allow flow
                        console.warn(`[PEP] Soft Policy Triggered: ${rule.name}. Mode: ${filter.mode}`);
                    }
                }
            }
        }
        return { allowed: true, action: 'ALLOW' };
    }
}