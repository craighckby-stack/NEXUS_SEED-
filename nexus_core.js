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

  async getDisposableStoreFactoryWithStrategies(
    disposeMode: DisposeMode,
    options?: Options,
  ): Promise<GenkiDisposableStoreFactory> {
    const strategyFactory = this.disposables.get(CancelationStrategyFactoryName);
    const configFactory = await this.createConfigFactory(disposeMode, options);

    if (this.disposables.has(disposeMode.toString())) {
      return this.disposables.get(disposeMode.toString());
    } else {
      return this.createGenkiDisposableStoreFactory(
        disposeMode,
        options,
        strategyFactory,
        configFactory,
      );
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
    const strategyFactory = new CancelationStrategyFactory(
      disposeMode,
      this.disposables,
    );

    const configFactory = new GenkiDisposableStoreFactory(
      strategyFactory.getFactory(CancellationStrategyName),
      disposeMode,
      options,
      this.eventBus,
    );

    return configFactory;
  }

  async getDisposableStoreObserver(
    disposalStore: DisposableStore,
  ): Promise<DisposableStoreObserver> {
    const genkiDisposableStoreObserver = new GenkiDisposableStoreObserver(
      disposalStore,
      this.eventBus,
    );

    await this.subscribe(genkiDisposableStoreObserver);

    return genkiDisposableStoreObserver;
  }

  async initializeNexusCoreFactoryEvolutor(): Promise<void> {
    const allStrategyFactories = await this.eventBus.subscribe(StrategiesEventName);

    allStrategyFactories.forEach((factory) => {
      const strategy = factory.getFactory(CancellationStrategyName);
      this.disposables.set(
        DisposeMode.TRANSACTIONAL_MODE.toString(),
        new GenkiDisposableStoreFactory(strategy, DisposeMode.TRANSACTIONAL_MODE, null, this.eventBus),
      );
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
    const genkiDisposableStoreObserver = this.getDisposableStoreObserver(
      new DisposableStore(
        new CancelationStrategy(),
        DisposeMode.TRANSACTIONAL_MODE,
        null,
      ),
    );

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

class DisposeMode {
  private disposeMode: string;

  constructor(disposeMode: string) {
    this.disposeMode = disposeMode;
  }

  getDisposeModeName(): string {
    return this.disposeMode;
  }

  dispose(): void {
    // Do nothing
  }

  onDispose(): void {
    // Do nothing
  }
}

class GenkiDisposableStoreFactory implements GenkiDisposable {
  private readonly genkiDisposalStores: Map<string, GenkiDisposableStore>;
  private readonly disposeMode: DisposeMode;
  private readonly strategy: CancelationStrategy;
  private readonly options?: Options;
  private readonly eventBus: EventBus;

  constructor(
    strategy: CancelationStrategy,
    disposeMode: DisposeMode,
    options?: Options,
    eventBus: EventBus,
  ) {
    this.genkiDisposalStores = new Map();
    this.disposeMode = disposeMode;
    this.strategy = strategy;
    this.options = options;
    this.eventBus = eventBus;
  }

  async getGenkiDisposableStoreAsync(
    disposeMode: DisposeMode,
    options: Options,
  ): Promise<GenkiDisposableStore> {
    const cachedGenkiDisposableStore = this.genkiDisposalStores.get(disposeMode.getDisposeModeName());

    if (cachedGenkiDisposableStore) {
      return cachedGenkiDisposableStore;
    }

    const genkiDisposableStore = new GenkiDisposableStore(
      this.strategy,
      disposeMode,
      options,
    );

    this.genkiDisposalStores.set(disposeMode.getDisposeModeName(), genkiDisposableStore);

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
  private readonly disposeMethod: () => Promise<void>;
  private readonly disposeMode: DisposeMode;
  private readonly strategy: CancelationStrategy;
  private readonly options?: Options;

  constructor(
    strategy: CancelationStrategy,
    disposeMode: DisposeMode,
    options?: Options,
  ) {
    this.disposeMethod = this.disposeGenkiStore;
    this.disposeMode = disposeMode;
    this.strategy = strategy;
    this.options = options;
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
  private readonly eventBus: EventBus;

  constructor(genkiDisposableStore: GenkiDisposableStore, eventBus: EventBus) {
    this.genkiDisposableStore = genkiDisposableStore;
    this.eventBus = eventBus;
  }

  async onDisposeGenkiStore(): Promise<void> {
    await this.genkiDisposableStore.disposeGenkiStore();
  }
}

class CancelationStrategyFactory {
  private eventBus: EventBus;
  private disposables: Map<string, GenkiDisposableStoreFactory>;

  constructor(
    eventBus: EventBus,
    disposables: Map<string, GenkiDisposableStoreFactory>,
  ) {
    this.eventBus = eventBus;
    this.disposables = disposables;
  }

  getFactory(CancellationStrategyName: string): CancelationStrategy {
    // Implement cancellation strategy
  }
}

class StoreManager {
  private stores: Map<string, GenkiDisposableStore>;

  constructor() {
    this.stores = new Map();
  }

  async clear(): Promise<void> {
    this.stores.clear();
  }

  getGenkiDisposalStores(): Map<string, GenkiDisposableStore> {
    return this.stores;
  }

  onDisposeGenkiStores(): Promise<void> {
    // Implement
  }

  async getDisposeMode(options: Options): Promise<DisposeMode> {
    // Implement disposal mode
  }
}