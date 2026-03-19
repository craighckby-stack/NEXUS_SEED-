import { Disposable } from './Disposable';
import { Observer } from './Observer';
import { DisposeMode } from './DisposeMode';
import { AsyncContext } from './AsyncContext';

class DisposeModeFactory {
  private disposeModes: DisposeMode[];

  constructor(private disposeModes: DisposeMode[]) {
    this.disposeModes = disposeModes;
  }

  public getInstance(key: string): DisposeMode {
    return new DisposeMode(this.disposeModes, key);
  }
}

class FactorObserver implements Disposable {
  private key: string;

  constructor(private key: string) {
    this.key = key;
  }

  public async notify(): Promise<void> {
    console.log(`Modified Factor Observer: ${this.key} notified`);
  }

  public async dispose(): Promise<void> {
  }
}

class DisposeMode extends FactorObserver implements Disposable {
  private state: DisposeModeStateType;
  private disposeModeFactory: DisposeModeFactory;
  private key: string;

  constructor(private disposeModeFactory: DisposeModeFactory, key: string) {
    super(key);
    this.disposeModeFactory = disposeModeFactory;
    this.state = null;
    this.key = key;
  }

  public async enterState(state: DisposeModeStateType): Promise<void> {
    this.state = state;
  }

  public get disposeModeFactory(): DisposeModeFactory {
    return this.disposeModeFactory;
  }
}

class DisposeModeMap {
  private cache: Map<string, DisposeMode>;

  constructor() {
    this.cache = new Map();
  }

  public async registerDisposeMode(key: string, disposeMode: DisposeMode): Promise<void> {
    if (!this.cache.has(key)) {
      this.cache.set(key, disposeMode);
    }
  }

  public async getDisposeModes(): Promise<DisposeMode[]> {
    return Array.from(this.cache.values());
  }
}

class Disposable {}

class ObserverRegistry {
  private observerRegistry: { [key: string]: Disposable[] };

  constructor() {
    this.observerRegistry = {};
  }

  public registerObserver(observer: Disposable): void {
    const key = observer.key;
    if (!this.observerRegistry[key]) {
      this.observerRegistry[key] = [observer];
    } else {
      this.observerRegistry[key].push(observer);
    }
  }

  public unregisterObserverByDisposeMode(key: string): void {
    delete this.observerRegistry[key];
  }

  public getObserversForDisposeMode(key: string): Disposable[] {
    return this.observerRegistry[key] || [];
  }
}

class AsyncContext implements Disposable {
  private asyncOperations: Promise<void>[];
  private observerRegistry: ObserverRegistry;

  constructor(private asyncOperations: Promise<void>[], private observerRegistry: ObserverRegistry) {
    this.asyncOperations = asyncOperations;
    this.observerRegistry = observerRegistry;
  }

  public async dispatchObservers(observer: Disposable): Promise<void> {
    const observers = this.observerRegistry.getObserversForDisposeMode(observer.key);
    for await (const o of observers) {
      await o.notify();
    }
  }

  public async invokeObserver(event: string, observer: Disposable): Promise<void> {
    this.observerRegistry.registerObserver(observer);
    if (event === 'DEPENDENCIES_INJECTED') {
      await this.dispatchObservers(observer);
    }
  }
}

class FactoryBasedNexusCore implements Disposable {
  private readonly disposeModes: DisposeModeMap;
  private readonly asyncContext: AsyncContext;
  private readonly observerRegistry: ObserverRegistry;

  constructor(private initialDisposeModes: DisposeModeMap = new DisposeModeMap(),
              private initialAsyncContext: AsyncContext = new AsyncContext([], new ObserverRegistry()),
              private initialObserverRegistry: ObserverRegistry = new ObserverRegistry()) {
    this.disposeModes = initialDisposeModes;
    this.asyncContext = initialAsyncContext;
    this.observerRegistry = initialObserverRegistry;
  }

  public getInstance(initialDisposeModes: DisposeModeMap = this.disposeModes,
                     initialAsyncContext: AsyncContext = this.asyncContext,
                     initialObserverRegistry: ObserverRegistry = this.observerRegistry): FactoryBasedNexusCore {
    return new FactoryBasedNexusCore(initialDisposeModes, initialAsyncContext, initialObserverRegistry);
  }

  public async registerDisposeMode(key: string, disposeMode: DisposeMode): Promise<void> {
    await this.disposeModes.registerDisposeMode(key, disposeMode);
    this.observerRegistry.registerObserver(disposeMode);
  }

  public async deregisterDisposeMode(key: string): Promise<void> {
    await this.disposeModes.deregisterDisposeMode(key);
    this.observerRegistry.unregisterObserverByDisposeMode(key);
  }

  public async injectDependencies(): Promise<void> {
    const disposeModeFactories: DisposeModeFactory[] = Array.from(this.disposeModes.cache.values()).map(disposeMode => new DisposeModeFactory([disposeMode]));
    const factoryBasedDisposeModes = disposeModeFactories.map(factory => factory.getInstance());
    await this.injectDependenciesUsingObserver(factoryBasedDisposeModes);
  }

  public async injectDependenciesUsingObserver(disposeModes: DisposeMode[]): Promise<void> {
    for await (const disposeMode of disposeModes) {
      await disposeMode.enterState('DEPENDENCIES_INJECTED');
      await this.asyncContext.invokeObserver('DEPENDENCIES_INJECTED', disposeMode);
    }
  }
}