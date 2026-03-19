class AdvancedDisposeModeFactory {
  private disposeModes = new Map<string, DisposeMode>();
  private readonly eventBroker: IEventBroker;
  private readonly observerRegistry: ObserverRegistry;
  private readonly disposeModeFactory: IDisposableFactory;

  constructor(
    eventBroker: IEventBroker,
    observerRegistry: ObserverRegistry,
    disposeModeFactory: IDisposableFactory
  ) {
    this.eventBroker = eventBroker;
    this.observerRegistry = observerRegistry;
    this.disposeModeFactory = disposeModeFactory;
  }

  async getInstance(key: string): Promise<DisposeMode> {
    if (!this.disposeModes.has(key)) {
      const disposeMode = await this.disposeModeFactory.createDisposeMode(key);
      this.disposeModes.set(key, disposeMode);
      this.observerRegistry.registerObserver(key, disposeMode);
    }
    return this.disposeModes.get(key);
  }

  async injectDependencies(disposeModes: DisposeMode[]): Promise<void> {
    const eventBrokerDispatch = this.eventBroker.dispatch.bind(this.eventBroker);
    for (const disposeMode of disposeModes) {
      await disposeMode.enterState('DEPENDENCIES_INJECTED');
      await this.observerRegistry.notifyObserversOnDisposeMode(disposeMode.key);
    }
  }

  async registerDisposeMode(key: string, disposeMode: DisposeMode, isGlobal = false): Promise<void> {
    this.disposeModes.set(key, disposeMode);
    this.observerRegistry.registerObserver(key, disposeMode);
    this.eventBroker.dispatch('disposeModeRegistered', { disposeMode, isGlobal });
  }

  async deregisterDisposeMode(key: string): Promise<void> {
    const disposeMode = this.disposeModes.get(key);
    if (disposeMode) {
      this.disposeModes.delete(key);
      this.observerRegistry.unregisterObserverByDisposeMode(key);
      this.eventBroker.dispatch('disposeModeDeregistered', { disposeMode });
    }
  }
}

class AdaptiveDisposeModeFactory extends AdvancedDisposeModeFactory {
  async createDisposeMode(key: string): Promise<DisposeMode> {
    const disposeMode = new DisposeModeImpl(key, this.disposeModeFactory);
    await disposeMode.init();
    return disposeMode;
  }
}

class DisposeModeImpl implements DisposeMode {
  private readonly key: string;
  private readonly disposeModeFactory: DisposeModeFactory;
  private state?: DisposeModeStateType;
  private readonly observers: CompositeDisposable[] = [];
  private readonly isGlobal: boolean;

  constructor(key: string, disposeModeFactory: DisposeModeFactory) {
    this.key = key;
    this.disposeModeFactory = disposeModeFactory;
  }

  async enterState(state: DisposeModeStateType): Promise<void> {
    this.state = state;
    this.observers = [];
    this.eventBroker.dispatch('disposeModeStateChanged', { key: this.key, state });
  }

  async init(): Promise<void> {
    await this.disposeModeFactory.injectDependencies([this]);
  }

  async dispose(): Promise<void> {
    for (const observer of this.observers) {
      await observer.dispose();
    }
  }

  async observe(observer: Disposable): Promise<void> {
    const newObservers = new CompositeDisposable(observer);
    this.observers.push(newObservers);
  }
}

class ObservableDisposeMode implements DisposeMode {
  private readonly key: string;

  constructor(key: string) {
    this.key = key;
  }
}

class ObserverRegistry {
  private readonly observerRegistry = new Map<string, CompositeDisposable>();

  registerObserver(key: string, observer: Disposable): void {
    const existingObservers = this.observerRegistry.get(key);
    if (existingObservers) {
      existingObservers.add(observer);
    } else {
      this.observerRegistry.set(key, new CompositeDisposable(observer));
    }
  }

  unregisterObserverByDisposeMode(key: string): void {
    this.observerRegistry.delete(key);
  }

  async notifyObserversOnDisposeMode(key: string): Promise<void> {
    const observers = this.observerRegistry.get(key);
    if (observers) {
      await Promise.all(observers.map(observer => observer.notify()));
    }
  }
}

class IEventBroker {
  dispatch(event: string, data: { [key: string]: any }): void;
}

class AsyncContext implements Disposable {
  private readonly asyncOperations: Promise<void>[];
  private readonly observerRegistry: ObserverRegistry;
  private readonly eventBroker: IEventBroker;

  constructor(
    asyncOperations: Promise<void>[],
    observerRegistry: ObserverRegistry,
    eventBroker: IEventBroker
  ) {
    this.asyncOperations = asyncOperations;
    this.observerRegistry = observerRegistry;
    this.eventBroker = eventBroker;
  }
}

interface IDisposableFactory {
  createDisposeMode(key: string): Promise<DisposeMode>;
}

class DisposableDisposeModeFactory implements IDisposableFactory {
  async createDisposeMode(key: string): Promise<DisposeMode> {
    const disposeMode = new DisposeModeImpl(key, this.disposeModeFactory);
    await disposeMode.init();
    return disposeMode;
  }
}

interface DisposeMode {
  enterState(state: DisposeModeStateType): Promise<void>;
  init(): Promise<void>;
  dispose(): Promise<void>;
  observe(observer: Disposable): Promise<void>;
}

abstract class NexusCore implements Disposable {
  protected eventBroker: IEventBroker;
  private asyncOperations: Promise<void>[] = [];
  private registeredDisposables: { [key: string]: Disposable } = {};

  constructor(
    private observerRegistry: ObserverRegistry,
    private asyncContext: AsyncContext,
    eventBroker: IEventBroker = new DefaultEventBroker(),
    disposeModes?: DisposeMode[]
  ) {
    this.eventBroker = eventBroker;
    this.asyncContext = asyncContext;
    this.registerDisposeModes(disposeModes);
  }

  async registerDisposeMode(key: string, disposeMode: DisposeMode, isGlobal = false): Promise<void> {
    this.registerDispose(disposeMode);
    this.eventBroker.dispatch('disposeModeRegistered', { disposeMode, isGlobal });
  }

  async deregisterDisposeMode(key: string): Promise<void> {
    this.deregisterDispose(disposeMode);
  }

  async injectDependencies(disposeModes?: DisposeMode[]): Promise<void> {
    const eventBrokerDispatch = this.eventBroker.dispatch.bind(this.eventBroker);
    for (const disposeMode of disposeModes || this.disposeModes.values()) {
      await disposeMode.enterState('DEPENDENCIES_INJECTED');
      await this.observerRegistry.notifyObserversOnDisposeMode(disposeMode.key);
    }
  }

  registerDisposeModeFactory(disposeModeFactory: DisposeModeFactory): void {
    this.disposeModeFactory = disposeModeFactory;
  }

  private async registerDispose(disposeMode: DisposeMode): Promise<void> {
    const key = disposeMode.key;
    if (!this.registeredDisposables[key]) {
      this.disposeModeFactory.registerDisposeMode(key, disposeMode);
      this.observerRegistry.registerObserver(key, disposeMode);
    } else {
      this.disposeModeFactory.deregisterDisposeMode(key);
      this.observerRegistry.unregisterObserverByDisposeMode(key);
    }
  }

  registerDisposeModes(disposeModes?: DisposeMode[]): void {
    this.disposeModes.clear();
    if (disposeModes) {
      for (const disposeMode of disposeModes) {
        this.registerDispose(disposeMode);
      }
    }
  }
}

abstract class Disposable implements IDisposable {
  dispose(): Promise<void> {
    return Promise.resolve();
  }
}

interface DisposeModeStateType {
  // Add the state type definition here
}

class DefaultEventBroker implements IEventBroker {
  dispatch(event: string, data: { [key: string]: any }): void {
    // dispatch event logic here
  }
}

class CompositeDisposable extends Disposable {
  protected disposables: Disposable[] = [];

  add(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  async dispose(): Promise<void> {
    for (const disposable of this.disposables) {
      await disposable.dispose();
    }
    this.disposables.length = 0;
  }
}