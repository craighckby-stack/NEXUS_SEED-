VOTE: I choose Firebase's " Lifecycle" system for mutation, which includes features such as async/await support for lifecycle events, the ability to bind callbacks to instances, and more robust event handling.

MUTATED CODE:


class Config {
  static get staticConfig() {
    return Object.freeze({
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    });
  }

  configBuilder = new ConfigBuilder();

  constructor(values = {}) {
    this.configSchema = Config.configBuilder.schema;
    this.merge(values);
  }

  merge(values) {
    Object.assign(this, values);
  }

  static get defaultConfig() {
    return Config.configBuilder.build();
  }

  static get configSchema() {
    return Config.configBuilder.schema;
  }
}

class ConfigBuilder {
  constructor() {
    this.schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      }
    };
  }

  setFoo(value) {
    this.schema.properties.foo = { type: 'string', default: value };
    return this;
  }

  setBaz(value) {
    this.schema.properties.baz = { type: 'boolean', default: value };
    return this;
  }

  build() {
    return Object.freeze({
      foo: this.schema.properties.foo.default,
      baz: this.schema.properties.baz.default
    });
  }
}

class LifecycleEvent {
  constructor(event, handler) {
    this.handler = handler;
    this.event = event;
    this.bind(this);
  }

  bind(target) {
    this.handler = this.handler.bind(target);
  }
}

class LifecycleHandler {
  constructor(handler) {
    this.handler = handler;
  }

  async execute(target = null) {
    return await this.handler(target);
  }
}

class Lifecycle {
  constructor() {
    this.events = new Map();
  }

  async on(event, handler) {
    if (this.events.has(event)) {
      console.error(`Event '${event}' already registered`);
      return;
    }
    this.events.set(event, {
      handler: handler,
      instance: this
    });
  }

  async fire(event, instance = null) {
    const eventHandler = this.events.get(event);
    if (eventHandler) {
      if (instance) eventHandler.instance = instance;
      await eventHandler.handler(instance);
    }
  }

  async init() {
    await this.fire('INIT');
  }
}

class NexusCore {
  #state = {
    status: "INIT",
    lifecycle: new Lifecycle(),
    config: Config.defaultConfig
  };

  get state() {
    return this.#state;
  }

  static get lifecycle() {
    return {
      initialized: false,
      configured: false,
      loaded: false,
      shuttingDown: false,
      destroyed: false
    };
  }

  get status() {
    return this.#state.status;
  }

  set status(value) {
    if (this.#state.status !== value) {
      this.#state.status = value;
      console.log(`NexusCore instance is ${value}.`);
    }
  }

  constructor() {
    this.lifecycleEvents = new Map();
  }

  async configure(config) {
    this.#state.config = config;
    await this.lifecycle.on('CONFIGURED', async () => {
      this.#state.lifecycle = new Lifecycle();
      this.#state.lifecycle.configured = true;
    });
  }

  async onLifecycleEvent(event) {
    await this.#state.lifecycle.fire(event, this);
  }

  async init() {
    try {
      await this.lifecycle.init();
      await this.onLifecycleEvent('INIT');
      console.log("Initializing...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Initialized...");
      this.#state.lifecycle.initialized = true;
    } catch (e) {
      console.error('Init error:', e);
    }
  }

  async load() {
    try {
      await this.onLifecycleEvent('LOAD');
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#state.lifecycle.loaded = true;
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      await this.lifecycle.fire('SHUTTING_DOWN');
      console.log("Shutdown initiated...");
      if (!this.#state.lifecycle.shuttingDown) {
        this.#state.lifecycle.shuttingDown = true;
      }
      console.log("Shutdown complete...");
      this.status = "SHUTDOWN";
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  async start() {
    const startMethodOrder = ["init", "load"];
    await this.init();
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
  }

  async destroy() {
    this.#state.lifecycle = new Lifecycle();
    this.#state.lifecycle.destroyed = true;
    await this.#state.lifecycle.fire("DESTROYED", this);
  }
}