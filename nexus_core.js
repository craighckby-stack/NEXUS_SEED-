class Config {
  static get staticConfig() {
    return Object.freeze({
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    });
  }

  constructor(values = {}) {
    this.merge(values);
  }

  merge(values) {
    Object.assign(this, values);
  }

  static get defaultConfig() {
    return Object.freeze({
      foo: 'bar',
      baz: true
    });
  }

  static get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      }
    };
  }

  validate(validators = [jsonSchema.validate]) {
    try {
      validators.forEach(validator => validator(this, Config.configSchema));
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }
}

class AbstractLifecycleEvent {
  constructor(event, handler) {
    this.handler = handler;
  }

  bind(target = this, event = this.event) {
    return this;
  }

  execute() {
    return this.handler(target);
  }
}

class LifecycleEvent extends AbstractLifecycleEvent {
  constructor(handler, event) {
    super(event, handler.bind(this));
  }
}

class LifecycleHandler {
  constructor(handler) {
    this.handler = handler;
  }

  bind(target = this) {
    this.handler = this.handler.bind(target);
  }

  execute(target) {
    return this.handler(target);
  }
}

class NexusCore {
  #state = {
    status: "INIT",
    lifecycle: {
      configured: false,
      loaded: false,
      shuttingDown: false
    }
  };

  get state() {
    return this.#state;
  }

  static get lifecycle() {
    return ["CONFIGURED", "LOADED", "SHUTTING_DOWN"];
  }

  get status() {
    return this.#state.status;
  }

  set status(value) {
    this.#state.status = value;
    const currentState = this.#state.status;
    const lifecycle = this.#state.lifecycle;
    if (value !== 'INIT') {
      console.log(`NexusCore instance is ${value}.`);
      if (value === 'SHUTDOWN') {
        lifecycle.shuttingDown = false;
      }
    }
    if (currentState === 'INIT' && value !== 'INIT') {
      lifecycle.configured = true;
    }
  }

  async configure(config) {
    if (await this.validateConfig(config)) {
      await this.onLifecycleEvent("CONFIGURED");
      this.#state.lifecycle.configured = true;
      this.config = config;
    }
    return config;
  }

  async validateConfig(config) {
    try {
      await jsonSchema.validate(config, Config.configSchema);
      return true;
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  async onLifecycleEvent(event) {
    const lifecycleHandler = new LifecycleHandler(async (target) => {
      target.#state.lifecycle[event] = new LifecycleEvent(async (target) => {
        return await target.#state.lifecycle[event].execute(target);
      }, event);
    });
    this.#state.lifecycle[event] = lifecycleHandler.execute(this);
  }

  on(event, handler) {
    const lifecycleEvent = new LifecycleEvent(handler, event);
    this.onLifecycleEvent(event);
  }

  async executeLifecycleEvent(event) {
    if (this.#state.lifecycle[event]) {
      const handler = this.#state.lifecycle[event];
      this.#state.lifecycle[event] = await handler.execute(this);
    }
  }

  get on() {
    return async (event, handler) => {
      await this.onLifecycleEvent(event);
    };
  }

  async load() {
    try {
      await this.executeLifecycleEvent("CONFIGURED");
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#state.lifecycle.loaded = true;
      await this.executeLifecycleEvent("LOADED");
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
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
  }

  async destroy() {
    this.state.status = "DESTROYED";
    this.#state.lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
  }
}

const jsonSchema = require('jsonschema');
const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();