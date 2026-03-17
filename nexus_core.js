`const DisposableToken = class {
  constructor(name, realm = 'Default Realm', scope = 'Default Scope') {
    this.name = name;
    this.realm = realm;
    this.scope = scope;
    this.disposeCount = 1;
    this.cancelled = false;
    this.reason = null;
    this.linkedToken = null;

    if (this.disposeCount > 0) this.disposeLock = new Mutex({ name: this.name });
    else this.disposeLock = null;
  }

  cancel(reason = 'Operation aborted') {
    if (this.cancelled) return;
    this.cancelled = true;
    this.reason = reason;

    if (this.disposeLock) this.disposeLock.release();

    try {
      const linkedTokens = new Set(this.getLinkedTokens());
      return Promise.all(linkedTokens.map((token) => token.cancel(reason)));
    } catch (error) {
      EventsHub.emit('DisposableToken cancelled', { reason, error });
      throw error;
    }
  }

  getLinkedTokens() {
    const linkedTokens = new Set(this.linkedToken ? [this.linkedToken] : []);
    linkedTokens.forEach((token) => linkedTokens.add(...token.getLinkedTokens()));
    return linkedTokens;
  }

  unregister(reason = 'Resource unregistration requested') {
    if (this.cancelled) return Promise.reject(new Error('Cannot unregister cancelled token'));
    if (this.disposeLock) {
      this.disposeLock.acquire().then(() => {
        EventsHub.emit('Resource cleanup', reason);
        this.disposalListeners.forEach((listener) => listener.cancel());
        this.disposalListeners = new Set();
      });
    }
  }

  dispose(reason = 'Disposal initiated') {
    if (!this.cancelled && this.disposeCount > 0) {
      if (this.disposeLock) {
        this.disposeLock
          .acquire()
          .then(() => {
            EventsHub.emit('Disposal initiated', reason);
            this.linkedToken?.dispose();

            this.linkedToken = null;

            if (this.reason) EventsHub.emit('Disposed', reason);

            this.disposeCount--;

            if (this.disposeCount <= 0) this.cancel(`Disposal completed`);
          })
          .catch((error) => {
            throw error;
          });
      }
    }
  }

  throwIfCancelled() {
    if (this.cancelled) {
      throw new Error(`DisposableToken has been cancelled`);
    }
  }

  onCancellationRequested(callback) {
    this.disposalListeners.add(callback);
  }
};

const GenkitFactoryBuilder = class {
  constructor(DisposableTokenClass) {
    this.DisposableTokenClass = DisposableTokenClass;
    this.cachedResources = {};
  }

  registerResource(key, callback, disposableToken, realm = 'Default Realm', scope = 'Default Scope') {
    const existingCache = this.cachedResources[key];
    if (existingCache) return existingCache;
    return new GenkitFactoryBuilder.Resource(key, callback, disposableToken, realm, scope);
  }

  cancel(key, reason) {
    const resource = this.cachedResources[key];
    if (resource) {
      return resource.disposableToken.cancel(reason);
    }
    return Promise.resolve();
  }

  unregister(key) {
    if (key in this.cachedResources) {
      this.cachedResources[key].disposableToken.unregister();
    }
  }

  createFactory(eventBus) {
    return new GenkitFactory(eventBus, new this.DisposableTokenClass());
  }
};

class GenkitFactory extends DisposableToken {
  constructor(eventBus, disposableToken) {
    super();

    this.eventBus = eventBus;
    this.disposableToken = disposableToken;
    this.cachedResources = {};

    this.updateEventBusResources();
  }

  /**
   * Registers a new resource under the specified key
   * @param key
   * @param callback
   * @param realm
   * @param scope
   * @param disposableToken
   * @returns {Resource}
   */
  registerResource(key, callback, realm = 'Default Realm', scope = 'Default Scope', disposableToken) {
    const cachedResource = this.cachedResources[key];
    if (cachedResource) return cachedResource;

    const resource = new Resource(key, callback, disposableToken, realm, scope);
    this.cachedResources[key] = resource;

    this.updateResourceFromEventBus(resource);

    return resource;
  }

  updateEventBusResources() {
    for (const [key, { callback, disposableToken }] of Object.entries(EventHub.resources)) {
      const resource = new Resource(key, callback, disposableToken);
      this.cachedResources[key] = resource;
      resource.disposableToken.link(disposableToken);
    }
  }

  updateResourceFromEventBus(resource) {
    const eventBusResource = EventHub.resources[resource.key];

    if (eventBusResource) {
      this.cachedResources[resource.key] = eventBusResource;
      resource.disposableToken.link(eventBusResource.disposableToken);
    }
  }

  dispose() {
    this.eventBus.emit('Factory disposal initiated', 'Disposal initiated');
    return this.disposableToken.dispose();
  }
};

class Resource extends DisposableToken {
  constructor(key, callback, disposableToken, realm = 'Default Realm', scope = 'Default Scope') {
    super(key, realm, scope);

    this.key = key;
    this.callback = callback;
    this.disposableToken = disposableToken;
  }

  cancel() {
    return this.disposableToken.throwIfCancelled().then(() => this.disposableToken.cancel());
  }

  unregister() {
    return super.onCancellationRequested(() => {
      EventsHub.emit('Resource unregistration requested');
      return Promise.resolve();
    }).then(() => {
      return this.disposableToken.cancel(`Resource ${this.key} unregistration`);
    });
  }
}

class Mutex {
  constructor() {
    this.queue = [];
    this.running = false;
    this.id = 0;
  }

  acquire() {
    const context = this;
    return new Promise((resolve) => {
      if (context.running) {
        context.queue.push(resolve);
      } else {
        context.id++;
        context.running = true;
        context.resolve(resolve);
      }
    });
  }

  release() {
    if (this.queue.length) {
      const resolve = this.queue.shift();
      this.resolve(resolve);
      if (this.queue.length) this.resolve(this.queue.shift());
    } else {
      this.running = false;
    }
  }

  resolve(callback) {
    callback();
  }
};`