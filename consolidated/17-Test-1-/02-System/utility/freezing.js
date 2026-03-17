/**
 * Utility: Deep Configuration Freezing
 * Mandate: Provides a mechanism to enforce deep immutability on configuration objects,
 * essential for safeguarding Governance Axioms and System Constants, facilitating the utility merger.
 */

export const deepFreeze = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    Object.freeze(obj);

    Object.values(obj).forEach(prop => {
        if (typeof prop === 'object' && prop !== null && !Object.isFrozen(prop)) {
            deepFreeze(prop);
        }
    });
    return obj;
};
