const Ajv = require('ajv');
const schema = require('../config/governance/P01_Gate_Schema.json');

/**
 * Validates a configuration instance against the P01 Governance Gate Schema.
 * @param {object} gateConfig - The specific gate definition to validate.
 * @returns {boolean} - True if valid, throws error if invalid.
 */
class GateSchemaValidator {
    constructor() {
        this.ajv = new Ajv({ schemas: [schema] });
        this.validate = this.ajv.getSchema(schema.$id) || this.ajv.compile(schema);
    }

    verify(gateConfig) {
        const valid = this.validate(gateConfig);
        if (!valid) {
            throw new Error(`Gate Configuration Invalid: ${this.validate.errors.map(e => `${e.dataPath}: ${e.message}`).join(', ')}`);
        }
        return true;
    }
}

module.exports = new GateSchemaValidator();