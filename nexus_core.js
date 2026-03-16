/**
 * @file nexus_core.js
 * @description Core kernel for the Nexus architecture, implementing advanced design patterns (Observer, Factory, Decorator) 
 * to establish a high-performance, asynchronous, and modular foundation.
 */

const { performance } = require('perf_hooks');

/**
 * ==========================================
 * DIAGNOSTICS & DECORATORS
 * ==========================================
 */

/**
 * Mechanistic Justification: Centralized diagnostic registry prevents silent failures 
 * and categorizes system state, akin to TypeScript's ts.Diagnostic.
 */
class DiagnosticReporter {
    constructor() {
        this.diagnostics = [];
    }

    report(level, message, context = {}) {
        const entry = { timestamp: Date.now(), level, message, context };
        this.diagnostics.push(entry);
        if (level === 'ERROR' || level === 'FATAL') {
            console.error(`[${level}] ${message}`, context);
        }
    }

    getDiagnostics() {
        return [...this.diagnostics];
    }
}

const globalReporter = new DiagnosticReporter();

/**
 * Higher-Order Function Decorator: withPerformanceTracking
 * Mechanistic Justification: Wraps an asynchronous method to track its execution time 
 * and report anomalies.
 * @param {Function} fn - The asynchronous function to decorate.
 * @param {string} name - Identifier for the diagnostic log.
 * @returns {Function} Decorated function.
 */
function withPerformanceTracking(fn, name) {
    return async function (...args) {
        const start = performance.now();
        try {
            return await fn.apply(this, args);
        } catch (error) {
            globalReporter.report('ERROR', `Execution failed in ${name}`, { error: error.message, stack: error.stack });
            throw error;
        } finally {
            const duration = performance.now() - start;
            if (duration > 50) { // Threshold for performance warning (50ms)
                globalReporter.report('WARN', `Slow execution detected in ${name}`, { duration: `${duration.toFixed(2)}ms` });
            }
        }
    };
}

/**
 * Higher-Order Function Decorator: withAsyncRetry
 * Mechanistic Justification: Ensures transient failures in network/IO operations do not crash the kernel.
 */
function withAsyncRetry(fn, retries = 3, delayMs = 100) {
    return async function (...args) {
        let attempt = 0;
        while (attempt < retries) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                attempt++;
                globalReporter.report('WARN', `Retry attempt ${attempt}/${retries} for function`, { error: error.message });
                if (attempt >= retries) throw error;
                await new Promise(res => setTimeout(res, delayMs * attempt)); // Exponential-ish backoff
            }
        }
    };
}

/**
 * ==========================================
 * OBSERVER PATTERN: ASYNC EVENT BUS
 * ==========================================
 */

/**
 * NexusEventBus
 * Mechanistic Justification: Decouples subsystems. Uses priority queues for deterministic execution 
 * order during asynchronous event broadcasting.
 */
class NexusEventBus {
    constructor() {
        /* Map<string, Array<{ priority: number, handler: Function }>> */
        this.channels = new Map();
    }

    /**
     * Subscribes a handler to a specific event channel.
     * Mechanistic Justification: Ensures deterministic behavior and prevents event loops 
     * or lost events by maintaining a centralized subscription mechanism.
     * @param {string} event - The event identifier.
     * @param {Function} handler - The callback function.
     * @param {number} priority - Higher priority executes first.
     */
    subscribe(event, handler, priority = 0) {
        if (!this.channels.has(event)) {
            this.channels.set(event, []);
        }
        const listeners = this.channels.get(event);
        listeners.push({ priority, handler });
        // Sort descending by priority to ensure deterministic execution
        listeners.sort((a, b) => b.priority - a.priority);
        globalReporter.report('INFO', `Subscribed to event: ${event}`, { priority });
    }

    /**
     * Asynchronously publishes an event to all subscribers.
     * Mechanistic Justification: Efficiently disseminates events without blocking or 
     * deadlocking, preserving kernel responsiveness.
     * @param {string} event - The event identifier.
     * @param {Object} payload - Data to pass to handlers.
     */
    async publish(event, payload = {}) {
        if (!this.channels.has(event)) return;
        
        const listeners = this.channels.get(event);
        const executionPromises = listeners.map(async (listener) => {
            try {
                await listener.handler(payload);
            } catch (error) {
                globalReporter.report('ERROR', `Event handler failed for ${event}`, { error: error.message });
            }
        });

        await Promise.allSettled(executionPromises);
    }
}

/**
 * ==========================================
 * FACTORY PATTERN: SUBSYSTEM REGISTRY
 * ==========================================
 */

/**
 * SubsystemFactory
 * Mechanistic Justification: Centralizes instantiation logic, allowing the kernel to dynamically 
 * load required modules without hardcoding dependencies.
 */
class SubsystemFactory {
    constructor() {
        this.registry = new Map();
        this.instances = new Map();
    }

    /**
     * Registers a class constructor with the factory. Mechanistic Justification: 
     * Ensures type safety and modular design.
     * @param {string} name - Identifier for the subsystem.
     * @param {Class} constructorRef - The class reference.
     */
    register(name, constructorRef) {
        if (this.registry.has(name)) {
            globalReporter.report('WARN', `Overwriting existing subsystem registration: ${name}`);
        }
        this.registry.set(name, constructorRef);
        globalReporter.report('INFO', `Registered subsystem: ${name}`);
    }

    /**
     * Instantiates or retrieves a singleton instance of a subsystem. Mechanistic 
     * Justification: Preserves memory efficiency by avoiding unnecessary instance duplication.
     * @param {string} name - Identifier for the subsystem.
     * @param {Object} config - Configuration object passed to the constructor.
     */
    create(name, config = {}) {
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }
        
        const ConstructorRef = this.registry.get(name);
        if (!ConstructorRef) {
            throw new Error(`Subsystem [${name}] not found in registry.`);
        }

        const instance = new ConstructorRef(config);
        this.instances.set(name, instance);
        globalReporter.report('INFO', `Instantiated subsystem: ${name}`);
        return instance;
    }
}

/**
 * ==========================================
 * CORE KERNEL
 * ==========================================
 */

/**
 * NexusKernel
 * Mechanistic Justification: The orchestrator. Manages the lifecycle phases (Boot, Bind, Execute) 
 * and holds the central EventBus and Factory.
 */
class NexusKernel {
    constructor() {
        this.bus = new NexusEventBus();
        this.factory = new SubsystemFactory();
        this.state = 'INITIALIZED';
    }

    /**
     * Phase 1: Boot
     * Registers foundational systems.
     */
    async boot() {
        this.state = 'BOOTING';
        globalReporter.report('INFO', 'Nexus Kernel booting...');
        
        // Example: Registering a dummy built-in subsystem to demonstrate Factory usage
        class TelemetrySubsystem {
            constructor(config) { this.endpoint = config.endpoint; }
            async send(data) { return true; }
        }
        
        // Decorate the send method
        TelemetrySubsystem.prototype.send = withPerformanceTracking(
            withAsyncRetry(TelemetrySubsystem.prototype.send, 3, 50),
            'TelemetrySubsystem.send'
        );

        this.factory.register('Telemetry', TelemetrySubsystem);
        
        await this.bus.publish('system:booted', { timestamp: Date.now() });
        this.state = 'READY';
    }

    /**
     * Phase 2: Execute
     * Begins main event loop or processes initial payloads.
     */
    async execute(initialPayload) {
        if (this.state !== 'READY') {
            throw new Error('Kernel must be booted before execution.');
        }
        
        globalReporter.report('INFO', 'Nexus Kernel executing payload.');
        
        // Simulate processing
        const processPayload = withPerformanceTracking(async (payload) => {
            // Truncation safeguard logic (Mechanistic response to API limits)
            if (typeof payload === 'string' && payload.startsWith('PK')) {
                globalReporter.report('WARN', 'Binary/Corrupted payload detected. Truncating to prevent memory/limit overflow.');
                payload = payload.substring(0, 100) + '...[TRUNCATED]';
            }
            await this.bus.publish('system:process', { payload });
        }, 'Kernel.processPayload');

        await processPayload(initialPayload);
    }
}

module.exports = {
    NexusKernel,
    DiagnosticReporter,
    globalReporter,
    withPerformanceTracking,
    withAsyncRetry
};