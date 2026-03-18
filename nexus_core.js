import { Disposable, Factory, Observable } from 'meta-react-core';
import { DisposeMode1, DisposeMode2, DisposeModes } from './dispose-modes';
import { GenkiFactory, GenkiFactoryFactory } from './genki-factory';
import { EventBus, EventTarget } from 'event-bus-js';
import { GenkiLogger } from 'genki-logger';

const log = new GenkiLogger('nexus-core');

class DisposableFactory extends Disposable {
  private readonly disposeModes_: Map<string, DisposeMode>;
  private readonly factories_: Map<string, Factory>;

  constructor(name: string, disposeModes_: Map<string, DisposeMode>) {
    super(name);
    this.disposeModes_ = disposeModes_;
    this.factories_ = new Map();
  }

  addFactories(disposeModes_: Map<string, DisposeMode>) {
    disposeModes_.forEach((disposeMode, key) => {
      const factory = new GenkiFactory(key, disposeMode, this);
      this.registerFactory(factory);
      this.registerDisposeMode(key, disposeMode);
    });
  }

  private registerFactory(factory: Factory) {
    this.factories_.set(factory.getKey(), factory);
  }

  private registerDisposeMode(key: string, disposeMode: DisposeMode) {
    const wrapper = new DisposeModeWrapper(key, disposeMode, this);
    this.addDisposable(wrapper);
  }
}

class DisposeModeWrapper extends Disposable {
  private readonly disposeMode_;
  private readonly context_: DisposableFactory;
  private eventBus_: EventBus;

  constructor(key: string, disposeMode_: DisposeMode, context_: DisposableFactory) {
    super(key);
    this.disposeMode_ = disposeMode_;
    this.context_ = context_;
    this.eventBus_ = new EventBus();
  }

  getDisposeMode(): DisposeMode {
    return this.disposeMode_;
  }

  notifyObservers(payload: any): void {
    log.dump(`notifyObservers called with payload: ${payload}`);
    this.context_.notifyObservers(payload);
    this.eventBus_.dispatchEvent({ type: 'disposeModeUpdate', payload });
  }

  addDisposable(disposable: Disposable): void {
    log.dump(`adding disposable: ${disposable}`);
    this.context_.addDisposable(disposable);
  }
}

class Factory {
  private readonly disposeMode_;
  private readonly context_: DisposableFactory;

  constructor(key: string, disposeMode_: DisposeMode, context_: DisposableFactory) {
    this.disposeMode_ = disposeMode_;
    this.context_ = context_;
  }

  getDisposeMode(): DisposeMode {
    return this.disposeMode_;
  }

  addDisposable(disposable: Disposable): void {
    log.dump(`adding disposable: ${disposable}`);
    this.disposeMode_.addDisposable(disposable);
  }
}

class GenkiFactory extends Disposable {
  private readonly disposeMode_;
  private readonly eventTarget_: EventTarget;

  constructor(key: string, disposeMode_: DisposeMode, context_: DisposableFactory) {
    super(key);
    this.disposeMode_ = disposeMode_;
    this.eventTarget_ = new EventTarget();
    context_.addDisposable(this);
  }

  getDisposeMode(): DisposeMode {
    return this.disposeMode_;
  }

  notifyObservers(payload: any): void {
    log.dump(`notifyObservers called with payload: ${payload}`);
    this.eventTarget_.dispatchEvent({ type: 'disposeModeUpdate', payload });
    const disposeMode = this.getDisposeMode();
    disposeMode.notifyObservers(payload);
  }
}

class GenkiFactoryFactory {
  private context_: DisposableFactory;

  constructor(context_: DisposableFactory) {
    this.context_ = context_;
  }

  createFactoryInstance(key: string, disposeMode: DisposeMode): GenkiFactory {
    return new GenkiFactory(key, disposeMode, this.context_);
  }
}

class Observer {
  private readonly context_: DisposableFactory;

  constructor(context_: DisposableFactory) {
    this.context_ = context_;
  }

  notifyObservers(payload: any): void {
    log.dump(`notifyObservers called with payload: ${payload}`);
    this.context_.notifyObservers(payload);
  }
}