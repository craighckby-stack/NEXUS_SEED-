class ConfigSchemaRegistryKernel {
    /** @private */
    #configSchema = null;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Initializes the schema definition and enforces immutability.
     * All raw constant definitions are isolated here.
     * @private
     */
    #setupDependencies() {
        // --- Internal Schema Definition Helpers ---

        /**
         * Creates a generic schema field definition.
         * @param {string} type - The expected data type (e.g., 'string', 'number').
         * @param {object} props - Additional properties.
         */
        const Field = (type, props) => ({ type, ...props });

        /**
         * Creates a schema field definition for strings.
         * @param {object} props - Properties.
         */
        const StringField = (props) => Field('string', props);

        // --- Configuration Schema Definition ---

        const rawConfigSchema = {
            app: {
                id: StringField({ required: true, description: 'Application identifier' }),
                root: StringField({ required: true, description: 'Absolute root directory path' })
            },
            dirs: {
                logs: StringField({ required: true, description: 'Name of the logging directory' }),
                temp: StringField({ required: true, description: 'Name of the temporary files directory' })
            },
            logging: {
                logLevel: StringField({
                    required: true,
                    default: 'info',
                    enum: ['debug', 'info', 'warn', 'error'],
                    description: 'Logging verbosity level'
                }),
                auditFileName: StringField({ required: true, description: 'Filename for OGT decisions audit log' }),
                auditPath: StringField({ required: false, description: 'Derived full path to the audit file' })
            }
        };

        this.#configSchema = this.#deepFreeze(rawConfigSchema);
    }

    /**
     * Recursively freezes an object to ensure deep immutability.
     * @param {object} obj - The object to freeze.
     * @returns {object} The frozen object.
     * @private
     */
    #deepFreeze(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const propNames = Object.getOwnPropertyNames(obj);

        for (const name of propNames) {
            const value = obj[name];
            if (typeof value === 'object' && value !== null) {
                this.#deepFreeze(value);
            }
        }

        return Object.freeze(obj);
    }

    /**
     * Retrieves the immutable configuration schema definition.
     * @returns {object} The frozen configuration schema definition.
     */
    getSchema() {
        return this.#configSchema;
    }
}

module.exports = ConfigSchemaRegistryKernel;