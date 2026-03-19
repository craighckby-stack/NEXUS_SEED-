import { Disposable } from './Disposable';
import { Observer } from './Observer';
import { Disposer } from './Disposer';
import { CompositeDisposable } from './CompositeDisposable';
import { IEventBroker } from './IEventBroker';
import { DefaultEventBroker } from './DefaultEventBroker';
import { IFactory } from './IFactory';
import { DisposableFactory } from './DisposableFactory';
import { DisposeMode } from './DisposeMode';

const eventBroker = new DefaultEventBroker();
eventBroker.on('disposeModeRegistered', ({ disposeMode }) => {
  console.log(`Dispose mode registered: ${disposeMode.constructor.name}`);
});

class DisposeModeFactory {
  private readonly disposeModes = new Map<string, DisposeMode>();

  public getInstance(key: string, disposeModeFactory: DisposeModeFactory): DisposeMode {
    if (!this.disposeModes.has(key)) {
      const disposeMode = new DisposeModeFactoryImpl(key, disposeModeFactory);
      this.disposeModes.set(key, disposeMode);
    }
    return DisposeModeFactory.getSerializedDisposeMode(key);
  }

  public getSerializedDisposeMode(key: string): DisposeMode {
    return this.disposeModes.get(key);
  }

  public registerDisposeMode(key: string, disposeMode: DisposeMode, isGlobal: boolean = false): void {
    const disposeModeMap = {
      disposeMode,
      isGlobal
    };
    this.disposeModes.set(key, disposeModeMap);
    eventBroker.dispatch('disposeModeRegistered', { disposeMode });
  }
}

class DisposeModeFactoryImpl implements DisposeMode {
  private readonly key: string;
  private readonly factory: DisposeModeFactory;
  private readonly disposeMode: DisposeMode;
  private state?: DisposeModeStateType;
  private observers: CompositeDisposable[] = [];

  constructor(key: string, factory: DisposeModeFactory) {
    this.key = key;
    this.factory = factory;
    this.disposeMode = factory.getSerializedDisposeMode(key);
  }

  public enterState(state: DisposeModeStateType): void {
    this.state = state;
    this.observers = [];
    eventBroker.dispatch('disposeModeStateChanged', { key: this.key, state });
  }

  public async init(): Promise<void> {
    eventBroker.on('observerRegistered', this.onObserverRegistered.bind(this));
  }

  public async dispose(): Promise<void> {
    this.observers.forEach(observers => observers.dispose());
  }

  public async observe(observer: Disposable): Promise<void> {
    const newObservers = new CompositeDisposable(observer);
    this.observers.push(newObservers);
  }
}

class Disposer {
  private handlers: Array<() => Promise<void>> = [];

  public register(handler: () => void): void {
    this.handlers.push(handler);
  }

  public async dispose(): Promise<void> {
    for (const handler of this.handlers) {
      await handler();
    }
    this.handlers = [];
  }
}

class FactoryObserver extends Disposable {
  private readonly disposeModeFactory: DisposeModeFactory;
  private readonly key: string;

  constructor(disposeModeFactory: DisposeModeFactory, key: string) {
    super();
    this.disposeModeFactory = disposeModeFactory;
    this.key = key;
  }

  public async dispose(): Promise<void> {
    eventBroker.dispatch('dispose', { key: this.key });
  }
}

class DisposeModeMap {
  private readonly disposeModes = new Map<string, { disposeMode: DisposeMode; isGlobal: boolean }>();

  public async registerDisposeMode(key: string, disposeMode: DisposeMode, isGlobal: boolean = false): Promise<void> {
    if (!this.disposeModes.has(key)) {
      this.disposeModes.set(key, { disposeMode, isGlobal });
      eventBroker.dispatch('disposeModeRegistered', { disposeMode });
    }
  }

  public async deregisterDisposeMode(key: string): Promise<void> {
    const disposeMode = this.disposeModes.get(key);
    if (disposeMode) {
      eventBroker.dispatch('disposeModeDeregistered', { disposeMode });
      this.disposeModes.delete(key);
    }
  }
}

class ObserverRegistry {
  private readonly observerRegistry = new Map<string, CompositeDisposable>();

  public registerObserver(key: string, observer: Disposable): void {
    const existingObservers = this.observerRegistry.get(key);
    if (existingObservers) {
      existingObservers.add(observer);
    } else {
      this.observerRegistry.set(key, new CompositeDisposable(observer));
    }
  }

  public unregisterObserverByDisposeMode(key: string): void {
    this.observerRegistry.delete(key);
  }

  public getObserversForDisposeMode(key: string): CompositeDisposable[] | null {
    const observers = this.observerRegistry.get(key);
    return observers ? Array.from(observers.toArray()) : null;
  }
}

class AsyncContext implements Disposable {
  private readonly asyncOperations: Promise<void>[];
  private readonly observerRegistry: ObserverRegistry;
  private readonly eventBroker: IEventBroker;
  private readonly disposeModes: DisposeMode[] = [];

  constructor(
    private readonly asyncOperations: Promise<void>[],
    private readonly observerRegistry: ObserverRegistry,
    private readonly eventBroker: IEventBroker
  ) {
    this.asyncOperations = asyncOperations;
    this.observerRegistry = observerRegistry;
    this.eventBroker = eventBroker;
  }

  public async invokeObserver(event: string, observer: Disposable): Promise<void> {
    const observers = this.observerRegistry.getObserversForDisposeMode(observer.key);
    if (observers) {
      for await (const o of observers) {
        await o.notify();
      }
    }
  }

  public async onDependenciesInjected(key: string): Promise<void> {
    for await (const observer of this.observerRegistry.getObserversForDisposeMode(key)) {
      await observer.notify();
    }
  }
}

class FactoryBasedNexusCore implements Disposable {
  private readonly disposeModes: DisposeModeMap;
  private readonly asyncContext: AsyncContext;
  private readonly observerRegistry: ObserverRegistry;
  private readonly eventBroker: IEventBroker;

  constructor(
    private readonly initialDisposeModes = new DisposeModeMap(),
    private readonly initialAsyncContext = new AsyncContext([], new ObserverRegistry(), new DefaultEventBroker()),
    private readonly initialObserverRegistry = new ObserverRegistry()
  ) {
    this.disposeModes = initialDisposeModes;
    this.asyncContext = initialAsyncContext;
    this.observerRegistry = initialObserverRegistry;
  }

  public async registerDisposeMode(key: string, disposeMode: DisposeMode, isGlobal: boolean = false): Promise<void> {
    await this.disposeModes.registerDisposeMode(key, disposeMode, isGlobal);
    this.observerRegistry.registerObserver(key, disposeMode);
  }

  public async deregisterDisposeMode(key: string): Promise<void> {
    await this.disposeModes.deregisterDisposeMode(key);
    this.observerRegistry.unregisterObserverByDisposeMode(key);
  }

  public async injectDependencies(): Promise<void> {
    const disposeModeFactories = Array.from(this.disposeModes.disposeModes.values()).map(disposeMode => new DisposeModeFactoryImpl(disposeMode.key, disposeMode.factory));
    const factoryBasedDisposeModes = disposeModeFactories.map(factory => DisposeModeFactory.getInstance(factory.key, factory));
    await this.injectDependenciesUsingObserver(factoryBasedDisposeModes);
  }

  public async injectDependenciesUsingObserver(disposeModes: DisposeMode[]): Promise<void> {
    const eventBrokerDispatch = eventBroker.dispatch.bind(eventBroker);
    for await (const disposeMode of disposeModes) {
      await disposeMode.enterState('DEPENDENCIES_INJECTED');
    }
  }
}

class DefaultEventBroker implements IEventBroker {
  private readonly eventListners = {};

  public on(event: string, callback: Function): void {
    if (!this.eventListners[event]) {
      this.eventListners[event] = [];
    }
    this.eventListners[event].push(callback);
  }

  public dispatch(event: string, payload: any): void {
    if (this.eventListners[event]) {
      this.eventListners[event].forEach(callback => callback(payload));
    }
  }
}