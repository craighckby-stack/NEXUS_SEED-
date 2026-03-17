/**
 * @file nexus_core.js
 * @version 8.0.0
 * @description Task orchestrator implementing a Bind-Check-Execute pipeline with symbol resolution, hierarchical cancellation, and diagnostic reporting.
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
  Property: 1 << 2,
  Class: 1 << 3,
  Interface: 1 << 4,
  Async: 1 << 9,
  Flow: 1 << 10,
  Export: 1 << 11,
  Merged: 1 << 12,
  Value: (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3)
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
 * Linked-list for nested diagnostic messages.
 */
export class NexusDiagnosticChain {
  constructor(message, code, category, next = null) {
    this.message = message;
    this.code = code;
    this.category = category;
    this.next = Array.isArray(next) ? next : (next ? [next] : []);
  }

  /**
   * Flattens the recursive chain into a linear array.
   * @returns {Array<Object>}
   */
  flatten() {
    const result = [];
    const stack = [this];
    
    while (stack.length > 0) {
      const node = stack.pop();
      result.push({
        message: node.message,
        code: node.code,
        category: node.category
      });
      if (node.next) {
        for (let i = node.next.length - 1; i >= 0; i--) {
          stack.push(node.next[i]);
        }
      }
    }
    return result;
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
    if (otherToken instanceof NexusCancellationToken && otherToken !== this) {
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
    this.#parentToken = null;
  }
}

/**
 * @class NexusSymbol
 * Named entity supporting declaration merging.
 */
class NexusSymbol {
  constructor(name, flags) {
    this.name = name;
    this.flags = flags;
    this.declarations = [];
    this.valueDeclaration = null;
    this.members = new Map();
    this.parent = null;
  }

  addDeclaration(decl) {
    this.declarations.push(decl);
    if (decl.flags) this.flags |= decl.flags;
    
    if (!this.valueDeclaration && (decl.flags & NexusSymbolFlags.Value)) {
      this.valueDeclaration = decl;
    }

    if (decl.members) {
      for (const [key, sym] of Object.entries(decl.members)) {
        this.members.set(key, sym);
      }
    }
  }

  get isAsync() { return !!(this.flags & NexusSymbolFlags.Async); }
  get isFlow() { return !!(this.flags & NexusSymbolFlags.Flow); }
  get isExported() { return !!(this.flags & NexusSymbolFlags.Export); }
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

  get parent() { return this.#parent; }
  get scopeName() { return this.#scopeName; }

  declare(name, flags, metadata = {}) {
    let sym = this.#symbols.get(name);
    if (sym) {
      sym.addDeclaration(metadata);
      sym.flags |= (flags | NexusSymbolFlags.Merged);
    } else {
      sym = new NexusSymbol(name, flags);
      sym.addDeclaration(metadata);
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

  createChildScope(name) {
    return new NexusSymbolTable(this, name);
  }
}

/**
 * @class NexusDiagnosticReporter
 * Storage and subscription system for diagnostics.
 */
class NexusDiagnosticReporter {
  #diagnostics = [];
  #subscribers = new Set();

  report(category, code, message) {
    const diagnostic = {
      category, 
      code, 
      message, 
      timestamp: performance.now() 
    };
    this.#diagnostics.push(diagnostic);
    for (const sub of this.#subscribers) {
      try { sub(diagnostic); } catch (e) {}
    }
    return diagnostic;
  }

  subscribe(fn) {
    this.#subscribers.add(fn);
    return () => this.#subscribers.delete(fn);
  }

  getErrors() { 
    return this.#diagnostics.filter(d => d.category === NexusDiagnosticCategory.Error); 
  }

  hasErrors() { 
    return this.#diagnostics.some(d => d.category === NexusDiagnosticCategory.Error); 
  }

  clear() { 
    this.#diagnostics = []; 
  }
}