// src/governance/TelemetryServiceKernel.js

const DEFAULT_SOURCE = 'AEOR';

/**
 * TelemetryServiceKernel
 * Dedicated kernel for auditable, high-integrity governance logging and metrics tracking.
 * Replaces synchronous dependencies and direct console access with injected, asynchronous tools.
 */
class TelemetryServiceKernel {
    /**
     * @param {object} dependencies
     * @param {ILoggerToolKernel} dependencies.loggerToolKernel
     * @param {MultiTargetAuditDisperserToolKernel} dependencies.auditDisperserToolKernel
     * @param {ConfigDefaultsRegistryKernel} dependencies.configDefaultsRegistryKernel
     * @param {object} [dependencies.config] - Initial configuration (e.g., { logLevel: 'info', source: 'AIA-CORE' })
     */
    constructor(dependencies) {
        this._isInitialized = false;
        this._dependencies = dependencies;
        
        // Configuration place holders
        this._levelWeights = {};
        this._logLevelWeight = 0;
        this._source = DEFAULT_SOURCE;
        this._logLevel = 'info';

        this.#setupDependencies();
    }

    #setupDependencies() {
        const { loggerToolKernel, auditDisperserToolKernel, configDefaultsRegistryKernel } = this._dependencies;

        if (!loggerToolKernel || !auditDisperserToolKernel || !configDefaultsRegistryKernel) {
            throw new Error("TelemetryServiceKernel requires loggerToolKernel, auditDisperserToolKernel, and configDefaultsRegistryKernel.");
        }

        this._logger = loggerToolKernel;
        this._auditDisperser = auditDisperserToolKernel;
        this._configRegistry = configDefaultsRegistryKernel;
    }

    async initialize() {
        if (this._isInitialized) {
            this._logger.warn("TelemetryServiceKernel already initialized.");
            return;
        }

        try {
            // Load level weights and default level from the Configuration Registry asynchronously
            const telemetryConfig = await this._configRegistry.get('telemetry.logConfig', {
                LEVEL_WEIGHTS: {
                    'debug': 10, 'info': 20, 'warn': 30, 'error': 40,
                    'critical': 50, 'fatal': 60,
                },
                DEFAULT_LEVEL: 'info'
            });

            this._levelWeights = telemetryConfig.LEVEL_WEIGHTS;
            const defaultLevel = telemetryConfig.DEFAULT_LEVEL;
            
            // Source is retrieved from configuration passed to the constructor (or defaults)
            this._source = this._dependencies.config?.source || DEFAULT_SOURCE;
            
            const requestedLevel = (this._dependencies.config?.logLevel || defaultLevel).toLowerCase();
            
            // Normalize logLevel and set weight
            const effectiveLevel = this._levelWeights[requestedLevel] ? requestedLevel : defaultLevel;
            
            this._logLevel = effectiveLevel;
            this._logLevelWeight = this._levelWeights[effectiveLevel];

            this._isInitialized = true;
            this._logger.info("TelemetryServiceKernel initialized successfully.", { effectiveLevel });

        } catch (error) {
            this._logger.error("Failed to initialize TelemetryServiceKernel configuration.", { error: error.message });
            throw error;
        }
    }

    /**
     * Internal asynchronous logging function responsible for filtering and dual-path dispatching.
     * 1. Local logging (via ILoggerToolKernel).
     * 2. High-Integrity Auditing (via MultiTargetAuditDisperserToolKernel, fulfilling D-01 mandate).
     * @param {string} level 
     * @param {string} message 
     * @param {object} metadata 
     */
    async _log(level, message, metadata = {}) {
        if (!this._isInitialized) {
             // Fallback using standard logger if available
             this._logger?.warn(`Telemetry requested before initialization: [${level}] ${message}`);
             return;
        }

        const levelWeight = this._levelWeights[level];

        // 1. Filtering: Suppress messages below the configured threshold
        if (!levelWeight || levelWeight < this._logLevelWeight) {
            return;
        }

        // 2. Formatting (Standardized Audit Record Data Model)
        const timestamp = new Date().toISOString();
        const auditRecord = {
            timestamp,
            level: level.toUpperCase(),
            source: this._source,
            message,
            ...metadata
        };
        
        // 3. Dispatching
        
        // A) Local Logging (handled by ILoggerToolKernel)
        const loggerMetadata = { ...metadata, source: this._source };
        if (this._logger[level]) {
            this._logger[level](message, loggerMetadata);
        } else {
            this._logger.log(level, message, loggerMetadata);
        }
        
        // B) High-Integrity Audit Dispersal (Asynchronously pipe to verifiable audit log)
        await this._auditDisperser.dispersedAudit(auditRecord);
    }

    async fatal(message, metadata) {
        await this._log('fatal', message, metadata);
    }
    async critical(message, metadata) {
        await this._log('critical', message, metadata);
    }
    async error(message, metadata) {
        await this._log('error', message, metadata);
    }
    async warn(message, metadata) {
        await this._log('warn', message, metadata);
    }
    async info(message, metadata) {
        await this._log('info', message, metadata);
    }
    async debug(message, metadata) {
        await this._log('debug', message, metadata);
    }
}

module.exports = TelemetryServiceKernel;