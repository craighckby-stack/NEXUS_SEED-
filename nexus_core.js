class NexusRegistry {
  constructor() {
    this.actions = new Map();
    this.state = {
      status: "IDLE",
      initialized: false,
    };
  }

  defineAction(name, fn) {
    this.actions.set(name, fn);
  }

  async runAction(name, input) {
    const action = this.actions.get(name);
    if (!action) throw new Error(`Action ${name} not defined in NexusRegistry`);
    return await action(input);
  }
}

class NexusCore {
  #registry = new NexusRegistry();
  #context = {
    version: "1.1.0",
    origin: "NEXUS_CORE",
    purpose: "Self-optimising AGI substrate",
  };

  constructor() {
    this.#initializeInternalActions();
  }

  #initializeInternalActions() {
    this.#registry.defineAction("configure", async (config) => {
      this.config = { ...this.defaultConfig, ...config };
      this.#registry.state.initialized = true;
      return this.config;
    });

    this.#registry.defineAction("load", async () => {
      console.log(`[${this.#context.origin}] Loading substrate layers...`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.#registry.state.status = "READY";
    });

    this.#registry.defineAction("shutdown", async () => {
      this.#registry.state.status = "TERMINATING";
      console.log(`[${this.#context.origin}] Safe shutdown sequence active.`);
    });
  }

  get defaultConfig() {
    return {
      nodeEnv: process.env.NODE_ENV || "development",
      telemetry: true,
      evolutionRate: 0.4,
    };
  }

  async configure(values) {
    return await this.#registry.runAction("configure", values);
  }

  async start() {
    if (!this.#registry.state.initialized) {
      await this.configure({});
    }
    await this.#registry.runAction("load");
    this.#registry.state.status = "ACTIVE";
    console.log(`NEXUS_CORE v${this.#context.version} status: ${this.#registry.state.status}`);
  }

  async stop() {
    await this.#registry.runAction("shutdown");
    this.#registry.state.status = "OFFLINE";
  }

  on(event, callback) {
    const originalAction = this.#registry.actions.get(event);
    if (originalAction) {
      this.#registry.defineAction(event, async (input) => {
        const result = await originalAction(input);
        callback(result);
        return result;
      });
    }
  }
}

const nexus = new NexusCore();

nexus.on("shutdown", () => {
  console.log("Identity Anchor: Human oversight remains active at all saturation levels.");
});

(async () => {
  await nexus.configure({ evolutionRate: 0.5 });
  await nexus.start();
  await nexus.stop();
})();