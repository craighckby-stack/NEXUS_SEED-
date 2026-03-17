import { STESSpecification } from '../protocols/STES_specification.json';
import { ResolverHooks } from './ResolverHooks';

/**
 * STES_Protocol_Resolver
 * Reads the STES specification and enforces governance protocols at runtime.
 */
export class STES_Protocol_Resolver {
    private spec: typeof STESSpecification;

    constructor(spec: typeof STESSpecification) {
        this.spec = spec;
    }

    /** Verifies incoming request compliance based on protocol constraints. */
    public validateRequest(request: any): boolean {
        const constraints = this.spec.constraints.runtime_validation;
        // Check required keys and trust score
        for (const key of constraints.required_keys) {
            if (!request[key]) {
                throw new Error(`Missing mandatory key: ${key}`);
            }
        }
        if (request.trustScore < constraints.minimum_trust_score) {
            throw new Error(`Trust score (${request.trustScore}) below minimum threshold (${constraints.minimum_trust_score}).`);
        }
        return true;
    }

    /** Determines and executes the state transition based on the current state and trigger. */
    public executeTransition(currentState: string, trigger: string, payload: any): string {
        const transition = this.spec.state_machine.transitions.find(
            t => t.from === currentState && t.trigger === trigger
        );

        if (!transition) {
            throw new Error(`Invalid transition or trigger for state ${currentState}.`);
        }

        // 1. Resolve method call (e.g., check_metric_drift_threshold)
        ResolverHooks[transition.resolver_method](payload);

        // 2. Execute enforcement hook
        if (transition.enforcement_hook) {
            ResolverHooks[transition.enforcement_hook](payload);
        }

        return transition.to;
    }
}