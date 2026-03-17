/**
 * @file nexus_core.js
 * @version 5.0.0-beta
 * @description Task orchestrator implementing a Bind-Check-Execute pipeline with hierarchical symbol resolution and schema validation.
 */

import { z } from 'zod';

/**
 * @enum {number} NexusInternalFlags
 * Bitwise flags for symbol and flow state.
 */
export const NexusInternalFlags = {
  None: 0,
  Async: 1 << 3
};

/**
 * @enum {number} NexusDiagnosticCategory
 */
export const NexusDiagnosticCategory = {
  Error: 1 << 0,
  Warning: 1 << 1,
  Message: 1 << 2,
  Suggestion: 1 << 3,
  Internal: 1 << 4,
  Telemetry: 1 << 5,
  Performance: 1 << 6
};

/**
 * @class NexusCancellationToken
 * @description Controller for asynchronous interruption with hierarchical propagation and linked source support.
 */
export class NexusCancellationToken {
  #isCancelled = false;
  #listeners = new Set();
  #parentToken = null;
  #reason = null;
  #abortController = new AbortController();
  #linkedTokens = new Set();

  constructor(parentToken = null) {
    if (parentToken instanceof NexusCancellationToken) {
      this.#parentToken = parentToken;
      const cleanup = parentToken.onCancellationRequested((r) => this.cancel(r));
      this.onDispose(() => cleanup());
    }
  }

  static None = Object.freeze(new NexusCancellationToken());

  get isCancelled() {
    return this.#isCancelled || (this.#parentToken?.isCancelled ?? false);
  }

  get signal() { return this.#abortController.signal; }

  cancel(reason = 'Operation aborted') {
    if (this.#isCancelled) return;
    this.#isCancelled = true;
    this.#reason = reason;
    this.#abortController.abort(reason);

    queueMicrotask(() => {
      for (const fn of this.#listeners) {
        try { fn(reason); } catch (e) {}
      }
      this.#listeners.clear();
      for (const linked of this.#linkedTokens) {
        linked.cancel(reason);
      }
    });
  }

  onCancellationRequested(fn) {
    if (this.isCancelled) {
      fn(this.#reason);
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
      const err = new Error(this.#reason || 'Cancelled');
      err.name = 'NexusCancellationError';
      throw err;
    }
  }

  onDispose(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }
}

/**
 * @class NexusSymbol
 * @description Named entity within the Nexus environment.
 */
class NexusSymbol {
  constructor(name, flags) {
    this.name = name;
    this.flags = flags;
    this.declarations = [];
  }
}

/**
 * @class NexusSymbolTable
 * @description Hierarchical symbol resolution engine.
 */
class NexusSymbolTable {
  #symbols = new Map();
  #parent = null;

  constructor(parent = null) {
    this.#parent = parent;
  }

  get parent() { return this.#parent; }

  declare(name, flags, metadata) {
    let sym = this.#symbols.get(name);
    if (sym) {
      sym.declarations.push(metadata);
      sym.flags |= flags;
    } else {
      sym = new NexusSymbol(name, flags);
      sym.declarations.push(metadata);
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
}

/**
 * @class NexusDiagnosticReporter
 * @description Diagnostic aggregator with unique trace identification.
 */
class NexusDiagnosticReporter {
  #diagnostics = [];
  #subscribers = new Set();

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

  #broadcast(diag) {
    for (const sub of this.#subscribers) {
      try { sub(diag); } catch {} 
    }
  }

  subscribe(fn) { 
    this.#subscribers.add(fn);
    return () => this.#subscribers.delete(fn);
  }

  getDiagnostics() { return [...this.#diagnostics]; }
}

/**
 * @class NexusTypeChecker
 * @description Zod-integrated type validation system.
 */
class NexusTypeChecker {
  #schemas = new Map();
  #reporter;

  constructor(reporter) {
    this.#reporter = reporter;
  }

  registerSchema(name, schema) {
    this.#schemas.set(name, schema);
  }

  validate(schemaName, data, location) {
    const schema = this.#schemas.get(schemaName);
    if (!schema) return { success: true, data };

    const result = schema.safeParse(data);
    if (!result.success) {
      this.#reporter.report(
        NexusDiagnosticCategory.Error,
        2001,
        `Type validation failed at ${location}`,
        result.error.issues
      );
    }
    return result;
  }
}

/**
 * @class NexusHost
 * @description Orchestration engine managing flows, middleware, and scoped symbol resolution.
 */
export class NexusHost {
  #symbolTable;
  #typeChecker;
  #reporter = new NexusDiagnosticReporter();
  #flows = new Map();
  #middleware = [];

  constructor(parentSymbolTable = null) {
    this.#symbolTable = new NexusSymbolTable(parentSymbolTable);
    this.#typeChecker = new NexusTypeChecker(this.#reporter);
  }

  use(middlewareFn) {
    this.#middleware.push(middlewareFn);
    return this;
  }

  defineFlow(name, { inputSchema, outputSchema, flags = NexusInternalFlags.None }, logic) {
    this.#symbolTable.declare(name, flags | NexusInternalFlags.Async, {
      input: inputSchema,
      output: outputSchema,
      timestamp: Date.now()
    });

    const wrappedLogic = async (data, token) => {
      token.throwIfCancelled();
      
      if (inputSchema) {
        const inputResult = this.#typeChecker.validate(inputSchema, data, `Flow::${name}::Input`);
        if (!inputResult.success) throw new Error(`Validation Error: ${name} input`);
      }

      const executeMiddleware = async (index, currentInput) => {
        if (index === this.#middleware.length) {
          return await logic(currentInput, token);
        }
        return await this.#middleware[index](currentInput, (nextData) => {
          return executeMiddleware(index + 1, nextData || currentInput);
        }, token);
      };

      const result = await executeMiddleware(0, data);

      if (outputSchema) {
        const outputResult = this.#typeChecker.validate(outputSchema, result, `Flow::${name}::Output`);
        if (!outputResult.success) throw new Error(`Validation Error: ${name} output`);
      }

      return result;
    };

    this.#flows.set(name, wrappedLogic);
    this.#reporter.report(NexusDiagnosticCategory.Message, 500, `Symbol Bound: ${name}`);
  }

  async execute(flowName, payload, token = NexusCancellationToken.None) {
    const symbol = this.#symbolTable.resolve(flowName);
    if (!symbol) {
      this.#reporter.report(NexusDiagnosticCategory.Error, 404, `Symbol Not Found: ${flowName}`);
      throw new Error(`Execution Target Missing: ${flowName}`);
    }

    const flow = this.#flows.get(flowName);
    const start = performance.now();

    try {
      const result = await flow(payload, token);
      const duration = performance.now() - start;
      
      this.#reporter.report(NexusDiagnosticCategory.Performance, 800, `Execution Complete: ${flowName}`, [
        { duration, flow: flowName }
      ]);

      return result;
    } catch (error) {
      this.#reporter.report(NexusDiagnosticCategory.Error, 900, `Flow Failure: ${flowName}`, [
        { error: error.message, stack: error.stack }
      ]);
      throw error;
    }
  }

  registerSchema(name, schema) {
    this.#typeChecker.registerSchema(name, schema);
  }

  getDiagnostics() {
    return this.#reporter.getDiagnostics();
  }

  createScopedHost() {
    return new NexusHost(this.#symbolTable);
  }
}