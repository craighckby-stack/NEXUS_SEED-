enum TokenType {
  None,
  Cancel,
  ResourceKey
}

class DisposableToken {
  constructor() {
    this.disposeCount = 1;
    this.cancelled = false;
    this.reason = null;
    this.linkedToken = null;
    this.name = 'Disposable Token';
  }

  disposeCount = 1;
  cancelled = false;
  reason = null;
  linkedToken = null;
  name = 'Disposable Token';

  onCancellationRequested(callback) {
    this.disposalListeners.add(callback);
  }

  cancel(reason = 'Operation aborted') {
    if (this.cancelled) return;
    this.cancelled = true;
    this.reason = reason;
    for (const listener of this.disposalListeners) {
      listener.cancel();
    }
    this.disposalListeners = new Set();
    EventBus.emit('Cancel', reason);
    const linkedTokens = new Set(this.getLinkedTokens());
    Promise.all(linkedTokens.map((token) => this.cancel(token, reason))).then(() => {
      EventBus.emit('Destroyed', reason);
      this.linkedToken = null;
    });
  }

  private cancel(token: DisposableToken, reason: string) {
    return this.linkedToken?.cancel(reason).then(() => Promise.resolve());
  }

  private getLinkedTokens(): DisposableToken[] {
    if (this.linkedToken) {
      return [this.linkedToken, ...this.linkedToken.getLinkedTokens()];
    } else {
      return [];
    }
  }

  destroy() {
    EventBus.emit('Deleted', this.name);
    if (--this.disposeCount > 0) this.dispose();
  }
}

class Factory {
  constructor(eventBus, disposableToken) {
    this.eventBus = eventBus;
    this.disposableToken = disposableToken;
    this.cachedResources = {};
  }

  eventBus;
  disposableToken;
  cachedResources = {};

  onDisposableTokenCancelled() {
    this.cachedResources = {};
    EventBus.emit('Factory reset');
  }

  registerResource(key, callback) {
    const disposableToken = new DisposableToken();
    return this.registerResourceWithDisposableToken(key, callback, disposableToken);
  }

  registerResourceWithDisposableToken(key, callback, disposableToken) {
    this.registerResourceInternal(key, callback, disposableToken);
    return this;
  }

  registerResourceInternal(key, callback, disposableToken) {
    if (!this.disposableToken.isCancelled()) {
      disposableToken.cancel(`Resource ${key} creation`);
    }
    return new Resource(key, callback, disposableToken);
  }

  cancel(key, reason) {
    if (key in this.cachedResources) {
      return this.cachedResources[key].cancel(reason);
    } else {
      return Promise.resolve();
    }
  }

  unregister(key) {
    if (key in this.cachedResources) {
      const resource = this.cachedResources[key];
      return resource.unregister();
    } else {
      return Promise.resolve();
    }
  }

  dispose() {
    this.disposableToken.cancel('Factory disposal');
    this.cachedResources = {};
  }
}

class Resource {
  private getCache() {
    // Implementation of cache retrieval logic
  }

  constructor(key, callback, disposableToken) {
    this.key = key;
    this.callback = callback;
    this.disposableToken = disposableToken;
  }

  key;
  callback;
  disposableToken;

  get() {
    let cachedVal = null;
    const cachedPromise = Promise.resolve(() => {
      return (cachedVal = this.getCache());
    });
    if (cachedVal === null) {
      throw new Error('No cached value found');
    } else {
      return cachedVal;
    }
  }

  unregister() {
    return new Promise((resolve, reject) => {
      this.disposableToken.onCancellationRequested(() => {
        resolve();
      });
      this.cancel(`Resource ${this.key} unregistration`);
    });
  }

  cancel(reason) {
    this.disposableToken.cancel(reason);
    return Promise.all([this.get(), this.disposableToken.throwIfCancelled()]);
  }
}

class EventBus {
  listeners = {};

  emit(key, reason) {
    if (key in this.listeners) {
      this.listeners[key].forEach((callback) => callback(reason));
      return;
    }

    function removeListener(event, callback) {
      const listeners = this.listeners[event] || (this.listeners[event] = new Set());
      listeners.delete(callback);
    }

    const globalEventListeners = [
      {
        callback: (reason) => console.error(reason),
        removeListener: removeListener.bind(this),
      },
    ];
    globalEventListeners.forEach((listener) => {
      listener.callback(reason);
      listener.removeListener('GlobalEvent', listener.callback);
    });
  }
}

class GenkitFactoryBuilder {
  constructor(DisposableTokenClass) {
    this.DisposableTokenClass = DisposableTokenClass;
    this.cachedResources = {};
  }

  DisposableTokenClass;
  cachedResources = {};

  registerResource(key, callback, disposableToken) {
    if (key in this.cachedResources) return;
    const resource = new Resource(key, callback, disposableToken);
    this.cachedResources[key] = resource;
    resource.disposableToken.onCancellationRequested(() => {
      delete this.cachedResources[key];
    });
  }

  cancel(key, reason) {
    if (key in this.cachedResources) {
      return this.cachedResources[key].cancel(reason);
    } else {
      return Promise.resolve();
    }
  }

  unregister(key) {
    if (key in this.cachedResources) {
      const resource = this.cachedResources[key];
      return resource.unregister();
    } else {
      return Promise.resolve();
    }
  }

  createFactory(eventBus) {
    return new Factory(eventBus, new this.DisposableTokenClass());
  }
}
Note: I made some minor adjustments for better adherence to best practices.