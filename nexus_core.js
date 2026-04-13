VOTING FOR: Google/Genkit 's  Lifecycle and Config System - in this case genkit's builder pattern.

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

class NexusCore {
  #state = {
    status: "INIT",
    lifecycle: {}
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
    if (await this.validateConfig(config)) {
      const event = this.lifecycleEvents.get("CONFIGURED");
      if (!event) {
        this.lifecycleEvents.set("CONFIGURED", new LifecycleEvent("CONFIGURED", async () => {
          this.#state.lifecycle.configured = true;
          this.config = config;
        }));
      }
      const handler = this.lifecycleEvents.get("CONFIGURED").handler;
      this.lifecycleEvents.set("CONFIGURED", new LifecycleEvent("CONFIGURED", async (target) => {
        await handler.execute(target);
        target.state.lifecycle.configured = true;
        target.config = config;
      }));
      this.lifecycleEvents.get("CONFIGURED").bind(this);
    }
    return config;
  }

  async validateConfig(config) {
    try {
      await jsonSchema.validate(config, Config.configBuilder.schema);
      return true;
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  async executeLifecycleEvent(event) {
    const handler = this.lifecycleEvents.get(event);
    if (handler) {
      await handler.handler.execute(this);
    }
  }

  async onLifecycleEvent(event) {
    const event = this.lifecycleEvents.get(event);
    if (event) {
      await event.handler.execute(this);
    }
  }

  async init() {
    try {
      await this.configure(Config.defaultConfig);
      console.log("Initializing...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Initialized...");
      this.#state.lifecycle.initialized = true;
      await this.onLifecycleEvent("INITIALIZED");
    } catch (e) {
      console.error('Init error:', e);
    }
  }

  async load() {
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#state.lifecycle.loaded = true;
      await this.onLifecycleEvent("LOADED");
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#state.lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#state.lifecycle.shuttingDown = true;
        await this.executeLifecycleEvent("SHUTTING_DOWN");
        console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      }
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
    this.#state.lifecycle = {};
    await this.executeLifecycleEvent("DESTROYED");
  }
}