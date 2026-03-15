/**
 * @file nexus_core.js
 * @description Event bus and task orchestrator with schema validation, diagnostic reporting, and hierarchical cancellation.
 */

import { z } from 'zod';

/**
 * @namespace NexusInternal
 */
const NexusInternal = {
  Version: '2.1.0',
  DefaultMaxHistory: 1000,
};

/**
 * @enum {number} NexusDiagnosticCategory
 */
export const NexusDiagnosticCategory = {
  Error: 0,
  Warning: 1,
  Message: 2,
  Suggestion: 3,
  InternalError: 4,
};

/**
 * @class NexusCancellationToken
 * @description Controller for asynchronous interruption supporting hierarchical propagation and micro-task listener execution.
 */
class NexusCancellationToken {
  #isCancelled = false;
  #listeners = new Set();
  #parentToken = null;
  #reason = null;
  #children = new Set();

  constructor(parentToken = null) {
    if (parentToken instanceof NexusCancellationToken) {
      this.#parentToken = parentToken;
      this.#parentToken.#registerChild(this);
      this.#parentToken.onCancellationRequested((reason) => this.cancel(reason));
    }
  }

  static None = Object.freeze(new NexusCancellationToken());

  get isCancelled() {
    return this.#isCancelled || (this.#parentToken ? this.#parentToken.isCancelled : false);
  }

  get cancellationReason() {
    return this.#reason || (this.#parentToken ? this.#parentToken.cancellationReason : null);
  }

  #registerChild(child) {
    this.#children.add(child);
  }

  /**
   * Links multiple tokens to this instance.
   * @param {NexusCancellationToken[]} tokens 
   */
  link(tokens) {
    if (!Array.isArray(tokens)) return;
    tokens.forEach(t => {
      if (t instanceof NexusCancellationToken && t !== this) {
        t.onCancellationRequested(r => this.cancel(r));
      }
    });
  }

  cancel(reason = 'Operation cancelled') {
    if (this.#isCancelled) return;
    this.#isCancelled = true;
    this.#reason = reason;
    
    queueMicrotask(() => {
      for (const fn of this.#listeners) {
        try { fn(this.#reason); } catch (e) {
          /* Listener isolation */
        }
      }
      this.#listeners.clear();
      this.#children.clear();
    });
  }

  onCancellationRequested(fn) {
    if (this.isCancelled) {
      fn(this.cancellationReason);
      return () => {};
    }
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  throwIfCancelled() {
    if (this.isCancelled) {
      const error = new Error(this.cancellationReason || 'Operation cancelled');
      error.name = 'OperationCanceledException';
      error.code = 'NX_CANCEL';
      error.isNexusInternal = true;
      throw error;
    }
  }

  dispose() {
    this.#listeners.clear();
    this.#children.clear();
    this.#parentToken = null;
  }
}

/**
 * @class NexusSchemaRegistry
 * @description Map-based registry for Zod schemas with versioning and immutability locks.
 */
class NexusSchemaRegistry {
  #schemas = new Map();
  #metadata = new Map();
  #locked = new Set();

  register(name, schema, options = {}) {
    if (this.#locked.has(name)) {
      throw new Error(`ImmutableSchemaError: '${name}' is locked.`);
    }
    if (this.#schemas.has(name) && !options.allowOverwrite) {
      throw new Error(`SchemaConflict: '${name}' already registered.`);
    }
    
    this.#schemas.set(name, schema);
    this.#metadata.set(name, {
      version: (this.#metadata.get(name)?.version || 0) + 1,
      timestamp: new Date().toISOString()
    });

    if (options.lock) this.#locked.add(name);
  }

  getSchema(name) {
    return this.#schemas.get(name);
  }

  getMetadata(name) {
    return this.#metadata.get(name);
  }
}

/**
 * @class NexusDiagnosticReporter
 * @description Pipeline for system events with observer support and severity filtering.
 */
class NexusDiagnosticReporter {
  #diagnostics = [];
  #maxHistory = NexusInternal.DefaultMaxHistory;
  #callbacks = new Set();
  #filterLevel = NexusDiagnosticCategory.Message;

  setFilter(category) {
    this.#filterLevel = category;
  }

  onDiagnostic(cb) {
    this.#callbacks.add(cb);
    return () => this.#callbacks.delete(cb);
  }

  report(category, code, message, relatedInformation = null) {
    const diagnostic = {
      category,
      code,
      message,
      relatedInformation,
      timestamp: new Date().toISOString(),
      id: `NX${code}-${Math.random().toString(36).substring(2, 9)}`,
      trace: new Error().stack?.split('\n').slice(2, 5).join(' <- ')
    };

    this.#diagnostics.push(diagnostic);
    if (this.#diagnostics.length > this.#maxHistory) this.#diagnostics.shift();

    if (category <= this.#filterLevel) {
      this.#broadcast(diagnostic);
    }
    return diagnostic;
  }

  #broadcast(diag) {
    const catName = Object.keys(NexusDiagnosticCategory).find(k => NexusDiagnosticCategory[k] === diag.category);
    const prefix = `[Nexus::${catName}] (NX${diag.code})`;
    
    if (diag.category === NexusDiagnosticCategory.Error || diag.category === NexusDiagnosticCategory.InternalError) {
      console.error(`${prefix} ${diag.message}`, diag.relatedInformation || '');
    }

    for (const cb of this.#callbacks) {
      try { cb(diag); } catch (e) { /* Callback isolation */ }
    }
  }

  getDiagnostics() { return Object.freeze([...this.#diagnostics]); }
  
  clear() { this.#diagnostics = []; }
}

/**
 * @class NexusTypeService
 * @description Executes structural validation via NexusSchemaRegistry and reports diagnostics.
 */
class NexusTypeService {
  #registry;
  #reporter;

  constructor(registry, reporter) {
    this.#registry = registry;
    this.#reporter = reporter;
  }

  validate(typeName, data, location = 'nexus://core') {
    const schema = this.#registry.getSchema(typeName);
    if (!schema) {
      this.#reporter.report(NexusDiagnosticCategory.Warning, 2001, `No schema registered for: ${typeName}`);
      return { success: true, data }; 
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      this.#reporter.report(
        NexusDiagnosticCategory.Error,
        1001,
        `TypeMismatch: '${typeName}' at ${location}`,
        { zodError: result.error.format(), received: data }
      );
    }
    return result;
  }
}

/**
 * @class NexusEventBus
 * @description Async event mediator with middleware support and schema validation.
 */
class NexusEventBus {
  #handlers = new Map();
  #middleware = [];
  #typeService;
  #reporter;

  constructor(typeService, reporter) {
    this.#typeService = typeService;
    this.#reporter = reporter;
  }

  use(fn) {
    this.#middleware.push(fn);
    return this;
  }

  async publish(type, payload, options = {}) {
    const validation = this.#typeService.validate(type, payload, `EventBus.publish/${type}`);
    if (!validation.success && options.strict) {
      this.#reporter.report(NexusDiagnosticCategory.Error, 3003, `Strict mode rejection: ${type}`);
      return null;
    }

    const traceId = options.traceId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tr-${Math.random().toString(36).substring(2)}`);
    
    let envelope = {
      type,
      data: validation.data || payload,
      traceId,
      timestamp: Date.now(),
      meta: options.meta || {}
    };

    try {
      for (const mw of this.#middleware) {
        envelope = await mw(envelope);
        if (!envelope) return null;
      }

      const subscribers = this.#handlers.get(type) || [];
      const tasks = Array.from(subscribers).map(async (sub) => {
        try {
          if (sub.predicate && !sub.predicate(envelope)) return;
          return await sub.fn(envelope);
        } catch (err) {
          this.#reporter.report(NexusDiagnosticCategory.Error, 3001, `Handler failure: ${err.message}`, { traceId, type });
        }
      });

      return await Promise.all(tasks);
    } catch (err) {
      this.#reporter.report(NexusDiagnosticCategory.InternalError, 3002, `EventBus Fatal: ${err.message}`);
      throw err;
    }
  }

  subscribe(type, fn, predicate = null) {
    if (!this.#handlers.has(type)) this.#handlers.set(type, new Set());
    const entry = { fn, predicate };
    this.#handlers.get(type).add(entry);
    return () => this.#handlers.get(type).delete(entry);
  }
}