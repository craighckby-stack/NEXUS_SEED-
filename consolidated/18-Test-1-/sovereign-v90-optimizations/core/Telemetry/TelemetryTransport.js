/**
 * TelemetryTransport
 * Handles asynchronous delivery using the HttpBatchTransport plugin
 * for queue management and network delivery.
 */

// Resolve dependency once at the module scope for performance and clarity
const HttpBatchTransport = require('./HttpBatchTransport');

/**
 * Using composition with HttpBatchTransport plugin to manage core logic.
 */
class TelemetryTransport {
    // Rigorously enforce encapsulation using private class fields
    #httpTransport;

    constructor(config) {
        // Initialize the abstracted transport layer
        this.#httpTransport = this.#setupTransport(config);
    }

    /**
     * @private
     * Handles the synchronous instantiation and resolution of the internal transport dependency.
     */
    #setupTransport(config) {
        return new HttpBatchTransport(config);
    }

    queueEvent(packet) {
        // Delegate queuing to the transport layer
        this.#httpTransport.queueItem(packet);
    }

    /**
     * Shuts down the transport and attempts a final flush.
     */
    async shutdown() {
        await this.#httpTransport.shutdown();
    }
}

module.exports = TelemetryTransport;
