import { performance, PerformanceObserver } from 'perf_hooks';

const DiagnosticCategory = {
    Error: 0,
    Warning: 1,
    Message: 2,
    Suggestion: 3
};

const CoreState = {
    Idle: 'IDLE',
    Booting: 'BOOTING',
    Ready: 'READY',
    Executing: 'EXECUTING',
    Finalizing: 'FINALIZING',
    Error: 'ERROR',
    Disposed: 'DISPOSED'
};

class NexusSystemHost {
    constructor() {
        this.args = Object.freeze(process.argv.slice(2));
        this.newLine = process.platform === 'win32' ? '\r\n' : '\n';
    }

    write(s) { process.stdout.write(s); }
    writeError(s) { process.stderr.write(s); }
    getCurrentDirectory() { return process.cwd(); }
    getMemoryUsage() { return process.memoryUsage().heapUsed; }
}

class NexusDiagnostic {
    constructor(category, code, message, detail = null) {
        this.category = category;
        this.code = code;
        this.message = message;
        this.detail = detail;
        this.timestamp = performance.now();
        this.relatedInformation = [];
    }

    addRelated(message, code) {
        this.relatedInformation.push({ message, code, timestamp: performance.now() });
        return this;
    }
}

class DiagnosticReporter {
    #diagnostics = [];
    #errorCount = 0;

    report(diagnostic) {
        this.#diagnostics.push(diagnostic);
        if (diagnostic.category === DiagnosticCategory.Error) {
            this.#errorCount++;
            const prefix = `[Error ${diagnostic.code}]`;
            process.stderr.write(`${prefix}: ${diagnostic.message}${diagnostic.detail ? `\n${diagnostic.detail}` : ''}\n`);
        }
    }

    getDiagnostics() {
        return Object.freeze([...this.#diagnostics]);
    }

    hasErrors() {
        return this.#errorCount > 0;
    }
}

class CancellationToken {
    #isCancelled = false;
    #reason = null;

    cancel(reason = 'MANUAL_CANCEL') {
        this.#isCancelled = true;
        this.#reason = reason;
    }

    get isCancelled() {
        return this.#isCancelled;
    }

    throwIfCancelled() {
        if (this.#isCancelled) {
            const err = new Error(`OPERATION_CANCELLED: ${this.#reason}`);
            err.name = 'CancellationError';
            throw err;
        }
    }
}

class NexusEventHub {
    #subscribers = new Map();

    subscribe(event, callback) {
        if (!this.#subscribers.has(event)) this.#subscribers.set(event, []);
        const listeners = this.#subscribers.get(event);
        listeners.push(callback);
        return () => {
            const idx = listeners.indexOf(callback);
            if (idx !== -1) listeners.splice(idx, 1);
        };
    }

    async notify(event, data) {
        const listeners = this.#subscribers.get(event);
        if (!listeners) return;
        for (const callback of listeners) {
            try {
                await Promise.resolve(callback(data));
            } catch (e) {
                process.stderr.write(`EventHub error [${event}]: ${e.message}\n`);
            }
        }
    }
}

class StepExecutor {
    static decorate(step, reporter, eventHub) {
        const originalExecute = step.execute.bind(step);
        return async (context) => {
            const markStart = `start-${step.name}`;
            const markEnd = `end-${step.name}`;
            performance.mark(markStart);
            await eventHub.notify('step:start', { name: step.name });
            try {
                await originalExecute(context);
            } catch (error) {
                reporter.report(new NexusDiagnostic(DiagnosticCategory.Error, 5001, `Step ${step.name} failed`, error.stack));
                throw error;
            } finally {
                performance.mark(markEnd);
                performance.measure(step.name, markStart, markEnd);
                await eventHub.notify('step:end', { name: step.name });
            }
        };
    }
}

class NexusCore {
    #state = CoreState.Idle;
    #reporter = new DiagnosticReporter();
    #eventHub = new NexusEventHub();
    #host = new NexusSystemHost();
    #pipeline = [];
    #config = null;
    #perfObserver = null;

    constructor(config = {}) {
        this.#config = config;
        this.#initializePerformanceTracking();
        this.#initializePipeline();
    }

    #initializePerformanceTracking() {
        this.#perfObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                this.#eventHub.notify('telemetry', {
                    name: entry.name,
                    duration: entry.duration,
                    type: entry.entryType,
                    timestamp: performance.now()
                });
            });
        });
        this.#perfObserver.observe({ entryTypes: ['measure', 'mark'], buffered: true });
    }

    #transitionState(newState) {
        this.#state = newState;
        this.#eventHub.notify('state:transition', { state: newState });
    }

    #addPipelineStep(name, execute) {
        this.#pipeline.push(StepExecutor.decorate({ name, execute }, this.#reporter, this.#eventHub));
    }

    #initializePipeline() {
        this.#transitionState(CoreState.Booting);

        this.#addPipelineStep('VALIDATE_CONFIG', async (ctx) => {
            if (!this.#config || typeof this.#config !== 'object') {
                this.#reporter.report(new NexusDiagnostic(DiagnosticCategory.Error, 1001, 'Invalid config'));
                throw new Error('ERR_CONFIG_INVALID');
            }
            if (!this.#config.version) {
                this.#reporter.report(new NexusDiagnostic(DiagnosticCategory.Error, 1002, 'Missing version'));
                throw new Error('ERR_VERSION_MISSING');
            }
        });
    }
}