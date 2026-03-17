/** 
 * TransitionStateVerifierKernel enforces architectural consistency by utilizing
 * Dependency Injection (DI) for its required utilities and isolating synchronous 
 * setup logic.
 */
class TransitionStateVerifierKernel {
    /**
     * @param {ITransitionSchema} schema - The state machine configuration schema.
     * @param {IShallowObjectDiffUtilityToolKernel} shallowDiffUtilityKernel - Utility for shallow object comparison.
     */
    constructor(schema, shallowDiffUtilityKernel) {
        /** @private {ITransitionSchema} */
        this._schema = null;
        /** @private {IShallowObjectDiffUtilityToolKernel} */
        this._shallowDiffUtilityKernel = null;

        this.#setupDependencies(schema, shallowDiffUtilityKernel);
    }

    /**
     * Isolates synchronous dependency setup and validation.
     * @private
     */
    #setupDependencies(schema, shallowDiffUtilityKernel) {
        if (!schema || !shallowDiffUtilityKernel) {
            throw new Error("TransitionStateVerifierKernel requires schema and shallowDiffUtilityKernel.");
        }
        this._schema = schema;
        this._shallowDiffUtilityKernel = shallowDiffUtilityKernel;
    }

    verify(state, transition) {
        const { from, to } = transition;
        
        if (!this._schema.states[from] || !this._schema.states[to]) {
            return false;
        }

        const diff = this.getDiff(state, from);
        
        if (diff.length === 0) {
            return true;
        }

        const abstraction = this.getAbstraction(diff, from); 
        
        return this.isAbstractionValid(abstraction, to);
    }

    /**
     * Identifies keys in 'state' that differ from the definition of the 'from' schema state,
     * utilizing the injected diff utility.
     */
    getDiff(state, from) {
        const fromSchema = this._schema.states[from];
        // Uses the injected kernel
        return this._shallowDiffUtilityKernel.getDiff(state, fromSchema);
    }

    /**
     * Derives a partial object (abstraction) containing the expected previous values 
     * (from the 'from' schema definition) for all keys that were found to be different.
     */
    getAbstraction(diff, from) {
        const abstraction = {};
        const fromSchema = this._schema.states[from];

        diff.forEach(key => {
            abstraction[key] = fromSchema[key];
        });
        return abstraction;
    }

    /**
     * Checks if the abstraction values (old values of changed fields) match 
     * the definition of the target state ('to').
     */
    isAbstractionValid(abstraction, to) {
        const toState = this._schema.states[to];
        
        const keys = Object.keys(abstraction);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (abstraction[key] !== toState[key]) {
                return false;
            }
        }
        return true;
    }
}