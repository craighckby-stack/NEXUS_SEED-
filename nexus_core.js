/**
 * @file nexus_core.js
 * @description Core infrastructure for asynchronous resource management, concurrency control, and lifecycle orchestration.
 */

class IDisposable {
  dispose() {}
}

class NexusDisposableStore {
  constructor() {
    this._toDispose = new Set();
    this._isDisposed = false;
  }

  add(t) {
    if (!t) return t;
    if (this._isDisposed) {
      NexusDisposableStore._cleanup(t);
      return t;
    }
    this._toDispose.add(t);
    return t;
  }

  static _cleanup(t) {
    try {
      if (typeof t.dispose === 'function') t.dispose();
      else if (typeof t === 'function') t();
    } catch (e) {
      console.error('DisposableStore cleanup error:', e);
    }
  }

  dispose() {
    if (this._isDisposed) return;
    this._isDisposed = true;
    for (const item of this._toDispose) {
      NexusDisposableStore._cleanup(item);
    }
    this._toDispose.clear();
  }
}

class NexusCancellationToken {
  static None = Object.freeze(new (class extends NexusCancellationToken {
    constructor() { super(); }
    get isCancellationRequested() { return false; }
    onCancellationRequested() { return { dispose: () => {} }; }
  })());

  constructor() {
    this._onCancellationRequested = null;
    this._isCancelled = false;
    this._reason = undefined;
  }

  get isCancellationRequested() { return this._isCancelled; }
  get reason() { return this._reason; }

  onCancellationRequested(callback, thisArg) {
    if (this._isCancelled) {
      callback.call(thisArg, this._reason);
      return { dispose: () => {} };
    }
    if (!this._onCancellationRequested) {
      this._onCancellationRequested = new NexusEventEmitter();
    }
    return this._onCancellationRequested.event(callback, thisArg);
  }

  throwIfCancelled() {
    if (this.isCancellationRequested) {
      const err = new Error(this._reason || 'Canceled');
      err.name = 'AbortError';
      throw err;
    }
  }
}

class NexusCancellationTokenSource {
  constructor(parent) {
    this._token = new NexusCancellationToken();
    this._parentListener = null;
    if (parent && parent !== NexusCancellationToken.None) {
      this._parentListener = parent.onCancellationRequested(reason => this.cancel(reason));
    }
  }

  get token() { return this._token; }

  cancel(reason = 'Operation cancelled') {
    if (this._token._isCancelled) return;
    this._token._isCancelled = true;
    this._token._reason = reason;
    if (this._token._onCancellationRequested) {
      this._token._onCancellationRequested.fire(reason);
      this._token._onCancellationRequested.dispose();
      this._token._onCancellationRequested = null;
    }
    if (this._parentListener) {
      this._parentListener.dispose();
      this._parentListener = null;
    }
  }

  dispose() {
    this.cancel('Source disposed');
  }
}

class NexusEventEmitter {
  constructor() {
    this._listeners = [];
    this._disposed = false;
  }

  get event() {
    return (callback, thisArg) => {
      const listener = { callback, thisArg };
      this._listeners.push(listener);
      return {
        dispose: () => {
          const idx = this._listeners.indexOf(listener);
          if (idx !== -1) this._listeners.splice(idx, 1);
        }
      };
    };
  }

  fire(data) {
    if (this._disposed) return;
    const queue = [...this._listeners];
    for (const l of queue) {
      try {
        l.callback.call(l.thisArg, data);
      } catch (e) {
        console.error('EventEmitter fire error:', e);
      }
    }
  }

  dispose() {
    this._disposed = true;
    this._listeners = [];
  }
}

class NexusAsyncSemaphore {
  constructor(capacity = 1) {
    this._capacity = capacity;
    this._active = 0;
    this._waiting = [];
  }

  acquire(token = NexusCancellationToken.None) {
    return new Promise((resolve, reject) => {
      if (this._active < this._capacity) {
        this._active++;
        resolve({ dispose: () => this.release() });
        return;
      }

      const entry = { resolve, reject, token };
      const cancellationListener = token.onCancellationRequested((reason) => {
        const idx = this._waiting.indexOf(entry);
        if (idx !== -1) {
          this._waiting.splice(idx, 1);
          reject(new Error(`Semaphore acquisition cancelled: ${reason}`));
        }
      });

      entry.cancellationListener = cancellationListener;
      this._waiting.push(entry);
    });
  }

  release() {
    this._active--;
    if (this._waiting.length > 0 && this._active < this._capacity) {
      const next = this._waiting.shift();
      if (next.cancellationListener) next.cancellationListener.dispose();
      this._active++;
      next.resolve({ dispose: () => this.release() });
    }
  }
}

class NexusAsyncMutex extends NexusAsyncSemaphore {
  constructor(id) {
    super(1);
    this.id = id;
  }

  async runExclusive(task, token) {
    const lock = await this.acquire(token);
    try {
      return await task();
    } finally {
      lock.dispose();
    }
  }
}

class NexusDisposable {
  constructor(name) {
    this.name = name;
    this._store = new NexusDisposableStore();
    this._isDisposed = false;
  }

  get isDisposed() { return this._isDisposed; }

  _register(obj) {
    return this._store.add(obj);
  }

  dispose() {
    if (this._isDisposed) return;
    this._isDisposed = true;
    this._store.dispose();
  }
}

class NexusResourceFactory {
  static create(baseFactory, decorators = []) {
    return decorators.reduce((acc, decorator) => decorator(acc), baseFactory);
  }

  static withLogging(factory) {
    return async (disposable, options) => {
      const res = await factory(disposable, options);
      return res;
    };
  }
}

class NexusResourceRegistry extends NexusDisposable {
  constructor() {
    super('NexusResourceRegistry');
    this._resources = new Map();
    this._factories = new Map();
    this._onResourceChanged = this._register(new NexusEventEmitter());
  }

  get onResourceChanged() { return this._onResourceChanged.event; }

  define(type, factoryFn, decorators = []) {
    const decorated = NexusResourceFactory.create(factoryFn, decorators);
    this._factories.set(type, decorated);
  }

  async acquire(type, key, options = {}, token = NexusCancellationToken.None) {
    token.throwIfCancelled();
    const fullKey = `${type}:${key}`;
    let entry = this._resources.get(fullKey);

    if (entry) {
      entry.refCount++;
      return entry.instance;
    }

    const factory = this._factories.get(type);
    if (!factory) throw new Error(`Unknown resource type: ${type}`);

    const resourceStore = new NexusDisposableStore();
    try {
      const instance = await factory(resourceStore, options);
      entry = {
        instance,
        store: resourceStore,
        refCount: 1,
        type,
        key
      };
      this._resources.set(fullKey, entry);
      this._onResourceChanged.fire({ type: 'acquired', type, key });
      return instance;
    } catch (e) {
      resourceStore.dispose();
      throw e;
    }
  }

  async release(type, key) {
    const fullKey = `${type}:${key}`;
    const entry = this._resources.get(fullKey);
    if (!entry) return;

    entry.refCount--;
    if (entry.refCount <= 0) {
      this._resources.delete(fullKey);
      entry.store.dispose();
      this._onResourceChanged.fire({ type: 'released', type, key });
    }
  }

  dispose() {
    for (const entry of this._resources.values()) {
      entry.store.dispose();
    }
    this._resources.clear();
    super.dispose();
  }
}

class NexusLazy {
  constructor(executor) {
    this._executor = executor;
    this._value = undefined;
    this._didRun = false;
  }

  get value() {
    if (!this._didRun) {
      this._value = this._executor();
      this._didRun = true;
    }
    return this._value;
  }

  get hasValue() { return this._didRun; }
}