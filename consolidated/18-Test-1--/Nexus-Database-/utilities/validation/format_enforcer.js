/**
 * Sovereign AGI Format Enforcer Utility (SAFE-V94.1)
 * Provides standardized validation routines for schema-defined formats (e.g., SEMVER, MODULE_UUID).
 * This utility is critical for Stage 2 payload verification, as defined in EPSD.
 */
class FormatEnforcer {
    constructor() {
        this.formats = {
            // Mandatory security checks
            "SHA256_HEX": /^[a-f0-9]{64}$/i,

            // Module identifiers and versioning
            "MODULE_UUID": /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
            "INTENT_HASH": /^(IID|PPL|SYS)-[A-Z0-9]{32}$/, // Placeholder for Intent/Proposal/System ID
            "SEMVER": /^v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?$/i
        };
    }

    /**
     * Validates a given value against a registered format key.
     * @param {string} value - The input data.
     * @param {string} formatKey - Key defined in the schema (e.g., 'SEMVER').
     * @returns {boolean}
     */
    validate(value, formatKey) {
        const regex = this.formats[formatKey];
        if (!regex) {
            throw new Error(`EPSD Format Validation Error: Key "${formatKey}" is undefined.`);
        }
        return regex.test(value);
    }
}

module.exports = new FormatEnforcer();