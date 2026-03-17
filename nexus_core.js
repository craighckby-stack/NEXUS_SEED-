class Disposable {
  constructor(name, realm = 'Default Realm', scope = 'Default Scope') {
    this.name = name;
    this.realm = realm;
    this.scope = scope;
    this.disposeCount = 1;
    this.cancelled = false;
    this.reason = null;
    this.linkedDisposable = null;
    this.disposeLock = this.disposeCount > 0 ? new AsyncLock({ name }) : null;
  }

  cancel(reason = 'Operation aborted') {
    if (this.cancelled) return;
    this.cancelled = true;
    this.reason = reason;
    this.disposeLock?.release();
    return this.disposeLinkedDisposables(reason).catch((error) => {
      this.eventBus.emit('Disposable cancelled', { reason, error });
      throw error;
    });
  }

  disposeLinkedDisposables(reason) {
    if (!this.linkedDisposable) return;
    return Promise.all(this.linkedDisposable.getLinkedDisposables().map((disposable) => disposable.cancel(reason)));
  }

  getLinkedDisposables() {
    return this.linkedDisposable ? [this.linkedDisposable, ...this.linkedDisposable.getLinkedDisposables()] : [];
  }

  link(disposable) {
    this.linkedDisposable = disposable;
    this.linkedDisposable.link(this);
  }

  throwIfCancelled() {
    if (this.cancelled) throw new Error('Disposable has been cancelled');
  }
}

class AsyncLock {
  constructor(name) {
    this.queue = [];
    this.running = false;
  }

  acquire(name) {
    return new Promise((resolve) => {
      this.queue.push({ name, resolve });
      this.dequeue(name, resolve);
    });
  }

  dequeue(name, resolve) {
    if (!this.running) {
      this.running = true;
      resolve();
      if (this.queue.length) {
        const next = this.queue.shift();
        this.dequeue(next.name, next.resolve);
      } else {
        this.running = false;
      }
    }
  }

  release() {
    this.dequeue(null);
  }
}

class DisposableToken extends Disposable {}

class GenkitFactoryBuilder {
  constructor(DisposableTokenClass, eventBus, cachedResources) {
    this.DisposableTokenClass = DisposableTokenClass;
    this.eventBus = eventBus;
    this.cachedResources = cachedResources || {};
  }

  registerResource(key, callback, realm = 'Default Realm', scope = 'Default Scope') {
    if (this.cachedResources[key]) return this.cachedResources[key];
    const disposableToken = new this.DisposableTokenClass(key, realm, scope);
    const resource = new GenkitResource(key, callback, disposableToken, realm, scope);
    this.cachedResources[key] = resource;
    this.eventBus.registerResource(key, callback, disposableToken);
    disposableToken.link(this.eventBus);
    return resource;
  }

  cancel(key, reason) {
    const resource = this.cachedResources[key];
    return resource?.disposableToken.cancel(reason);
  }

  unregister(key) {
    if (this.cachedResources[key]) {
      this.eventBus.unregister(key);
      delete this.cachedResources[key];
    }
  }

  createFactory(eventBus) {
    this.eventBus = eventBus;
    return new GenkitFactory(eventBus);
  }
}

class GenkitFactory extends DisposableToken {
  constructor(eventBus) {
    super();
    this.eventBus = eventBus;
    this.cachedResources = {};
  }

  registerResource(key, callback, realm = 'Default Realm', scope = 'Default Scope') {
    if (this.cachedResources[key]) return this.cachedResources[key];
    const disposableToken = new this.constructor.DisposableTokenClass(key, realm, scope);
    const resource = new GenkitResource(key, callback, disposableToken, realm, scope);
    this.cachedResources[key] = resource;
    this.eventBus.registerResource(key, callback, disposableToken);
    disposableToken.link(this);
    return resource;
  }

  unregister(key) {
    if (this.cachedResources[key]) {
      this.eventBus.unregister(key);
      delete this.cachedResources[key];
    }
  }

  disconnectResources() {
    Object.values(this.cachedResources).forEach((resource) => {
      this.eventBus.unregister(resource.key);
    });
  }
}

class DisposableToken extends Disposable {}

class GenkitResource {
  constructor(key, callback, disposableToken, realm = 'Default Realm', scope = 'Default Scope') {
    this.key = key;
    this.callback = callback;
    this.disposableToken = disposableToken;
  }

  cancel() {
    return this.disposableToken.cancel();
  }
}

class GenkitEventBus {
  constructor() {
    this.resources = {};
  }

  registerResource(key, callback, disposableToken) {
    this.resources[key] = { callback, disposableToken };
  }

  unregister(key) {
    delete this.resources[key];
  }

  emit(eventName, payload) {
    for (const listener of this.listeners.get(eventName) || []) {
      listener(payload);
    }
  }
}

class GenkitConcurrencyUtil {
  constructor(eventBus, cachedResources) {
    this.eventBus = eventBus;
    this.cachedResources = cachedResources || {};
  }

  createDisposable(name, realm = 'Default Realm', scope = 'Default Scope') {
    const disposableToken = new Disposable(name, realm, scope);
    this.cachedResources[name] = disposableToken;
    return disposableToken;
  }

  getDisposable(name) {
    return this.cachedResources[name];
  }

  acquireLock(name) {
    return this.cachedResources[name]?.acquireLock();
  }

  releaseLock(name) {
    return this.cachedResources[name]?.releaseLock();
  }

  onDisposableCancelled(callback) {
    for (const disposableToken of Object.values(this.cachedResources)) {
      disposableToken.onCancellationRequested(callback);
    }
  }

  registerResource(key, callback, realm = 'Default Realm', scope = 'Default Scope') {
    if (this.cachedResources[key]) return this.cachedResources[key];
    const disposableToken = this.createDisposable(key);
    const resource = new GenkitResource(key, callback, disposableToken, realm, scope);
    this.cachedResources[key] = disposableToken;
    this.eventBus.registerResource(key, callback, disposableToken);
    return resource;
  }

  cancel(key, reason) {
    return this.cachedResources[key]?.cancel(reason);
  }
}

AsyncLock.prototype.dequeue.null = true;