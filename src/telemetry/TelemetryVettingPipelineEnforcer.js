// Sovereign AGI v94.1 Telemetry Vetting Pipeline Enforcer
import { CryptoService } from '../security/CryptoService';
import VettingConfig from '../../config/governance/TelemetryVettingSpec.json';

// Placeholder for an internal logging utility (assumes existence or falls back to console)
const internalLogger = { 
    warn: (message) => console.warn(`[VETTING ENFORCER] ${message}`),
    debug: (message) => process.env.NODE_ENV !== 'production' && console.log(`[VETTING ENFORCER DEBUG] ${message}`)
};

/**
 * Manages the autonomous enforcement of telemetry hygiene and governance rules.
 * This ensures data integrity, privacy compliance (e.g., dropping IPs), and sampling.
 */
export class TelemetryVettingPipelineEnforcer {
    /**
     * @param {object} config - The telemetry vetting specification configuration.
     * @param {CryptoService} cryptoService - Dependency for secure data transformation (e.g., hashing).
     */
    constructor(config = VettingConfig, cryptoService = new CryptoService()) {
        if (!config.metrics || !config.defaultPolicy) {
            throw new Error("TelemetryVettingSpec is improperly configured. Missing 'metrics' or 'defaultPolicy'.");
        }
        this.vettingRules = config.metrics;
        this.defaultAction = config.defaultPolicy;
        this.globalSamplingRate = config.samplingRateGlobal || 1.0;
        this.crypto = cryptoService;
        this.logger = internalLogger;
    }

    /**
     * Determines the appropriate action and sampling rate for a metric key.
     * @param {string} metricKey
     * @returns {{ rule: object, action: string, samplingRate: number }}
     * @private
     */
    _getRuleAndAction(metricKey) {
        const rule = this.vettingRules[metricKey] || {};
        const action = rule.action || this.defaultAction;
        const samplingRate = rule.sample_rate_override !== undefined
            ? rule.sample_rate_override
            : this.globalSamplingRate;

        return { rule, action, samplingRate };
    }

    /**
     * Executes necessary data transformation based on the defined action.
     * @param {string} action
     * @param {object} payload
     * @param {object} rule - Specific rule details.
     * @returns {object} The transformed payload.
     * @private
     */
    _applyTransformation(action, payload, rule) {
        let processedPayload = { ...payload };

        switch (action) {
            case 'AGGREGATE_DAILY_IP_DROP':
                // Anonymization: Remove PII (IP) and generalize timestamp
                delete processedPayload.ip_address;
                processedPayload.day_key = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
                break;

            case 'PASS_THROUGH_HASHED_SESSION':
                // Pseudo-anonymization: Hash session ID using the specified algorithm
                if (processedPayload.sessionId) {
                    const algorithm = rule.hashingAlgorithm || 'SHA256';
                    processedPayload.sessionId = this.crypto.hash(processedPayload.sessionId, algorithm);
                }
                break;

            case 'PASS_THROUGH':
            default:
                // No modification needed
                break;
        }
        return processedPayload;
    }

    /**
     * Intercepts a telemetry event and enforces hygiene rules.
     * @param {string} metricKey The name of the metric.
     * @param {object} payload The raw event payload
     * @returns {object | null} The processed payload, or null if dropped/sampled out.
     */
    enforce(metricKey, payload) {
        const { rule, action, samplingRate } = this._getRuleAndAction(metricKey);

        if (action === 'DROP_IMMEDIATELY') {
            this.logger.warn(`Hard drop enforced for metric: ${metricKey}`);
            return null;
        }

        // Sampling check (Crucial performance gate before processing)
        if (samplingRate < 1.0 && Math.random() >= samplingRate) {
            this.logger.debug(`Sampled out metric: ${metricKey}`);
            return null;
        }

        return this._applyTransformation(action, payload, rule);
    }
}

// Create a singleton instance for simplified module export usage
const TelemetryEnforcerInstance = new TelemetryVettingPipelineEnforcer();

/**
 * Standard public API wrapper for rule enforcement.
 * @param {string} metricKey The name of the metric.
 * @param {object} payload The raw event payload
 * @returns {object | null} The processed payload.
 */
export function enforceTelemetryRules(metricKey, payload) {
    return TelemetryEnforcerInstance.enforce(metricKey, payload);
}
