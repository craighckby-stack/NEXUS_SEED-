/**
 * @file nexus_core.js
 * @description Core event bus and task orchestrator with schema validation, diagnostic reporting, and hierarchical cancellation.
 */

import { z } from 'zod';

/**
 * @enum {number} NexusDiagnosticCategory
 */
const NexusDiagnosticCategory = {
  Error: 0,
  Warning: 1,
  Message: 2,
  Suggestion: 3,
};

/**
 * @class NexusCancellationToken
 * @description Mechanistic controller for asynchronous interruption supporting hierarchical propagation.
 */
class NexusCancellationToken {
  #isCancelled = false;
  #listeners = new Set();
  #parentToken = null;

  constructor(parentToken = null) {
    if (parentToken instanceof NexusCancellationToken) {
      this.#parentToken = parentToken;
      this.#parentToken.onCancellationRequested(() => this.cancel());
    }
  }

  get isCancelled() {
    return this.#isCancelled || (this.#parentToken ? this.#parentToken.isCancelled : false);
  }

  cancel() {
    if (this.#isCancelled) return;
    this.#isCancelled = true;
    this.#listeners.forEach((fn) => fn());
    this.#listeners.clear();
  }

  onCancellationRequested(fn) {
    if (this.isCancelled) {
      fn();
      return () => {};
    }
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  throwIfCancelled() {
    if (this.isCancelled) {
      const error = new Error('Operation cancelled by NexusCancellationToken');
      error.name = 'OperationCanceledException';
      throw error;
    }
  }
}

/**
 * @class NexusSchemaRegistry
 * @description Map-based registry for Zod schema validation.
 */
class NexusSchemaRegistry {
  #schemas = new Map();

  register(type, schema) {
    if (this.#schemas.has(type)) {
      throw new Error(`Schema for type '${type}' already exists.`);
    }
    this.#schemas.set(type, schema);
  }

  getSchema(type) {
    return this.#schemas.get(type) || z.any();
  }

  validate(type, data) {
    return this.getSchema(type).safeParse(data);
  }
}

/**
 * @class NexusDiagnosticReporter
 * @description Standardized reporting interface for system events and errors.
 */
class NexusDiagnosticReporter {
  #diagnostics = [];

  report(category, code, message, relatedInformation = null) {
    const diagnostic = {
      category,
      code,
      message,
      relatedInformation,
      timestamp: Date.now(),
      id: `DIAG-${Math.random().toString(36).substring(2, 11)}`
    };
    this.#diagnostics.push(diagnostic);
    this.#emitToConsole(diagnostic);
    return diagnostic;
  }

  #emitToConsole(diag) {
    const categoryName = Object.keys(NexusDiagnosticCategory).find(key => NexusDiagnosticCategory[key] === diag.category);
    const prefix = `[Nexus ${categoryName}] (NX${diag.code}):`;
    switch (diag.category) {
      case NexusDiagnosticCategory.Error: console.error(prefix, diag.message); break;
      case NexusDiagnosticCategory.Warning: console.warn(prefix, diag.message); break;
      default: console.log(prefix, diag.message);
    }
  }

  getDiagnostics() {
    return Object.freeze([...this.#diagnostics]);
  }

  clear() {
    this.#diagnostics = [];
  }
}

/**
 * @class NexusEventBus
 * @description Event dispatcher with interceptor pipeline and schema enforcement.
 */
class NexusEventBus {
  #subscriptions = new Map();
  #interceptors = [];
  #registry;
  #reporter;

  constructor(registry, reporter) {
    this.#registry = registry;
    this.#reporter = reporter;
  }

  use(interceptor) {
    this.#interceptors.push(interceptor);
  }

  async broadcast(type, payload, traceId = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36)) {
    const validation = this.#registry.validate(type, payload);
    if (!validation.success) {
      this.#reporter.report(
        NexusDiagnosticCategory.Error,
        1001,
        `Event structural mismatch for type: ${type}`,
        validation.error.format()
      );
      return null;
    }

    let eventState = { type, payload: Object.freeze(validation.data), traceId, timestamp: Date.now() };

    for (const interceptor of this.#interceptors) {
      try {
        const result = await interceptor(eventState);
        if (result === false) return null;
        if (result) eventState = result;
      } catch (err) {
        this.#reporter.report(NexusDiagnosticCategory.Warning, 1002, `Interceptor failed: ${err.message}`);
      }
    }

    const subs = this.#subscriptions.get(type) || [];
    const tasks = Array.from(subs).map(async (sub) => {
      try {
        if (sub.filter && !sub.filter(eventState)) return;
        return await sub.handler(eventState);
      } catch (err) {
        this.#reporter.report(NexusDiagnosticCategory.Error, 3001, `Handler execution failed for ${type}: ${err.message}`);
      }
    });

    return Promise.all(tasks);
  }

  subscribe(type, handler, filter = null) {
    if (!this.#subscriptions.has(type)) {
      this.#subscriptions.set(type, new Set());
    }
    const sub = { 
      handler, 
      filter, 
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36) 
    };
    this.#subscriptions.get(type).add(sub);
    return () => this.#subscriptions.get(type).delete(sub);
  }
}

/**
 * @class NexusTask
 * @description Data model for unit of work execution.
 */
class NexusTask {
  constructor(id, runFn, metadata = {}) {
    this.id = id;
    this.run = runFn;
    this.metadata = metadata;
    this.retries = 0;
    this.maxRetries = metadata.maxRetries || 3;
    this.priority = metadata.priority || 1;
    this.createdAt = Date.now();
  }
}

/**
 * @class NexusOrchestrator
 * @description Task scheduler with priority-based worker pool management.
 */
class NexusOrchestrator {
  #poolSize;
  #workers = [];
  #queue = [];
  #registry;
  #reporter;
  #activeTasks = new Map();

  constructor(config = {}, registry, reporter) {
    this.#poolSize = config.maxWorkers || 4;
    this.#registry = registry;
    this.#reporter = reporter;
    this.#initializeWorkers();
  }

  #initializeWorkers() {
    for (let i = 0; i < this.#poolSize; i++) {
      this.#workers.push({
        id: `nexus-worker-${i}`,
        isBusy: false,
        taskCount: 0
      });
    }
  }

  async submit(task, token = new NexusCancellationToken()) {
    if (this.#queue.length >= 10000) {
      this.#reporter.report(NexusDiagnosticCategory.Error, 2001, 'Orchestrator queue capacity exceeded');
      throw new Error('Capacity Exceeded');
    }

    this.#queue.push({ task, token });
    this.#queue.sort((a, b) => b.task.priority - a.task.priority);
    this.#processNext();
  }

  async #processNext() {
    if (this.#queue.length === 0) return;

    const worker = this.#workers.find(w => !w.isBusy);
    if (!worker) return;

    const { task, token } = this.#queue.shift();
    this.#execute(worker, task, token);
  }

  async #execute(worker, task, token) {
    worker.isBusy = true;
    this.#activeTasks.set(task.id, { worker, token });

    try {
      token.throwIfCancelled();
      this.#reporter.report(NexusDiagnosticCategory.Message, 4001, `Starting task ${task.id} on ${worker.id}`);
      
      const result = await task.run({ token, reporter: this.#reporter });
      
      this.#reporter.report(NexusDiagnosticCategory.Message, 4002, `Task ${task.id} completed successfully`);
      return result;
    } catch (err) {
      if (err.name === 'OperationCanceledException') {
        this.#reporter.report(NexusDiagnosticCategory.Warning, 4003, `Task ${task.id} was cancelled`);
      } else if (task.retries < task.maxRetries) {
        task.retries++;
        this.#reporter.report(NexusDiagnosticCategory.Warning, 4004, `Task ${task.id} failed. Retry ${task.retries}/${task.maxRetries}`);
        this.submit(task, token);
      } else {
        this.#reporter.report(NexusDiagnosticCategory.Error, 4005, `Task ${task.id} failed permanently: ${err.message}`);
      }
    } finally {
      worker.isBusy = false;
      worker.taskCount++;
      this.#activeTasks.delete(task.id);
      this.#processNext();
    }
  }

  cancel(taskId) {
    const active = this.#activeTasks.get(taskId);
    if (active) active.token.cancel();
  }
}

/**
 * @class NexusCore
 * @description Composition root for the Nexus system.
 */
class NexusCore {
  constructor(config = {}) {
    this.registry = new NexusSchemaRegistry();
    this.reporter = new NexusDiagnosticReporter();
    this.bus = new NexusEventBus(this.registry, this.reporter);
    this.orchestrator = new NexusOrchestrator(config, this.registry, this.reporter);
    
    this.reporter.report(NexusDiagnosticCategory.Message, 100, 'Nexus Core System Initialized');
  }

  async runDirective(name, logic, schema) {
    this.registry.register(`directive:${name}`, schema);
    return this.orchestrator.submit(new NexusTask(name, async ({ token }) => {
      return await logic(token);
    }));
  }
}

export { 
  NexusCore, 
  NexusTask, 
  NexusCancellationToken, 
  NexusDiagnosticCategory 
};