/**
 * @file nexus_core.js
 * @version 6.0.0-alpha.refactor
 * @description Task orchestrator implementing a Bind-Check-Execute pipeline with hierarchical symbol resolution, schema validation, and middleware execution.
 */

import { z } from 'zod';

/**
 * @enum {number} NexusSymbolFlags
 * Bitwise flags for symbol state and type.
 */
export const NexusSymbolFlags = {
  None: 0,
  Function: 1 << 0,
  Variable: 1 << 1,
  Async: 1 << 2,
  Flow: 1 << 3
};

/**
 * @enum {number} NexusDiagnosticCategory
 */
export const NexusDiagnosticCategory = {
  Error: 1,
  Warning: 2,
  Message: 3,
  Suggestion: 4,
  Internal: 5,
  Telemetry: 6,
  Performance: 7
};

/**
 * @class NexusDiagnosticChain
 * Linked-list structure for nested diagnostic messages.
 */
export class NexusDiagnosticChain {
  constructor(message, code, category, next = null) {
    this.message = message;
    this.code = code;
    this.category = category;
    this.next = next;
  }
}

/**
 * @class NexusCancellationToken
 * Controller for asynchronous interruption with hierarchical propagation.
 */
export class NexusCancellationToken {
  #isCancelled = false;
  #listeners = new Set();
  #parentToken = null;
  #reason = null;
  #abortController = new AbortController();
  #linkedTokens = new Set();
  #cleanupHooks = new Set();

  constructor(parentToken = null) {
    if (parentToken instanceof NexusCancellationToken) {
      this.#parentToken = parentToken;
      const cleanup = parentToken.onCancellationRequested((r) => this.cancel(r));
      this.#cleanupHooks.add(cleanup);
    }
  }

  static None = Object.freeze(new NexusCancellationToken());

  get isCancelled() {
    return this.#isCancelled || (this.#parentToken?.isCancelled ?? false);
  }

  get signal() {
    return this.#abortController.signal;
  }

  get reason() {
    return this.#reason || this.#parentToken?.reason || null;
  }

  cancel(reason = 'Operation aborted') {
    if (this.#isCancelled) return;
    this.#isCancelled = true;
    this.#reason = reason;
    this.#abortController.abort(reason);

    queueMicrotask(() => {
      for (const fn of this.#listeners) {
        try {
          fn(reason);
        } catch (e) {}
      }
      this.#listeners.clear();

      for (const linked of this.#linkedTokens) {
        linked.cancel(reason);
      }

      for (const cleanup of this.#cleanupHooks) {
        try {
          cleanup();
        } catch (e) {}
      }
      this.#cleanupHooks.clear();
    });
  }

  onCancellationRequested(fn) {
    if (this.isCancelled) {
      fn(this.reason);
      return () => {};
    }
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  link(otherToken) {
    if (otherToken instanceof NexusCancellationToken) {
      this.#linkedTokens.add(otherToken);
    }
    return this;
  }

  throwIfCancelled() {
    if (this.isCancelled) {
      const err = new Error(this.reason || 'Cancelled');
      err.name = 'NexusCancellationError';
      throw err;
    }
  }

  dispose() {
    for (const cleanup of this.#cleanupHooks) {
      cleanup();
    }
    this.#listeners.clear();
    this.#linkedTokens.clear();
    this.#cleanupHooks.clear();
  }
}

/**
 * @class NexusSymbol
 * Named entity within the Nexus environment supporting declaration merging.
 */
class NexusSymbol {
  constructor(name, flags) {
    this.name = name;
    this.flags = flags;
    this.declarations = [];
    this.valueDeclaration = null;
    this.parent = null;
  }

  addDeclaration(decl) {
    this.declarations.push(decl);
    if (decl.flags) this.flags |= decl.flags;
    if (!this.valueDeclaration && (decl.flags & (NexusSymbolFlags.Variable | NexusSymbolFlags.Function))) {
      this.valueDeclaration = decl;
    }
  }

  get isAsync() {
    return !!(this.flags & NexusSymbolFlags.Async);
  }

  get isFlow() {
    return !!(this.flags & NexusSymbolFlags.Flow);
  }
}

/**
 * @class NexusSymbolTable
 * Hierarchical symbol resolution engine.
 */
class NexusSymbolTable {
  #symbols = new Map();
  #parent = null;
  #scopeName;

  constructor(parent = null, scopeName = 'Global') {
    this.#parent = parent;
    this.#scopeName = scopeName;
  }

  get parent() {
    return this.#parent;
  }

  declare(name, flags, metadata) {
    let sym = this.#symbols.get(name);
    if (sym) {
      sym.addDeclaration(metadata);
      sym.flags |= flags;
    } else {
      sym = new NexusSymbol(name, flags);
      sym.addDeclaration(metadata);
      sym.parent = this.#parent ? this.#parent.resolve(this.#scopeName) : null;
      this.#symbols.set(name, sym);
    }
    return sym;
  }

  resolve(name) {
    let current = this;
    while (current) {
      const sym = current.#symbols.get(name);
      if (sym) return sym;
      current = current.#parent;
    }
    return null;
  }

  getSymbols() {
    return Array.from(this.#symbols.values());
  }

  createChildScope(name) {
    return new NexusSymbolTable(this, name);
  }
}

/**
 * @class NexusDiagnosticReporter
 * Aggregator for diagnostics with trace identification and performance timing.
 */
class NexusDiagnosticReporter {
  #diagnostics = [];
  #subscribers = new Set();
  #timers = new Map();

  report(category, code, message, relatedInformation = []) {
    const diagnostic = {
      category,
      code,
      message,
      relatedInformation,
      timestamp: performance.now(),
      traceId: crypto.randomUUID()
    };
    this.#diagnostics.push(diagnostic);
    this.#broadcast(diagnostic);
    return diagnostic;
  }

  reportChain(chain) {
    let current = chain;
    while (current) {
      this.report(current.category, current.code, current.message);
      current = current.next;
    }
  }

  startTimer(label) {
    this.#timers.set(label, performance.now());
  }

  stopTimer(label) {
    const start = this.#timers.get(label);
    if (start) {
      const duration = performance.now() - start;
      this.report(NexusDiagnosticCategory.Performance, 8000, `Timer [${label}]: ${duration.toFixed(4)}ms`);
      this.#timers.delete(label);
      return duration;
    }
    return 0;
  }

  #broadcast(diag) {
    for (const sub of this.#subscribers) {
      try {
        sub(diag);
      } catch (e) {}
    }
  }

  subscribe(fn) {
    this.#subscribers.add(fn);
    return () => this.#subscribers.delete(fn);
  }

  getDiagnostics() {
    return Object.freeze([...this.#diagnostics]);
  }

  getErrors() {
    return this.#diagnostics.filter(d => d.category === NexusDiagnosticCategory.Error);
  }

  clear() {
    this.#diagnostics = [];
  }
}

/**
 * @class NexusTypeChecker
 * Validation system using Zod schemas for structural integrity.
 */
class NexusTypeChecker {
  #schemas = new Map();
  #reporter;
  #symbolTable;

  constructor(reporter, symbolTable) {
    this.#reporter = reporter;
    this.#symbolTable = symbolTable;
  }

  registerSchema(name, schema) {
    if (this.#schemas.has(name)) {
      this.#reporter.report(NexusDiagnosticCategory.Warning, 3001, `Schema '${name}' overwritten.`);
    }
    this.#schemas.set(name, schema);
  }

  validate(schemaRef, data, location) {
    this.#reporter.startTimer(`validate:${location}`);
    const schema = typeof schemaRef === 'string' ? this.#schemas.get(schemaRef) : schemaRef;

    if (!schema) {
      this.#reporter.report(NexusDiagnosticCategory.Internal, 2002, `Missing schema reference: ${schemaRef} at ${location}`);
      this.#reporter.stopTimer(`validate:${location}`);
      return { success: true, data };
    }

    try {
      const result = schema.safeParse(data);
      if (!result.success) {
        const chain = result.error.issues.reduce((acc, issue) => {
          return new NexusDiagnosticChain(issue.message, 2001, NexusDiagnosticCategory.Error, acc);
        }, null);
        this.#reporter.reportChain(chain);
      }
      this.#reporter.stopTimer(`validate:${location}`);
      return result;
    } catch (e) {
      this.#reporter.report(NexusDiagnosticCategory.Error, 5000, `TypeChecker Error: ${e.message}`);
      this.#reporter.stopTimer(`validate:${location}`);
      return { success: false, error: e };
    }
  }
}

/**
 * @class NexusMiddlewarePipeline
 * Sequential execution logic for task middleware.
 */
class NexusMiddlewarePipeline {
  #middleware = [];
  #interceptors = { pre: [], post: [] };

  use(fn) {
    if (typeof fn !== 'function') throw new Error('Middleware must be a function');
    this.#middleware.push(fn);
  }

  intercept(phase, fn) {
    if (this.#interceptors[phase]) this.#interceptors[phase].push(fn);
  }
}