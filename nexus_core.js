import Registry from './registry.js';
import DisposeMode from './dispose-mode.js';
import Factory from './factory.js';
import DisposeModeWrapper from './dispose-mode-wrapper.js';
import CompositeDisposeMode from './composite-dispose-mode.js';
import Logger from './logger.js';
import EventTarget from './event-target.js';

/**
 * DisposeModeFactory class responsible for creating dispose modes.
 */
class DisposeModeFactory {
  constructor(key, disposeModes) {
    this.key = key;
    this.disposeModes = disposeModes;
    this.logger = new Logger(this.key);
  }

  /**
   * Creates a composite dispose mode.
   * @param {DisposeMode} disposeMode
   * @returns {CompositeDisposeMode}
   */
  static createDisposeModes(disposeMode) {
    return new CompositeDisposeMode(this.key, [disposeMode]);
  }

  /**
   * Injects and registers a factory.
   * @param {Factory} factory
   * @param {DisposeModeWrapper} disposeModeWrapper
   */
  injectAndRegisterFactory(factory, disposeModeWrapper) {
    factory.injectAndRegister(disposeModeWrapper.disposeMode);
    disposeModeWrapper.injectAndRegisterFactory(factory);
  }
}

/**
 * DisposeModeWrapper class serving as an abstraction for dispose modes.
 */
class DisposeModeWrapper {
  constructor(key, disposeMode) {
    this.key = key;
    this.disposeMode = disposeMode;
  }

  /**
   * Injects and registers a factory.
   * @param {Factory} factory
   */
  injectAndRegisterFactory(factory) {
    this.disposeMode.injectAndRegisterFactory(factory);
  }

  /**
   * Adds a disposable to the dispose mode.
   * @param {*} disposable
   */
  addDisposable(disposable) {
    this.disposeMode.addDisposable(disposable);
  }

  /**
   * Notifies observers with a payload.
   * @param {*} payload
   */
  notifyObservers(payload) {
    this.disposeMode.notifyObservers(payload);
  }

  /**
   * Deregisters dispose mode wrapper.
   */
  deregister() {
    this.disposeMode.deregister(this.key);
  }
}

/**
 * DisposeMode class serving as an abstraction for dispose logic.
 */
class DisposeMode {
  constructor(key) {
    this.key = key;
  }

  /**
   * Adds disposable to the dispose mode.
   * @param {*} disposable
   */
  addDisposable(disposable) {}

  /**
   * Removes disposable from the dispose mode.
   * @param {*} disposable
   */
  removeDisposable(disposable) {}

  /**
   * Injects and registers a factory.
   * @param {Factory} factory
   */
  injectAndRegisterFactory(factory) {}

  /**
   * Deregisters dispose mode key.
   * @param {*} key
   */
  deregister(key) {}
}

/**
 * CompositeDisposeMode class extending DisposeMode for multiple modes.
 */
class CompositeDisposeMode extends DisposeMode {
  constructor(key, disposeModes) {
    super(key);
    this.disposeModes = disposeModes;
  }

  /**
   * Adds disposable to the dispose mode.
   * @param {*} disposable
   */
  addDisposable(disposable) {
    this.disposeModes.forEach((disposeMode) => disposeMode.addDisposable(disposable));
  }

  /**
   * Removes disposable from the dispose mode.
   * @param {*} disposable
   */
  removeDisposable(disposable) {
    this.disposeModes.forEach((disposeMode) => disposeMode.removeDisposable(disposable));
  }

  /**
   * Injects and registers a factory.
   * @param {Factory} factory
   */
  injectAndRegisterFactory(factory) {
    this.disposeModes.forEach((disposeMode) => disposeMode.injectAndRegisterFactory(factory));
  }

  /**
   * Deregisters dispose mode key.
   * @param {*} key
   */
  deregister(key) {}
}

/**
 * Factory class responsible for creating instances.
 */
class Factory {
  constructor(key, classToWrap, eventTarget, context) {
    this.key = key;
    this.classToWrap = classToWrap;
    this.eventTarget = eventTarget;
    this.context = context;
  }

  /**
   * Injects a dependency.
   */
  inject() {}

  /**
   * Registers the factory with disposal modes.
   * @param {DisposeMode} disposeMode
   */
  injectAndRegister(disposeMode) {}

  /**
   * Creates an instance of the wrapped class.
   */
  createInstance() {
    return new this.classToWrap(this.eventTarget, this.context);
  }
}

/**
 * EventTarget class for providing event target functionality.
 */
class EventTarget {
  constructor() {}
}

/**
 * GenkiFactory class extending the Factory class for Genki.
 */
class GenkiFactory extends Factory {
  createInstance() {
    const instance = super.createInstance();
    instance.initialize(this.context);
    return instance;
  }

  initialize(context) {
    // Implementation for initialization.
  }
}

/**
 * Disposable class serving as a base class for disposables.
 */
class Disposable {
  constructor() {}
}

/**
 * CompositeDisposable class extending Disposable for multiple disposables.
 */
class CompositeDisposable extends Disposable {
  constructor(...disposables) {
    super();
    this.disposables = disposables;
  }

  deregister() {
    this.disposables.forEach((disposable) => disposable.deregister());
  }
}

class Registry {}

class Logger {
  constructor(key) {
    this.key = key;
  }

  log(message) {
    console.log(`[${this.key}] ${message}`);
  }
}

class Nexus extends Disposable {
  constructor(disposeMode = new CompositeDisposeMode('default-mode', [])) {
    super();
    this.disposeMode_ = disposeMode;
    this.factories_ = new WeakMap();
    this.disposables_ = new WeakMap();
    this.registry_ = new Registry();
    this.logger = new Logger('Nexus');
  }

  registerFactory(factory) {
    this.factories_.set(factory, factory);
    this.disposeMode_.injectAndRegisterFactory(factory);
    this.logger.log('Factory registered successfully');
  }

  unregisterFactory(factory) {
    if (this.factories_.has(factory)) {
      this.disposeMode_.deregister(factory.key);
      this.factories_.delete(factory);
      this.logger.log('Factory unregistered successfully');
    }
  }

  registerDisposable(disposable) {
    this.disposables_.set(disposable.key, disposable);
    this.disposeMode_.addDisposable(disposable);
    this.logger.log('Disposable registered successfully');
  }

  unregisterDisposable(disposable) {
    this.disposeMode_.removeDisposable(disposable);
    this.logger.log('Disposable unregistered successfully');
  }

  getDisposable(disposableName) {
    return this.disposables_.get(disposableName);
  }

  getFactory(factoryName) {
    return this.factories_.get(factoryName);
  }
}