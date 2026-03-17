/**
 * @file nexus_core.js
 * @version 2.1.0
 * @description High-performance asynchronous execution kernel for the Nexus architecture.
 * Mechanistic Justification: Implements a tiered service container, priority-weighted task scheduling, 
 * and a diagnostic reporting pipeline modeled after the TypeScript compiler's diagnostic sink.
 */

const { performance } = require('perf_hooks');

/**
 * DIAGNOSTIC INFRASTRUCTURE
 * Mechanistic Justification: Separates diagnostic generation from presentation, 
 * allowing for pluggable formatters and severity-based filtering.
 */
const DiagnosticCategory = {
    Message: 0,
    Suggestion: 1,
    Warning: 2,
    Error: 3,
    Fatal: 4
};

/**
 * @typedef {Object} NexusDiagnostic
 * @property {number} category
 * @property {number} code
 * @property {string} messageText
 * @property {number} [start]
 * @property {number} [length]
 */

class NexusDiagnosticReporter {
    constructor() {
        this._diagnostics = [];
        this._modificationListeners = [];
    }

    /**
     * Reports a diagnostic entry with mechanistic metadata.
     */
    report(category, messageText, code = 0, metadata = {}) {
        const diagnostic = {
            category,
            code,
            messageText,
            timestamp: performance.now(),
            ...metadata
        };

        this._diagnostics.push(diagnostic);
        this._notifyListeners(diagnostic);

        if (category >= DiagnosticCategory.Error) {
            this._emitToStderr(diagnostic);
        }
    }

    _notifyListeners(diagnostic) {
        for (const listener of this._modificationListeners) {
            listener(diagnostic);
        }
    }

    _emitToStderr(diagnostic) {
        const prefix = `[NEX${diagnostic.code.toString().padStart(4, '0')}]`;
        process.stderr.write(`${prefix} ${DiagnosticCategory[diagnostic.category].toUpperCase()}: ${diagnostic.messageText}\n`);
    }

    getDiagnostics() {
        return Object.freeze([...this._diagnostics]);
    }

    clear() {
        this._diagnostics = [];
    }
}

const diagnostics = new NexusDiagnosticReporter();

/**
 * CANCELLATION ABSTRACTION
 * DNA: TypeScript CancellationToken.
 * Mechanistic Justification: Prevents zombie promises by propagating termination signals through the call stack.
 */
class CancellationToken {
    constructor(parentToken = null) {
        this._isCancelled = false;
        this._reason = null;
        this._listeners = new Set();

        if (parentToken) {
            parentToken.onCancellationRequested((reason) => this.cancel(reason));
        }
    }

    cancel(reason = 'Operation aborted by host') {
        if (this._isCancelled) return;
        this._isCancelled = true;
        this._reason = reason;
        this._listeners.forEach(fn => fn(reason));
        this._listeners.clear();
    }

    get isCancelled() {
        return this._isCancelled;
    }

    onCancellationRequested(callback) {
        if (this._isCancelled) {
            callback(this._reason);
        } else {
            this._listeners.add(callback);
        }
        return () => this._listeners.delete(callback);
    }

    throwIfCancelled() {
        if (this._isCancelled) {
            const err = new Error(`CancellationRequested: ${this._reason}`);
            err.name = 'OperationCanceledException';
            throw err;
        }
    }
}

/**
 * TASK SCHEDULER (CONCURRENCY CONTROL)
 * Mechanistic Justification: Prevents event-loop starvation by limiting concurrent async operations
 * and prioritizing critical path tasks.
 */
class NexusTaskScheduler {
    constructor(maxConcurrency = 5) {
        this.maxConcurrency = maxConcurrency;
        this.runningTasks = 0;
        this.queue = [];
    }

    /**
     * Enqueues a task with priority-based execution.
     * @param {() => Promise<any>} task
     * @param {number} priority Higher is executed sooner.
     */
    async schedule(task, priority = 0) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, priority, resolve, reject });
            this.queue.sort((a, b) => b.priority - a.priority);
            this._process();
        });
    }

    async _process() {
        if (this.runningTasks >= this.maxConcurrency || this.queue.length === 0) return;

        this.runningTasks++;
        const { task, resolve, reject } = this.queue.shift();

        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.runningTasks--;
            this._process();
        }
    }
}

/**
 * SERVICE CONTAINER
 * Mechanistic Justification: Decouples service instantiation from consumer logic via a centralized registry.
 */
class NexusServiceContainer {
    constructor() {
        this._services = new Map();
        this._factories = new Map();
    }

    register(id, factory, dependencies = []) {
        this._factories.set(id, { factory, dependencies });
    }

    async get(id) {
        if (this._services.has(id)) return this._services.get(id);

        const entry = this._factories.get(id);
        if (!entry) throw new Error(`ServiceNotFound: ${id}`);

        const resolvedDeps = await Promise.all(entry.dependencies.map(d => this.get(d)));
        const instance = await entry.factory(...resolvedDeps);
        
        this._services.set(id, instance);
        
        if (instance.onInitialize) {
            await instance.onInitialize();
        }

        return instance;
    }
}

/**
 * KERNEL CORE
 * Mechanistic Justification: Manages the absolute lifecycle of the Nexus environment.
 */
const KernelState = {
    Uninitialized: 0,
    Initializing: 1,
    Running: 2,
    Degraded: 3,
    Shutdown: 4
};

class NexusCoreKernel {
    constructor(hostConfig = {}) {
        this.state = KernelState.Uninitialized;
        this.services = new NexusServiceContainer();
        this.dispatcher = new NexusAsyncDispatcher();
        this.scheduler = new NexusTaskScheduler(hostConfig.concurrency || 10);
        this.host = hostConfig;

        this._setupPerformanceObserver();
    }

    _setupPerformanceObserver() {
        const obs = new PerformanceObserver((items) => {
            items.getEntries().forEach((entry) => {
                if (entry.duration > 200) {
                    diagnostics.report(DiagnosticCategory.Warning, `LongTaskDetected: ${entry.name}`, 8001, {
                        duration: entry.duration
                    });
                }
            });
        });
        obs.observe({ entryTypes: ['measure'], buffered: true });
    }

    async startup() {
        this.state = KernelState.Initializing;
        performance.mark('nexus-start');

        await this.dispatcher.dispatch('system:startup:begin', { timestamp: Date.now() });
        
        this.state = KernelState.Running;
        performance.mark('nexus-ready');
        performance.measure('NexusBootTime', 'nexus-start', 'nexus-ready');
    }

    /**
     * Executes an atomic unit of work through the scheduler.
     */
    async runTask(taskFn, priority = 0, token = new CancellationToken()) {
        if (this.state !== KernelState.Running) {
            throw new Error("KernelNotRunning");
        }

        return this.scheduler.schedule(async () => {
            token.throwIfCancelled();
            return await taskFn(token);
        }, priority);
    }

    async shutdown() {
        this.state = KernelState.Shutdown;
        await this.dispatcher.dispatch('system:shutdown', { exitCode: 0 });
        diagnostics.report(DiagnosticCategory.Message, "Kernel gracefully terminated.");
    }
}

class NexusAsyncDispatcher {
    constructor() {
        this._handlers = new Map();
        this._interceptors = [];
    }

    addInterceptor(fn) {
        this._interceptors.push(fn);
    }

    subscribe(channel, handler, priority = 0) {
        if (!this._handlers.has(channel)) this._handlers.set(channel, []);
        const list = this._handlers.get(channel);
        list.push({ handler, priority });
        list.sort((a, b) => b.priority - a.priority);
        
        return () => {
            const filtered = this._handlers.get(channel).filter(h => h.handler !== handler);
            this._handlers.set(channel, filtered);
        };
    }

    async dispatch(channel, payload, token = null) {
        if (token) token.throwIfCancelled();

        let currentPayload = payload;
        for (const interceptor of this._interceptors) {
            currentPayload = await interceptor(channel, currentPayload);
        }

        const handlers = this._handlers.get(channel) || [];
        const tasks = handlers.map(async ({ handler }) => {
            try {
                if (token) token.throwIfCancelled();
                await handler(currentPayload);
            } catch (e) {
                diagnostics.report(DiagnosticCategory.Error, `DispatchFault in ${channel}`, 5001, { context: e.message });
            }
        });

        await Promise.allSettled(tasks);
    }
}