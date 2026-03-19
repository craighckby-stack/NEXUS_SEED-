// nexus_core.js
import Registry from './registry.js';
import DisposeMode from './dispose-mode.js';
import Factory from './factory.js';
import DisposeModeWrapper from './dispose-mode-wrapper.js';

class Nexus extends Disposable {
  constructor(disposeMode) {
    super();
    this.disposeMode_ = disposeMode;
    this.factories_ = new WeakMap();
    this.disposables_ = new WeakMap();
    this.registry_ = new Registry();
    this.disposeModes_ = DisposeModeFactory.createDisposeModes(disposeMode);
  }

  registerFactory(factory) {
    this.factories_.set(factory, factory);
    this.registry_.registerFactory(factory);
    this.disposeModes_.forEach(() => factory.injectAndRegister(this.disposeMode_));
  }

  unregisterFactory(factory) {
    if (this.factories_.has(factory)) {
      this.registry_.unregisterFactory(factory);
      this.disposeModes_.forEach(() => {
        factory.injectAndRegister(this.disposeMode_);
      });
    }
  }

  registerDisposable(disposable) {
    this.disposables_.set(disposable, disposable);
    this.disposeModes_.forEach(() => this.disposeMode_.addDisposable(disposable));
  }

  unregisterDisposable(disposable) {
    this.disposeModes_.forEach(() => this.disposeMode_.removeDisposable(disposable));
  }

  getDisposable(disposableName) {
    return this.disposables_.get(disposableName);
  }

  getFactory(factoryName) {
    return this.factories_.get(factoryName);
  }
}

class DisposeModeFactory {
  constructor(key, disposeModes) {
    this.key = key;
    this.disposeModes = disposeModes;
  }

  static createDisposeModes(disposeMode) {
    return new CompositeDisposeMode(this.key, [disposeMode]);
  }
}

class DisposeModeWrapper {
  constructor(key, disposeMode) {
    this.key = key;
    this.disposeMode = disposeMode;
  }

  injectAndRegisterFactory(factory) {
    factory.injectAndRegister(this.disposeMode);
  }

  addDisposable(disposable) {
    this.disposeMode.addDisposable(disposable);
  }

  notifyObservers(payload) {
    this.disposeMode.notifyObservers(payload);
  }
}

class GenkiFactory extends Factory {
  constructor(key, disposeMode, context, eventTarget) {
    super(key, disposeMode, context, eventTarget);
    this.disposeMode_ = disposeMode;
  }

  register() {
    this.notifyObservers({ type: 'registerFactory', payload: this });
  }

  getDisposeMode() {
    return this.disposeMode_;
  }

  addDisposable(disposable) {
    this.context_.addDisposable(disposable);
  }
}

// nexus_config.js

class NexusConfig {
  constructor() {
    this.disposeModes_ = [new DisposeModeWrapper("mode-1", new CompositeDisposeMode("mode-1", []))];

    this.disposeModesFactory_ = new DisposeModeFactory("factory-1", this.disposeModes_);
  }

  getDisposeModeFactory() {
    return this.disposeModesFactory_;
  }

  getDisposeModes() {
    return this.disposeModes_;
  }

  getGenkiFactory(classToWrap) {
    return new GenkiFactory("factory-1", new CompositeDisposeMode("factory-1", []), this, new EventTarget());
  }

  getNexus(classToWrap) {
    return new Nexus(new CompositeDisposeMode("factory-1", []), classToWrap);
  }
}

// Example usage

class Service {}

class ServiceFactory extends Factory {
  constructor(classToWrap, eventTarget, context) {
    super("service-factory", classToWrap, eventTarget, context);
  }
}