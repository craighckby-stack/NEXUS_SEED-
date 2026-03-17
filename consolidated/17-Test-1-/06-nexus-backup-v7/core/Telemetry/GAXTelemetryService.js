import { ITelemetryService } from '../Plugins/Telemetry/ITelemetryService';

// Constants
const NO_OP = () => {};
const GA_DEFAULT_CATEGORY = 'App Interaction';
const GA_DEFAULT_DIMENSIONS = {};

/**
 * Service implementation for Google Analytics (or equivalent GA-like backend).
 * Assumes the GA tracking script (analytics.js or gtag.js) is loaded globally.
 * @implements {ITelemetryService}
 */
export class GAXTelemetryService {
    #trackingId = null;
    #isEnabled = false;
    #gaExecutor = NO_OP;

    /**
     * Executes a GA command using the resolved executor.
     * @private
     * @param {...any} args - Arguments to pass to the GA executor.
     */
    #executeGACommand(...args) {
        this.#gaExecutor(...args);
    }

    /**
     * Resolves the global GA function reference.
     * @private
     * @returns {function} The window.ga function or a NO_OP function.
     */
    #resolveGAFunction() {
        return typeof window !== 'undefined' && typeof window.ga === 'function' 
            ? window.ga 
            : NO_OP;
    }

    /**
     * Initializes the GA tracker.
     * @param {{ trackingId: string, enabled: boolean }} config - Configuration object.
     * @returns {Promise<void>}
     * @throws {Error} If trackingId is missing or GA function is not available.
     */
    async init(config) {
        if (!config) {
            throw new Error('[GAXTelemetryService Setup Error] Configuration is required.');
        }

        this.#trackingId = config.trackingId;
        this.#isEnabled = config.enabled;

        if (!this.#isEnabled) {
            return;
        }

        if (!this.#trackingId) {
            throw new Error('[GAXTelemetryService Setup Error] A trackingId is required.');
        }

        this.#gaExecutor = this.#resolveGAFunction();

        if (this.#gaExecutor === NO_OP) {
            throw new Error('[GAXTelemetryService Error] Global GA function (window.ga) not found. Tracking commands will be ignored.');
        }

        this.#executeGACommand('create', this.#trackingId, 'auto');
    }

    /**
     * Tracks a page view event.
     * @param {string} path - The page path to track.
     * @param {Object} [properties={}] - Additional properties to set.
     */
    trackPageView(path, properties = {}) {
        if (!this.#isEnabled || !path) return;

        this.#executeGACommand('set', { page: path, ...properties });
        this.#executeGACommand('send', 'pageview');
    }

    /**
     * Tracks a specific user action or custom event using GA's event model.
     * @param {string} eventName - The name of the event.
     * @param {Object} [properties={}] - Event properties including category, label, and value.
     */
    trackEvent(eventName, properties = {}) {
        if (!this.#isEnabled || !eventName) return;

        const { category = GA_DEFAULT_CATEGORY, label, value, ...customDimensions } = properties;
        const action = eventName;
        const eventValue = value ? parseInt(value, 10) : 0;

        this.#executeGACommand('send', 'event', category, action, label, eventValue);

        Object.entries(customDimensions).forEach(([key, dimensionValue]) => {
            this.#executeGACommand('set', `dimension${key}`, dimensionValue);
        });
    }

    /**
     * Identifies the current user by setting the GA User ID.
     * @param {string} userId - The user identifier.
     * @param {Object} [traits={}] - User traits to set as custom dimensions.
     */
    identify(userId, traits = GA_DEFAULT_DIMENSIONS) {
        if (!this.#isEnabled || !userId) return;

        this.#executeGACommand('set', 'userId', userId);

        Object.entries(traits).forEach(([key, traitValue]) => {
            this.#executeGACommand('set', `dimension${key}`, traitValue);
        });
    }
}
