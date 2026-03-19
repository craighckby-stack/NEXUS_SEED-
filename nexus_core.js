// Dispose Mode Factory
class DisposeModeFactory {
  constructor(key, disposeModes, factoryMap) {
    this.key = key;
    this.disposeModes = disposeModes;
    this.factoryMap = factoryMap;
    this.logger = new Logger(this.key);
  }

  static createDisposeMode(key, disposeMode, disposeModeMap = new DisposeModeMap()) {
    const disposeModeInstance = new DisposeMode(key, disposeMode, disposeModeMap)
    return { disposeModeInstance, disposeModeMap };
  }

  static createCompositeDisposeMode(key, disposeModes) {
    const compositeDisposeMode = new CompositeDisposeMode(key, disposeModes);
    return compositeDisposeMode;
  }

  injectAndRegisterFactory(factory, disposeModeWrapper) {
    disposeModeWrapper.disposeModeMap.registerDisposeMode(factory.key, this.disposeModes.find(mode => mode.key === factory.key));
    this.factoryMap.set(factory.key, disposeModeWrapper);
  }

  deregisterDisposeMode(key, disposeModeMap) {
    const disposeMode = this.disposeModes.find(mode => mode.key === key);
    if (disposeMode) {
      disposeModeMap.deregisterDisposeMode(key);
      this.disposeModes.splice(this.disposeModes.indexOf(disposeMode), 1);
    }
  }
}

// Dispose Mode
class DisposeMode {
  constructor(key, notifyObservers, disposeModeMap = new DisposeModeMap()) {
    this.key = key;
    this.notifyObservers = notifyObservers;
    this.disposeModeMap = disposeModeMap;
  }

  addDisposable(disposable) {
    this.disposeModeMap.addDisposable(disposable);
  }

  removeDisposable(disposable) {
    this.disposeModeMap.removeDisposable(disposable);
  }

  deregister() {
    this.disposeModeMap.deregisterDisposeMode(this.key);
    this.disposeModeMap = null;
  }
}

// Composite Dispose Mode
class CompositeDisposeMode extends DisposeMode {
  constructor(key, disposeModes) {
    super(key, () => {
      disposeModes.forEach((disposeMode) => disposeMode.notifyObservers());
    });
    this.disposeModes = disposeModes;
    this.disposeModes.forEach(disposeMode => disposeMode.disposeModeMap = null);
  }

  addDisposable(disposable) {
    this.disposeModes.forEach((disposeMode) => disposeMode.addDisposable(disposable));
  }

  removeDisposable(disposable) {
    this.disposeModes.forEach((disposeMode) => disposeMode.removeDisposable(disposable));
  }
}

// Dispose Mode Map
class DisposeModeMap {
  registerDisposeMode(key, disposeMode) {
    this.disposeModeMap.set(key, disposeMode);
  }

  deregisterDisposeMode(key) {
    this.disposeModeMap.delete(key);
  }

  addDisposable(disposable) {
    this.disposeModeMap.forEach((disposeMode) => disposeMode.addDisposable(disposable));
  }

  removeDisposable(disposable) {
    this.disposeModeMap.forEach((disposeMode) => disposeMode.removeDisposable(disposable));
  }

  getDisposeMode(key) {
    return this.disposeModeMap.get(key);
  }
}

// Factory
class Factory {
  constructor(key, classToWrap, eventTarget, context) {
    this.key = key;
    this.classToWrap = classToWrap;
    this.eventTarget = eventTarget;
    this.context = context;
    this.disposableMap = new WeakMap();
  }

  inject() {}

  createInstance() {
    return new this.classToWrap(this.eventTarget, this.context);
  }

  createFactoryInstance() {
    const factory = new this.classToWrap(this.eventTarget, this.context);
    this.registerFactory(factory);
    return factory;
  }

  registerFactory(factory) {
    this.disposableMap.set(factory.key, factory);
    this.disposeModeMap.registerDisposeMode(factory.key, factory.disposeMode);
  }
}

// Nexus
class Nexus {
  constructor(nexusConfig) {
    this.nexusConfig = nexusConfig;
    this.factories = new WeakMap();
    this.disposableMap = new WeakMap();
    this.disposeMode = new DisposeMode('nexus', () => {});
  }

  registerFactory(factory) {
    factory.disposeMode = this.disposeMode;
    factory.disposableMap = this.disposableMap;
    this.factories.set(factory.key, factory);
    this.disposeModeMap.registerDisposeMode(factory.key, factory.disposeMode);
  }

  unregisterFactory(factory) {
    this.factories.delete(factory.key);
    this.disposeModeMap.deregisterDisposeMode(factory.key);
    factory.disposeMode = null;
  }

  registerDisposable(disposable) {
    this.disposableMap.set(disposable.key, disposable);
  }

  unregisterDisposable(disposable) {
    this.disposableMap.delete(disposable.key);
  }

  getDisposable(key) {
    return this.disposableMap.get(key);
  }

  getFactory(factoryKey) {
    return this.factories.get(factoryKey);
  }
}