import { STESSpecification } from '../protocols/STES_specification.json';
import { ResolverHooks } from './ResolverHooks';
import { ProtocolConstraintValidator } from '../plugins/ProtocolConstraintValidator';

// Assuming SpecificationStateTransitionResolver is available in the execution environment.
// We use a mock interface declaration for type checking purposes.
declare const SpecificationStateTransitionResolver: {
    execute(args: {
        spec: any;
        hooks: any;
        currentState: string;
        trigger: string;
        payload: any;
    }): string;
};

/**
 * STES_Protocol_Resolver
 * Reads the STES specification and enforces governance protocols at runtime.
 */
export class STES_Protocol_Resolver {
    #spec: typeof STESSpecification;
    #validatorProxy: { validate: (constraints: any, request: any) => boolean };
    #hooksProxy: typeof ResolverHooks;
    #transitionResolverProxy: typeof SpecificationStateTransitionResolver;

    constructor(spec: typeof STESSpecification) {
        this.#spec = spec;
        this.#setupDependencies();
    }

    /** Extracts synchronous dependency resolution and initialization. */
    #setupDependencies(): void {
        this.#validatorProxy = ProtocolConstraintValidator;
        this.#hooksProxy = ResolverHooks;
        this.#resolveStateTransitionResolver();
    }

    /** I/O Proxy: Resolves the required external transition execution tool. */
    #resolveStateTransitionResolver(): void {
        // Check for global tool availability
        if (typeof SpecificationStateTransitionResolver === 'undefined') {
            this.#logSetupError("SpecificationStateTransitionResolver tool not available.");
        }
        // Runtime assignment based on declaration/global availability
        this.#transitionResolverProxy = SpecificationStateTransitionResolver;
    }

    /** I/O Proxy: Handles fatal errors during setup. */
    #logSetupError(message: string): never {
        // Note: Using standard throw to signal mandatory dependency failure.
        throw new Error(message);
    }

    /** I/O Proxy: Delegates to ProtocolConstraintValidator execution. */
    #delegateToConstraintValidation(constraints: any, request: any): boolean {
        return this.#validatorProxy.validate(constraints, request);
    }

    /** I/O Proxy: Delegates to SpecificationStateTransitionResolver execution. */
    #delegateToTransitionExecution(currentState: string, trigger: string, payload: any): string {
        return this.#transitionResolverProxy.execute({
            spec: this.#spec,
            hooks: this.#hooksProxy,
            currentState: currentState,
            trigger: trigger,
            payload: payload
        });
    }

    /** Verifies incoming request compliance based on protocol constraints. */
    public validateRequest(request: any): boolean {
        // Delegate reusable constraint validation logic using I/O proxy
        return this.#delegateToConstraintValidation(this.#spec.constraints, request);
    }

    /** Determines and executes the state transition based on the current state and trigger. */
    public executeTransition(currentState: string, trigger: string, payload: any): string {
        // Delegate complex transition lookup and hook execution using I/O proxy
        return this.#delegateToTransitionExecution(currentState, trigger, payload);
    }
}