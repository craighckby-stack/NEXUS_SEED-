class NexusCore {
  static VERSION = "1.0.0";
  static _instance;

  _status = "INIT";
  _config = {};
  _loaded = false;

  constructor(config = {}) {
    if (NexusCore._instance) {
      throw new Error("NexusCore instance already exists.");
    }

    this._config = { ...this.constructor.constructor.config, ...config };
    NexusCore._instance = this;
  }

  configure(config = {}) {
    if (this._loaded) {
      throw new Error("Lifecycle: Configure is not supported after loading NexusCore.");
    }

    this._config = { ...this._config, ...config };
    return this;
  }

  load() {
    if (this._loaded) {
      throw new Error("Lifecycle: Load is not supported after shutdown NexusCore.");
    }

    // Add load logic here.
    this._loaded = true;

    return this;
  }

  shutdown() {
    if (!this._loaded) {
      throw new Error("Lifecycle: Shutdown is not supported after load NexusCore.");
    }

    // Add shutdown logic here.
    this._loaded = false;

    return this;
  }

  getStatus() {
    return this._status;
  }

  setStatus(status) {
    this._status = status;
  }
}


Here's a breakdown of the changes:

*   **Instance Management**: The static `_instance` property is used to manage a single instance of `NexusCore`. This is achieved through a constructor check and throw an error if an instance already exists.
*   **Lifecycle Management**: Three lifecycle methods, `configure`, `load`, and `shutdown`, are implemented to encapsulate the core's configuration, loading, and shutdown processes.
*   **Config Encapsulation**: The `_config` property is used to store the instance's configuration, and the `configure` method allows changing it. The config is by default initialized through the constructor and overridden by user-provided configurations.
*   **Loaded Property**: The `_loaded` property tracks whether the core has been loaded or not. This ensures that lifecycle methods operate within their expected lifecycle stages.
*   **Status Encapsulation and Access**: Status is encapsulated within the instance, and both getter and setter methods, `getStatus` and `setStatus` are provided to access it. This helps maintain encapsulation.
*   **Genkit-Inspired Encapsulation**: The design follows Genkit's core principles of encapsulation, where internal state and behavior are exposed only through methods. This approach helps maintain the core's security and ensures predictable behavior.