/**
 * @file nexus_core.js
 * @version 4.0.0-alpha
 * @description Event bus and task orchestrator implementing a Bind-Check-Execute pipeline with bitwise diagnostic filtering and symbol management.
 */

import { z } from 'zod';

/**
 * @namespace NexusInternal
 * @description Internal configuration and telemetry constants.
 */
const NexusInternal = Object.freeze({
  Version: '4.0.0-alpha',
  DefaultMaxHistory: 5000,
  InternalNamespace: Symbol('NexusInternalScope'),
  TraceHeader: 'X-Nexus-Trace-ID',
  PerformanceMarkPrefix: 'nexus-perf-'
});

/**
 * @enum {number} NexusDiagnosticCategory
 * Bitmask for diagnostic severity and type filtering.
 */
export const NexusDiagnosticCategory = {
  Error: 1 << 0,
  Warning: 1 << 1,
  Message: 1 << 2,
  Suggestion: 1 << 3,
  Internal: 1 << 4,
  Telemetry: 1 << 5
};

/**
 * @class NexusCancellationToken
 * @description Controller for asynchronous interruption with hierarchical propagation and listener cleanup.
 */
export class NexusCancellationToken {
  #isCancelled = false;
  #listeners = new Set();
  #parentToken = null;
  #reason = null;
  #children = new Set();
  #abortController = new AbortController();
  #disposed = false;

  constructor(parentToken = null) {
    if (parentToken instanceof NexusCancellationToken) {
      this.#parentToken = parentToken;
      this.#parentToken.#registerChild(this);
      const unbind = this.#parentToken.onCancellationRequested((reason) => this.cancel(reason));
      this.onDispose(() => unbind());
    }
  }

  static None = Object.freeze(new NexusCancellationToken());

  get isCancelled() {
    return this.#isCancelled || (this.#parentToken?.isCancelled ?? false);
  }

  get signal() { 
    return this.#abortController.signal; 
  }

  get cancellationReason() {
    return this.#reason || this.#parentToken?.cancellationReason || null;
  }

  #registerChild(child) {
    this.#children.add(child);
  }

  link(tokens) {
    if (!Array.isArray(tokens)) return this;
    for (const t of tokens) {
      if (t instanceof NexusCancellationToken && t !== this) {
        const unbind = t.onCancellationRequested(r => this.cancel(r));
        this.onDispose(() => unbind());
      }
    }
    return this;
  }

  cancel(reason = 'Operation cancelled') {
    if (this.#isCancelled || this.#disposed) return;
    this.#isCancelled = true;
    this.#reason = reason;
    this.#abortController.abort(reason);
    
    queueMicrotask(() => {
      this.#listeners.forEach(fn => {
        try { fn(this.#reason); } catch (e) {}
      });
      this.#listeners.clear();
      this.#children.forEach(child => child.cancel(reason));
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

  onDispose(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  throwIfCancelled() {
    if (this.isCancelled) {
      const error = new Error(this.cancellationReason || 'Operation cancelled');
      error.name = 'OperationCanceledException';
      error.code = 'NX_CANCEL';
      throw error;
    }
  }

  dispose() {
    this.#disposed = true;
    this.#listeners.clear();
    this.#children.clear();
    this.#parentToken = null;
  }
}

/**
 * @class NexusDiagnosticReporter
 * @description Diagnostic aggregator with bitmask filtering and performance-based timestamping.
 */
class NexusDiagnosticReporter {
  #diagnostics = [];
  #maxHistory = NexusInternal.DefaultMaxHistory;
  #subscribers = new Set();
  #filterMask = 0b111111;

  setFilterMask(mask) {
    this.#filterMask = mask;
  }

  subscribe(cb) {
    this.#subscribers.add(cb);
    return () => this.#subscribers.delete(cb);
  }

  report(category, code, message, relatedInfo = null) {
    const diagnostic = {
      category,
      code,
      message,
      relatedInformation: relatedInfo,
      timestamp: performance.now(),
      id: `NX${code}-${Math.random().toString(36).substring(2, 7)}`,
      stack: new Error().stack?.split('\n').slice(2, 5)
    };

    this.#diagnostics.push(diagnostic);
    if (this.#diagnostics.length > this.#maxHistory) this.#diagnostics.shift();

    if ((category & this.#filterMask) !== 0) {
      this.#broadcast(diagnostic);
    }
    return diagnostic;
  }

  #broadcast(diag) {
    for (const cb of this.#subscribers) {
      try { cb(diag); } catch (e) {}
    }
  }

  getDiagnostics() { return [...this.#diagnostics]; }
  
  clear() { this.#diagnostics = []; }
}

/**
 * @class NexusSymbolTable
 * @description Registry for flow identifiers and associated metadata.
 */
class NexusSymbolTable {
  #symbols = new Map();

  declare(name, metadata) {
    if (this.#symbols.has(name)) {
      throw new Error(`Duplicate identifier: ${name}`);
    }
    const symbol = {
      name,
      metadata,
      flags: 0,
      declarations: [metadata]
    };
    this.#symbols.set(name, symbol);
    return symbol;
  }

  resolve(name) {
    return this.#symbols.get(name) || null;
  }

  has(name) {
    return this.#symbols.has(name);
  }
}

/**
 * @class NexusTypeChecker
 * @description Validation engine using Zod schemas for runtime I/O enforcement.
 */
class NexusTypeChecker {
  #schemas = new Map();
  #reporter;

  constructor(reporter) {
    this.#reporter = reporter;
  }

  register(name, schema) {
    this.#schemas.set(name, schema);
    this.#reporter.report(NexusDiagnosticCategory.Message, 200, `Registered Schema: ${name}`);
  }

  check(name, data, context = 'check') {
    const schema = this.#schemas.get(name);
    if (!schema) {
      this.#reporter.report(NexusDiagnosticCategory.Warning, 201, `Missing schema for ${name}. Skipping check.`);
      return { success: true, data };
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      this.#reporter.report(
        NexusDiagnosticCategory.Error,
        1001,
        `Type Mismatch in ${context}: ${name}`,
        { errors: result.error.flatten(), data }
      );
    }
    return result;
  }

  enforce(fn, inputSchema, outputSchema) {
    return async (...args) => {
      const inputCheck = inputSchema ? this.check(inputSchema, args[0], `Input::${fn.name}`) : { success: true };
      if (!inputCheck.success) throw new Error(`Input validation failed for ${fn.name}`);

      const result = await fn(...args);

      const outputCheck = outputSchema ? this.check(outputSchema, result, `Output::${fn.name}`) : { success: true };
      if (!outputCheck.success) throw new Error(`Output validation failed for ${fn.name}`);

      return result;
    };
  }
}

/**
 * @class NexusHost
 * @description Orchestrator managing flow lifecycles through binding and middleware-wrapped execution.
 */
export class NexusHost {
  #symbols = new NexusSymbolTable();
  #checker;
  #reporter;
  #flows = new Map();
  #middleware = [];

  constructor() {
    this.#reporter = new NexusDiagnosticReporter();
    this.#checker = new NexusTypeChecker(this.#reporter);
    this.#reporter.report(NexusDiagnosticCategory.Internal, 1, 'NexusHost Initialized', { version: NexusInternal.Version });
  }

  get checker() { return this.#checker; }
  get reporter() { return this.#reporter; }

  use(fn) {
    this.#middleware.push(fn);
  }

  defineFlow(name, { input, output }, logic) {
    if (this.#symbols.has(name)) {
      this.#reporter.report(NexusDiagnosticCategory.Error, 501, `Flow Collision: ${name}`);
      return;
    }

    const typeSafeLogic = this.#checker.enforce(logic, input, output);
    
    const finalLogic = async (data, token) => {
      let index = -1;
      const runner = async (i, currentData) => {
        if (i <= index) throw new Error('next() called multiple times');
        index = i;
        if (i === this.#middleware.length) return await typeSafeLogic(currentData, token);
        return await this.#middleware[i](currentData, (nextData) => runner(i + 1, nextData || currentData), token);
      };
      return await runner(0, data);
    };

    this.#symbols.declare(name, { input, output, registeredAt: Date.now() });
    this.#flows.set(name, finalLogic);
    this.#reporter.report(NexusDiagnosticCategory.Message, 500, `Flow Bound: ${name}`);
  }

  async execute(flowName, input, token = NexusCancellationToken.None) {
    const flow = this.#flows.get(flowName);
    if (!flow) {
      const err = `ReferenceError: Flow '${flowName}' is not defined.`;
      this.#reporter.report(NexusDiagnosticCategory.Error, 404, err);
      throw new Error(err);
    }

    const markStart = `${NexusInternal.PerformanceMarkPrefix}${flowName}-start`;
    performance.mark(markStart);
    
    try {
      return await flow(input, token);
    } finally {
      const markEnd = `${NexusInternal.PerformanceMarkPrefix}${flowName}-end`;
      performance.mark(markEnd);
    }
  }
}