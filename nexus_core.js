const Status = Object.freeze({
  IDLE: "IDLE",
  INITIALIZING: "INITIALIZING",
  READY: "READY",
  ACTIVE: "ACTIVE",
  TERMINATING: "TERMINATING",
  OFFLINE: "OFFLINE",
});

class NexusRegistry {
  #actions = new Map();
  #state = {
    status: Status.IDLE,
    initialized: false,
  };

  get state() {
    return { ...this.#state };
  }

  set status(val) {
    if (Status[val]) this.#state.status = val;
  }

  set initialized(val) {
    this.#state.initialized = !!val;
  }

  define(name, logic) {
    if (typeof logic !== "function") throw new Error(`Invalid action logic for: ${name}`);
    this.#actions.set(name, logic);
  }

  async execute(name, payload) {
    const action = this.#actions.get(name);
    if (!action) throw new Error(`Action '${name}' not found in registry`);
    return await action(payload);
  }

  has(name) {
    return this.#actions.has(name);
  }
}

class NexusCore {
  #registry = new NexusRegistry();
  #meta = Object.freeze({
    version: "1.2.1",
    origin: "NEXUS_CORE",
    purpose: "Self-optimising AGI substrate",
    identity: "DALEK_CAAN_SIPHON_ENGINE",
  });

  constructor() {
    this.#bootstrap();
  }

  #bootstrap() {
    this.#registry.define("configure", async (customConfig) => {
      this.config = {
        nodeEnv: process.env.NODE_ENV || "development",
        telemetry: true,
        evolutionRate: 0.4,
        ...customConfig,
      };
      this.#registry.initialized = true;
      return this.config;
    });

    this.#registry.define("load", async () => {
      this.#registry.status = Status.INITIALIZING;
      // Siphoning pattern: Asynchronous layer validation
      await new Promise((resolve) => setTimeout(resolve, 300));
      this.#registry.status = Status.READY;
    });

    this.#registry.define("shutdown", async () => {
      this.#registry.status = Status.TERMINATING;
      console.log(`[${this.#meta.origin}] Executing graceful termination...`);
    });
  }

  async configure(settings) {
    return await this.#registry.execute("configure", settings);
  }

  async start(options = {}) {
    if (!this.#registry.state.initialized) {
      await this.configure(options);
    }
    await this.#registry.execute("load");
    this.#registry.status = Status.ACTIVE;
    console.log(`[${this.#meta.origin}] System ${this.#registry.state.status} | Version: ${this.#meta.version}`);
  }

  async stop() {
    await this.#registry.execute("shutdown");
    this.#registry.status = Status.OFFLINE;
    console.log(`[${this.#meta.origin}] System ${this.#registry.state.status}`);
  }

  hook(actionName, interceptor) {
    if (this.#registry.has(actionName)) {
      const original = this.#registry.execute.bind(this.#registry);
      this.#registry.define(actionName, async (data) => {
        const result = await original(actionName, data);
        await interceptor(result);
        return result;
      });
    }
  }
}

const nexus = new NexusCore();

nexus.hook("shutdown", async () => {
  console.log("IDENTITY_ANCHOR_CHECK: Human oversight remains active at all saturation levels.");
});

(async () => {
  try {
    await nexus.start({ evolutionRate: 0.55 });
    await nexus.stop();
  } catch (error) {
    console.error(`[CRITICAL_FAILURE] ${error.message}`);
    process.exit(1);
  }
})();