import * as CFTM_CONFIG from '../../config/security/cftm_v3.json';

/**
 * Validates and provides typed access to Governance Axiom (GAX) constants.
 * This is critical for ensuring numerical integrity within the COF calculations.
 */
export class CftmValidator {
    private constants: Map<string, number> = new Map();

    constructor() {
        this.loadAndValidate();
    }

    private loadAndValidate(): void {
        const axioms = (CFTM_CONFIG as any).axioms;

        // Type and existence checks for key constants (DENOMINATOR_STABILITY_TAU)
        const TAU = axioms.COF_Stability_Model.value;
        if (typeof TAU !== 'number' || TAU <= 0) {
            throw new Error('[CFTM] TAU constant validation failed.');
        }

        // Type and range checks for epsilon (MINIMUM_EFFICACY_SAFETY_MARGIN_EPSILON)
        const EPSILON = axioms.P01_Finality_Model.value;
        if (typeof EPSILON !== 'number' || EPSILON <= 0 || EPSILON >= 1) {
            throw new Error('[CFTM] EPSILON constant validation failed.');
        }

        this.constants.set(axioms.COF_Stability_Model.constant_key, TAU);
        this.constants.set(axioms.P01_Finality_Model.constant_key, EPSILON);
    }

    /** Retrieves a constant value by its defined key (e.g., 'DENOMINATOR_STABILITY_TAU') */
    public getConstant(key: string): number {
        const value = this.constants.get(key);
        if (value === undefined) {
            throw new Error(`[CFTM] Requested unknown or uninitialized constant: ${key}`);
        }
        return value;
    }
}