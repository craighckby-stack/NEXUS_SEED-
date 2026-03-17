/**
 * TelemetryTransport
 * Handles event queueing, batch creation, flushing, and asynchronous delivery.
 */

class TelemetryTransport {
    constructor(config) {
        this.endpoint = config.endpoint;
        this.batchSize = config.batchSize || 50;
        this.flushInterval = config.flushInterval || 5000; // ms
        this.queue = [];
        this._setupFlushTimer();
    }

    _setupFlushTimer() {
        // Set up a periodic timer to flush the queue, even if batch size isn't met.
        this.timer = setInterval(() => {
            if (this.queue.length > 0) {
                this.flush();
            }
        }, this.flushInterval);
    }

    queueEvent(packet) {
        this.queue.push(packet);
        if (this.queue.length >= this.batchSize) {
            this.flush();
        }
    }

    async flush() {
        if (this.queue.length === 0) return;

        // Grab current queue and reset the internal queue
        const batchToSend = this.queue;
        this.queue = [];

        try {
            // Simulate HTTP POST request
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchToSend)
            });

            if (!response.ok) {
                // Handle transient network errors or 4xx/5xx responses
                console.error(`Telemetry Transport: Failed to send batch (${response.status})`, response.statusText);
                // NOTE: Implement sophisticated retry logic (e.g., exponential backoff) if required by robustness spec.
            }

        } catch (error) {
            console.error('Telemetry Transport Network Error:', error.message);
        }
    }

    shutdown() {
        clearInterval(this.timer);
        if (this.queue.length > 0) {
            this.flush(); // Attempt final synchronous flush
        }
    }
}

module.exports = TelemetryTransport;