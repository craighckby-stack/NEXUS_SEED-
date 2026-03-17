/**
 * Configuration Schema Definition.
 * Provides structure, types, and constraints for system configuration.
 * Uses Joi or similar validation library structure (simplified here for scaffolding).
 */

const configSchema = {
    app: {
        id: { type: 'string', required: true, description: 'Application identifier' },
        root: { type: 'string', required: true, description: 'Absolute root directory path' }
    },
    dirs: {
        logs: { type: 'string', required: true, description: 'Name of the logging directory' },
        temp: { type: 'string', required: true, description: 'Name of the temporary files directory' }
    },
    logging: {
        logLevel: { type: 'string', required: true, default: 'info', enum: ['debug', 'info', 'warn', 'error'] },
        auditFileName: { type: 'string', required: true, description: 'Filename for OGT decisions audit log' },
        auditPath: { type: 'string', required: false, description: 'Derived full path to the audit file' }
    }
};

module.exports = configSchema;