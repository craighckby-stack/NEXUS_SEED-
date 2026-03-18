import { Disposable, Factory, Inject } from 'meta-react-core';
import { DisposeMode1, DisposeMode2, DisposeModes } from './dispose-modes';
import { GenkiFactoryFactory } from './genki-factory';
import { EventBus } from 'event-bus-js';
import { GenkiLogger } from 'genki-logger';

const logger = new GenkiLogger('nexus-core');

class DisposableFactory extends Disposable {
  private readonly context_;
  private disposeModes_;
  private factories_;

  constructor(name: string, disposeModes_) {
    super(name);
    this.disposeModes_ = disposeModes_;
    this.factories_ = new Map();
    this.context_ = new ContextManager();
  }

  @Inject
  addFactories(disposeModes_) {
    disposeModes_.forEach((disposeMode, key) => {
      const factory = new GenkiFactory(key, disposeMode, this);
      this.registerFactory(factory);
      this.registerDisposeMode(key, disposeMode);
    });
  }

  registerFactory(factory: Factory) {
    this.factories_.set(factory.getKey(), factory);
  }

  registerDisposeMode(key, disposeMode) {
    const wrapper = new DisposeModeWrapper(key, disposeMode, this);
    this.addDisposable(wrapper);
  }
}

class DisposeModeWrapper extends Disposable {
  private readonly disposeMode_;
  private readonly key;
  private readonly context_;
  private readonly eventBus_;

  constructor(key, disposeMode_, context_) {
    super(key);
    this.disposeMode_ = disposeMode_;
    this.key = key;
    this.context_ = context_;
    this.eventBus_ = new EventBus();
  }

  getDisposeMode() {
    return this.disposeMode_;
  }

  notifyObservers(payload) {
    logger.dump(`notifyObservers called with payload: ${payload}`);
    this.context_.notifyObservers(payload);
    this.eventBus_.dispatchEvent({ type: 'disposeModeUpdate', payload });
  }

  addDisposable(disposable) {
    logger.dump(`adding disposable: ${disposable}`);
    this.context_.addDisposable(disposable);
  }
}

class Disposable extends Object {
  constructor(name: string) {
    super();
    this.name = name;
  }

  @Inject
  dispose() {}
}

class Factory extends Disposable {
  private disposable_;
  private readonly context_;

  constructor(key: string, disposeMode_: DisposeMode, context_) {
    super();
    this.disposeMode_ = disposeMode_;
    this.context_ = context_;
  }

  @Inject
  register() {
    this.context_.registerFactory(this);
  }

  getDisposeMode() {
    return this.disposeMode_;
  }

  addDisposable(disposable) {
    logger.dump(`adding disposable: ${disposable}`);
    this.disposeMode_.addDisposable(disposable);
  }

  disposeFactory() {
    this.context_.unregisterFactory(this);
  }
}

class GenkiLogger {
  constructor(name: string) {}

  dump(message: string) {
    console.log(message);
  }
}

class GenkiFactory extends Factory {
  private readonly eventTarget_;

  constructor(key: string, disposeMode_: DisposeMode, context_) {
    super(key, disposeMode_, context_);
    this.eventTarget_ = new EventTarget();
  }

  notifyObservers(payload) {
    logger.dump(`notifyObservers called with payload: ${payload}`);
    this.eventTarget_.dispatchEvent({ type: 'disposeModeUpdate', payload });
    this.disposeMode_.notifyObservers(payload);
  }
}

class GenkiFactoryFactory {
  context_;

  constructor(context_) {
    this.context_ = context_;
  }

  createFactoryInstance(key: string, disposeMode: DisposeMode) {
    return new GenkiFactory(key, disposeMode, this.context_);
  }
}

class ContextManager {
  disposables_;

  constructor() {
    this.disposables_ = new Map();
  }

  registerDisposable(disposable: Disposable) {
    this.disposables_.set(disposable.name, disposable);
  }

  unregisterDisposable(disposableName) {
    const disposable = this.disposables_.get(disposableName);
    if (disposable) {
      this.disposables_.delete(disposableName);
    }
  }

  addDisposable(disposable: Disposable) {
    this.registerDisposable(disposable);
  }
}