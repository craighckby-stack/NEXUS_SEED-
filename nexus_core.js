class NexusCore {
  static VERSION = "1.0.0";

  static #instance;

  #config = {};
  #loaded = false;
  #status = "INIT";

  #configureInternal(config = {}) {
    try {
      if (this.#loaded) {
        throw new Error("Lifecycle: Configure is not supported after loading NexusCore.");
      }
      this.#config = { ...this.#config, ...config };
    } catch (error) {
      this.#status = "ERROR: Configure";
      console.error(error);
    }
  }

  #loadInternal() {
    try {
      if (this.#loaded) {
        throw new Error("Lifecycle: Load is not supported after shutdown NexusCore");
      }

      // Add load logic here.
      this.#loaded = true;
    } catch (error) {
      this.#status = "ERROR: Load";
      console.error(error);
    }
  }

  #shutdownInternal() {
    try {
      if (!this.#loaded) {
        throw new Error("Lifecycle: Shutdown is not supported after load NexusCore");
      }

      // Add shutdown logic here.
      this.#loaded = false;
    } catch (error) {
      this.#status = "ERROR: Shutdown";
      console.error(error);
    }
  }

  static configure(config = {}) {
    if (!NexusCore.#instance) {
      throw new Error("NexusCore instance does not exist.");
    }

    NexusCore.#instance.#configureInternal(config);
  }

  static load() {
    if (!NexusCore.#instance || !NexusCore.#instance.#loaded) {
      throw new Error("Lifecycle: Load is not supported after shutdown NexusCore or NexusCore instance does not exist.");
    }

    NexusCore.#instance.loadInternal();
  }

  static shutdown() {
    if (!NexusCore.#instance || NexusCore.#instance.#loaded) {
      throw new Error("Lifecycle: Shutdown is not supported after load NexusCore or NexusCore instance does not exist.");
    }

    NexusCore.#instance.shutdownInternal();
  }

  static getStatus() {
    if (!NexusCore.#instance) {
      throw new Error("NexusCore instance does not exist.");
    }

    return NexusCore.#instance.#status;
  }

  static setStatus(status) {
    if (!NexusCore.#instance) {
      throw new Error("NexusCore instance does not exist.");
    }

    NexusCore.#instance.#status = status;
  }

  static getInstance() {
    if (NexusCore.#instance) {
      return NexusCore.#instance;
    }
    return null;
  }

  constructor(config = {}) {
    if (NexusCore.#instance) {
      throw new Error("NexusCore instance already exists.");
    }

    this.#config = { ...NexusCore.config, ...config };
    NexusCore.#instance = this;
    this.#configureInternal(config);
  }

  getConfig() {
    return this.#config;
  }
}

NexusCore.config = {};

class NexusCoreImpl extends NexusCore {}