class GenkiNexusCoreFactoryEvolutor extends EventDispatcher {
  private readonly disposables: Map<string, GenkiDisposableStoreFactory>;
  private readonly eventBus: EventBus;

  constructor(
    disposables: Map<string, GenkiDisposableStoreFactory>,
    eventBus: EventBus,
  ) {
    super();
    this.disposables = disposables;
    this.eventBus = eventBus;
  }

  async getDisposableStoreFactoryWithStrategies(disposeMode: DisposeMode, options?: Options): Promise<GenkiDisposableStoreFactory> {
    const strategyFactory = this.disposables.get(CancelationStrategyFactoryName);
    const configFactory = await this.createConfigFactory(disposeMode, options);

    if (this.disposables.has(disposeMode.toString())) {
      return this.disposables.get(disposeMode.toString());
    } else {
      return this.createGenkiDisposableStoreFactory(disposeMode, options, strategyFactory, configFactory);
    }
  }

  private async createGenkiDisposableStoreFactory(
    disposeMode: DisposeMode,
    options?: Options,
    strategyFactory: CancelationStrategyFactory,
    configFactory: GenkiDisposableStoreFactory,
  ): Promise<GenkiDisposableStoreFactory> {
    const strategy = strategyFactory.getFactory(CancellationStrategyName);
    const config = configFactory.getFactory(DisposableStoreConfigName);

    const genkiDisposableStoreFactory = new GenkiDisposableStoreFactory(strategy, disposeMode, options, this.eventBus);

    this.disposables.set(disposeMode.toString(), genkiDisposableStoreFactory);

    return genkiDisposableStoreFactory;
  }

  private async createConfigFactory(
    disposeMode: DisposeMode,
    options?: Options,
  ): Promise<GenkiDisposableStoreFactory> {
    const configFactory = new GenkiDisposableStoreFactory(
      new CancelationStrategyFactory(disposeMode,
        this.disposables,
      ),
      disposeMode,
      options,
      this.eventBus,
    );

    return configFactory;
  }

  async getDisposableStoreObserver(
    disposalStore: DisposableStore,
  ): Promise<DisposableStoreObserver> {
    const genkiDisposableStoreObserver = new GenkiDisposableStoreObserver(disposalStore, this.eventBus);

    await this.subscribe(genkiDisposableStoreObserver);

    return genkiDisposableStoreObserver;
  }

  async initializeNexusCoreFactoryEvolutor(): Promise<void> {
    const allStrategyFactories = await this.eventBus.subscribe(StrategiesEventName);

    allStrategyFactories.forEach((factory) => {
      const strategy = factory.getFactory(CancellationStrategyName);
      this.disposables.set(DisposeMode.TRANSACTIONAL_MODE.toString(), new GenkiDisposableStoreFactory(strategy, DisposeMode.TRANSACTIONAL_MODE, null, this.eventBus));
    });
  }

  async createDisposableStore(
    disposeMode: DisposeMode,
    options?: Options,
  ): Promise<DisposableStore> {
    const genkiDisposableStoreFactory = await this.getDisposableStoreFactoryWithStrategies(
      disposeMode,
      options,
    );

    return genkiDisposableStoreFactory.getGenkiDisposableStoreAsync(disposeMode, options);
  }

  async dispose(): Promise<void> {
    for (const genkiDisposableStoreFactory of this.disposables.values()) {
      await genkiDisposableStoreFactory.disposeGenkiStores();
    }
  }

  async observeDispose(): Promise<void> {
    for (const genkiDisposableStoreFactory of this.disposables.values()) {
      await genkiDisposableStoreFactory.onDisposeGenkiStores();
    }
  }

  async subscribe(listener): Promise<void> {
    this.listeners.set(listener.constructor.name, listener);
  }

  async unsubscribe(listener): Promise<void> {
    this.listeners.delete(listener.constructor.name);
  }

  async emit(event: string): Promise<void> {
    this.listeners.get(event)?.emit();
  }

  async observerDisposalStore(): Promise<void> {
    const genkiDisposableStoreObserver = this.getDisposableStoreObserver(new DisposableStore(new CancelationStrategy(), DisposeMode.TRANSACTIONAL_MODE, null));

    await genkiDisposableStoreObserver.onDisposeGenkiStore();
  }

  async observerDisposalStores(): Promise<void> {
    for (const genkiDisposableStoreFactory of this.disposables.values()) {
      await genkiDisposableStoreFactory.onDisposeGenkiStores();
    }
  }

  async getEventBus(): Promise<EventBus> {
    return this.eventBus;
  }
}

class StoreManager {
  private readonly stores: Map<string, GenkiDisposableStore>;

  constructor() {
    this.stores = new Map();
  }

  async clear(): Promise<void> {
    this.stores.clear();
  }

  getGenkiDisposalStores(): Map<string, GenkiDisposableStore> {
    return this.stores;
  }

  getDisposeMode(options: Options): DisposeMode {
    // Get dispose mode based on options
  }
}

class DisposeMode {
  static TRANSACTIONAL_MODE = new DisposeMode('transactional');
  static BATCH_MODE = new DisposeMode('batch');
  static STREAMING_MODE = new DisposeMode('streaming');
}

class GenkiDisposableStoreFactory implements GenkiDisposable {
  private readonly genkiDisposalStores: Map<string, GenkiDisposableStore>;

  constructor(
    private readonly strategy: CancelationStrategy,
    private readonly disposeMode: DisposeMode,
    private readonly options?: Options,
    private readonly eventBus: EventBus,
  ) {
    this.genkiDisposalStores = new Map();
  }

  async getGenkiDisposableStoreAsync(disposeMode: DisposeMode, options: Options): Promise<GenkiDisposableStore> {
    const cachedGenkiDisposableStore = this.genkiDisposalStores.get(disposeMode.toString());

    if (cachedGenkiDisposableStore) {
      return cachedGenkiDisposableStore;
    }

    const genkiDisposableStore = new GenkiDisposableStore(this.strategy, disposeMode, options);

    this.genkiDisposalStores.set(disposeMode.toString(), genkiDisposableStore);

    return genkiDisposableStore;
  }

  async disposeGenkiStores(): Promise<void> {
    for (const genkiStore of this.genkiDisposalStores.values()) {
      await genkiStore.disposeGenkiStore();
    }
  }

  async onDisposeGenkiStores(): Promise<void> {
    for (const genkiStore of this.genkiDisposalStores.values()) {
      await genkiStore.onDisposeGenkiStore();
    }
  }
}

class GenkiDisposableStore implements GenkiDisposable {
  private disposeMethod: () => Promise<void>;

  constructor(
    private readonly strategy: CancelationStrategy,
    private readonly disposeMode: DisposeMode,
    private readonly options?: Options,
  ) {
    this.disposeMethod = this.disposeGenkiStore;
  }

  async disposeGenkiStore(): Promise<void> {
    // Implement disposal here
  }

  async onDisposeGenkiStore(): Promise<void> {
    // Implement on dispose here
  }
}

class GenkiDisposableStoreObserver {
  private readonly genkiDisposableStore: GenkiDisposableStore;

  constructor(genkiDisposableStore: GenkiDisposableStore, eventBus: EventBus) {
    this.genkiDisposableStore = genkiDisposableStore;
  }

  async onDisposeGenkiStore(): Promise<void> {
    await this.genkiDisposableStore.disposeGenkiStore();
  }
}

interface GenkiDisposable {
  disposeGenkiStores(): Promise<void>;
}

interface Disposable {
  dispose(): Promise<void>;
}