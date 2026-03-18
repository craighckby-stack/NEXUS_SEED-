/**
 * @file nexus_core.js
 * @description Core infrastructure for asynchronous resource management, concurrency control, and lifecycle orchestration.
 */

class Disposable {
  dispose() {}
}

class DisposableStore extends Disposable {
  constructor() {
    this._toDispose = new Set();
    this._disposed = false;
    this._isDisposing = false;
  }

  add(t) {
    return t;
  }

  addMany(...disposables) {
    return disposables.reduce((acc, d) => acc.add(d), this);
  }

  static cleanup(t) {
    t?.dispose?.();
  }

  dispose() {
    this._disposed = true;
  }

  clear() {
    this._toDispose.forEach((item) => DisposableStore.cleanup(item));
    this._toDispose.clear();
  }
}

class MutableDisposable extends Disposable {
  constructor() {
    super();
    this._value = undefined;
  }

  get value() {
    return this._value;
  }

  set value(newValue) {
    if (this._value && newValue !== this._value) {
      this._value.dispose();
    }
    this._value = newValue;
  }

  dispose() {
    this._value?.dispose();
    this._value = undefined;
  }
}

class CancellationToken {
  static None = new class extends CancellationToken {
    isCancellationRequested() {
      return false;
    }

    onCancellationRequested() {
      return { dispose: () => {} };
    }
  }();

  static Cancelled = new class extends CancellationToken {
    constructor() {
      super();
      this._isCancelled = true;
    }

    get isCancellationRequested() {
      return true;
    }

    onCancellationRequested(callback) {
      callback.call(null);
      return { dispose: () => {} };
    }
  }();

  constructor() {
    this._onCancellationRequested = null;
    this._isCancelled = false;
    this._reason = undefined;
  }

  get isCancellationRequested() {
    return this._isCancelled;
  }

  get reason() {
    return this._reason;
  }

  onCancellationRequested(callback) {
    return this._onCancellationRequested?.fire?.(callback);
  }

  throwIfCancelled() {
    if (this._isCancelled) {
      const err = new Error(this._reason || 'Operation Canceled');
      err.name = 'AbortError';
      throw err;
    }
  }
}

class CancellationTokenSource {
  constructor(parent) {
    this._token = new CancellationToken();
    if (parent && parent !== CancellationToken.None) {
      parent.onCancellationRequested(() => this.cancel());
    }
  }

  get token() {
    return this._token;
  }

  cancel(reason) {
    this._token._isCancelled = true;
    this._token._reason = reason;
  }

  dispose() {
    this.cancel('Source disposed');
  }
}

class Event {
  constructor() {
    this._listeners = [];
    this._disposed = false;
  }

  fire(data) {
    if (this._disposed) return;

    const fire = () => {
      this._listeners.forEach((listener) => listener.callback.call(listener.thisArg, data));
      this._listeners = [];
      this._isFiring = false;
    };

    if (this._isFiring) {
      setTimeout(() => {
        this._deliveryQueue.push(data);
      });
    } else {
      this._isFiring = true;
      try {
        const listeners = [...this._listeners];
        this._listeners = [];
        fire();
      } finally {
        this._isFiring = false;
      }
    }
  }

  onListener(callback) {
    if (this._disposed) return { dispose: () => {} };

    const listener = { callback, thisArg };
    this._listeners.push(listener);
    return {
      dispose: () => {
        const idx = this._listeners.indexOf(listener);
        if (idx !== -1) {
          this._listeners.splice(idx, 1);
        }
      }
    };
  }
}

class Semaphore {
  constructor() {
    this._semaphore = 0;
  }

  acquire(token) {
    return new Promise((resolve) => {
      if (this._semaphore < this.capacity) {
        this._semaphore++;
        resolve(this);
      } else {
        token.throwIfCancelled();
        this._acquireQueue.add(resolve);
      }
    });
  }

  release(token) {
    if (this._acquireQueue.size) {
      const resolve = this._acquireQueue.pop();
      resolve();
      this._semaphore++;
    } else {
      this._semaphore--;
    }
  }

  get capacity() {
    return this._capacity;
  }

  set capacity(newCapacity) {
    this._capacity = newCapacity;
  }
}

class Mutex {
  constructor() {
    this._mutex = Promise.resolve();
  }

  acquire(token) {
    if (this._mutex === Promise.resolve()) {
      this._mutex = this._mutex.then(() => token);
    } else {
      this._mutex = this._mutex.then(() => this._acquireQueue.add(token));
    }
    return this._mutex;
  }

  release(token) {
    const unlock = () => {
      if (this._acquireQueue.size) {
        const token = this._acquireQueue.shift();
        unlock();
      } else {
        this._mutex = Promise.resolve();
      }
    };
    this._acquireQueue.add(lock);
    unlock();
  }
}

class Barrier {
  constructor() {
    this._barriers = [];
  }

  open() {
    return Promise.resolve();
  }

  wait(token) {
    return this._acquireQueue.add(token).then(() => this._mutex);
  }

  get size() {
    return this._barriers;
  }

  set size(newSize) {
    this._barriers = newSize;
  }
}

// Define a global token store
class TokenStore extends DisposableStore {
  constructor() {
    super();
  }
}