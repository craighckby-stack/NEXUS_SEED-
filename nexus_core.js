import { Disposable, Factory, Inject } from 'meta-react-core';
import { DisposeMode1, DisposeMode2, DisposeModes } from './dispose-modes';
import { EventTarget } from 'event-target';
import { GenkiFactoryFactory, GenkiFactory } from './genki-factory';
import { EventBus } from 'event-bus-js';
import { GenkiLogger } from 'genki-logger';

const logger = new GenkiLogger('nexus-core');

class DisposableFactory extends Disposable {
  private readonly context_;
  private readonly disposables_;
  private readonly eventBus_;
  private readonly factories_;
  private readonly observers_;

  constructor(name: string, disposeModes_) {
    super(name);
    this.disposeModes_ = disposeModes_;
    this.factories_ = new Map();
    this.context_ = new ContextManager();
    this.eventBus_ = new EventBus();
    this.observers_ = new Map();

    disposeModes_.forEach((disposeMode, key) => {
      const factory = new GenkiFactory(key, disposeMode, this);
      this.registerFactory(factory, key);
      this.registerDisposeMode(key, disposeMode);
      factory.addObserver(disposeMode.getObserver());
    });

    this.injectAndRegisterFactories();
  }

  @Inject
  injectAndRegisterFactories(disposeModes_) {
    disposeModes_.forEach((disposeMode, key) => {
      const factory = new GenkiFactory(key, disposeMode, this);
      this.registerFactory(factory, key);
      disposeMode.injectAndRegisterFactory(factory);
      factory.addObserver(disposeMode.getObserver());
    });
  }

  registerFactory(factory: Factory, key: string) {
    this.factories_.set(key, factory);
  }

  registerDisposeMode(key, disposeMode) {
    const wrapper = new DisposeModeWrapper(key, disposeMode, this);
    this.addDisposable(wrapper);
  }

  addDisposable(disposable: Disposable) {
    this.disposables_.set(disposable.name, disposable);
    this.context_.addDisposable(disposable);
  }

  notifyObservers(payload) {
    this.observers_.forEach((observer, key) => {
      observer.notify(payload);
    });
  }

  getDisposeMode(key: string) {
    return this.disposeModes_.get(key);
  }

  addFactory(factory: Factory, key: string) {
    this.factories_.set(key, factory);
  }

  getFactory(key: string) {
    return this.factories_.get(key);
  }

  removeFactory(key: string) {
    this.factories_.delete(key);
  }

  registerEventBusTarget(target, bus) {
    const oldDispatch = target.dispatchEvent || emptyFunction;
    const newDispatch = (...args) => {
      oldDispatch.apply(target, args);
      bus.dispatchEvent({ ...args[0], key: this.disposeModes_.get(args[0].key).key });
    };
    Object.assign(target, { dispatchEvent: newDispatch });
  }
}

class DisposeModeWrapper extends Disposable {
  private readonly disposeMode_;
  private readonly disposeModeKey;
  private readonly context_;
  private readonly eventBus_;

  constructor(key, disposeMode_, context_) {
    super(key);
    this.disposeMode_ = disposeMode_;
    this.disposeModeKey = key;
    this.context_ = context_;
    this.eventBus_ = new EventBus();
  }

  getObserver() {
    const observer = {
      notify(payload) {
        this.context_.notifyObservers(payload);
        this.eventBus_.dispatchEvent({ type: 'disposeModeUpdate', payload });
      },
    };
    return observer;
  }

  injectAndRegisterFactory(factory) {
    factory.injectAndRegister(this.disposeMode_);
  }

  addDisposable(disposable) {
    this.context_.addDisposable(disposable);
  }

  notifyObservers(payload) {
    this.context_.notifyObservers(payload);
    this.eventBus_.dispatchEvent({ type: 'disposeModeUpdate', payload });
  }
}

class Factory extends Disposable {
  private readonly disposeMode_;
  private readonly context_;
  private readonly eventTarget_;

  constructor(key: string, disposeMode_, context_) {
    super();
    this.disposeMode_ = disposeMode_;
    this.context_ = context_;
    this.eventTarget_ = new EventTarget();
  }

  @Inject
  register() {
    this.disposables_.addDisposable(this);
  }

  @Inject
  addObserver(observer) {
    this.observers_.set(observer.name, observer);
  }

  getDisposeMode() {
    return this.disposeMode_;
  }

  addDisposable(disposable) {
    this.disposables_.addDisposable(disposable);
    this.disposeMode_.addDisposable(disposable);
  }

  disposeFactory() {
    this.context_.unregisterFactory(this);
  }

  destroy() {
    this.eventTarget_.dispatchEvent({ type: 'dispose', key: this.disposeMode_.getKey() });
  }

  injectAndRegister(disposeMode) {
    this.disposeMode_.injectAndRegisterFactory(this);
  }
}

class DisposeModes extends Map {
  get(key: string) {
    const disposeMode = super.get(key);
    if (disposeMode) {
      return disposeMode;
    } else {
      return new DisposeModeWrapper(key, new DisposeMode1());
    }
  }
}

class Disposable implements Disposable {
  dispose() {}
}

class ContextManager extends Disposable {
  private readonly disposables_;
  private readonly eventBus_;
  private readonly factories_;

  constructor() {
    super();
    this.disposables_ = new Set();
    this.eventBus_ = new EventBus();
    this.factories_ = new Map();
  }

  addDisposable(disposable: Disposable) {
    this.disposables_.add(disposable);
    disposable.notifyObservers({ type: 'addDisposable', payload: disposable });
  }

  unregisterDisposable(disposableName) {
    this.disposables_.delete(disposableName);
    const disposable = this.disposables_.has(disposableName)
      ? disposable
      : null;
    if (disposable) {
      disposable.dispose();
      this.unregisterFactory(disposable.getFactory());
      disposable.notifyObservers({ type: 'unregisterDisposable', payload: disposable });
    }
  }

  registerFactory(factory) {
    this.factories_.set(factory.name, factory);
    factory.notifyObservers({ type: 'registerFactory', payload: factory });
  }

  unregisterFactory(factory) {
    const key = factory.name;
    if (key) {
      this.factories_.delete(key);
      factory.notifyObservers({ type: 'unregisterFactory', payload: factory });
    }
  }

  getDisposeMode(key: string) {
    return this.disposeModes_.get(key);
  }

  removeDisposeMode(key: string) {
    this.disposeModes_.delete(key);
  }

  registerDisposeMode(key, disposeMode) {
    this.disposeModes_.set(key, disposeMode);
  }

  registerEventBusTarget(target, bus) {
    const oldDispatch = target.dispatchEvent || emptyFunction;
    const newDispatch = (...args) => {
      oldDispatch.apply(target, args);
      bus.dispatchEvent({ ...args[0], key: this.disposeModes_.get(args[0].key).key });
    };
    Object.assign(target, { dispatchEvent: newDispatch });
  }

  notifyObservers(payload) {
    this.disposables_.forEach((disposable) => {
      disposable.notifyObservers(payload);
    });
  }
}

class GenkiFactoryFactory extends Factory {
  createFactoryInstance(key: string, disposeMode: DisposeMode) {
    const factory = super.createFactoryInstance(key, disposeMode);
    this.context_.registerFactory(factory, key);
    return factory;
  }
}

class DisposeMode1 {
  getObserver() {
    const observer = {
      notify(payload) {
        this.context_.notifyObservers(payload);
      },
    };
    return observer;
  }

  notifyObservers(payload) {
    const observer = this.getObserver();
    observer.notify(payload);
  }
}

class DisposeModeWrapper extends Disposable {
  private readonly disposeMode_;
  private readonly context_;
  private readonly eventBus_;

  constructor(key, disposeMode_, context_) {
    super(key);
    this.disposeMode_ = disposeMode_;
    this.context_ = context_;
    this.eventBus_ = new EventBus();
  }

  getObserver() {
    const observer = {
      notify(payload) {
        this.context_.notifyObservers(payload);
        this.disposeMode_.notifyObservers(payload);
      },
    };
    return observer;
  }

  injectAndRegisterFactory(factory) {
    factory.injectAndRegister(this.disposeMode_);
  }

  addDisposable(disposable) {
    this.context_.addDisposable(disposable);
  }

  notifyObservers(payload) {
    this.context_.notifyObservers(payload);
    this.disposeMode_.notifyObservers(payload);
  }
}