/**
 * Global Log Governance Schema Definition (GSEP Standard v2.1)
 * Component: LogNormalizationModule (LNM)
 * 
 * Defines required structure, type coercion, and validation rules for all 
 * Sovereign AGI operational log streams before ingestion. Decoupled from LNM core logic.
 */
module.exports = {
    timestamp: { 
        required: true, 
        coercer: (val) => { 
            const date = new Date(val); 
            if (isNaN(date.getTime())) { 
                // Throwing inside coercer triggers LNM_300 handling
                throw new Error("Invalid date input.");
            }
            return date.toISOString(); 
        }, 
        validator: (val) => val.includes('T') && !isNaN(Date.parse(val)),
        error_code: 'LNM_401' // Specific timestamp error
    },
    component_id: { 
        required: true, 
        coercer: (val) => String(val).toUpperCase(),
        validator: (val) => typeof val === 'string' && val.length > 0,
        error_code: 'LNM_402'
    },
    status_code: { 
        required: true, 
        coercer: Number, 
        validator: Number.isInteger, 
        error_code: 'LNM_403' 
    }, 
    gsep_stage: { 
        required: true, 
        coercer: (val) => { 
            const num = Number(val);
            if (isNaN(num)) throw new Error("Stage must be numeric.");
            return Math.floor(num);
        }, 
        validator: (val) => val >= 1 && val <= 5, 
        error_code: 'LNM_404', 
        error: 'GSEP stage index out of bounds (1-5)'
    },
    input_hash: { 
        required: true, 
        coercer: String, 
        validator: (val) => typeof val === 'string' && val.length >= 10 && /^[0-9a-fA-F]+$/.test(val),
        error_code: 'LNM_405',
        error: 'Input hash must be a minimum 10-character hexadecimal string.'
    },
    // Optional fields maintain strict type checks if present
    metadata: {
        required: false,
        coercer: (val) => { 
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch {
                    return val; // If string is not JSON, pass raw string
                }
            }
            return val;
        },
        validator: (val) => typeof val === 'object' && val !== null,
        error_code: 'LNM_406'
    }
};