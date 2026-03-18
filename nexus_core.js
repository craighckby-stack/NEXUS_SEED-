class GenkiNexusCoreFactoryEvolutor extends EventDispatcher {
  private readonly disposables: Map<string, GenkiDisposableStoreFactory>;
  private readonly eventBus: EventBus;
  private readonly configFactoryCache: Map<string, GenkiConfigFactory>;

  constructor(
    disposables: Map<string, GenkiDisposableStoreFactory>,
    eventBus: EventBus,
  ) {
    super();
    this.disposables = disposables;
    this.eventBus = eventBus;
    this.configFactoryCache = new Map();
  }

  async getDisposableStoreFactoryWithStrategies(
    disposeMode: DisposeMode,
    options?: Options,
  ): Promise<GenkiDisposableStoreFactory> {
    const strategyFactory = this.disposables.get(CancelationStrategyFactoryName);
    if (this.disposables.has(disposeMode.getDisposeModeName())) {
      return this.disposables.get(disposeMode.getDisposeModeName());
    } else {
      return await this.createGenkiDisposableStoreFactory(
        disposeMode,
        options,
        strategyFactory,
        new GenkiConfigFactory(this.eventBus),
      );
    }
  }

  private async createGenkiDisposableStoreFactory(
    disposeMode: DisposeMode,
    options?: Options,
    strategyFactory: CancelationStrategyFactory | null,
    configFactory: GenkiConfigFactory,
  ): Promise<GenkiDisposableStoreFactory> {
    if (!strategyFactory) {
      strategyFactory = this.disposables.get(CancelationStrategyFactoryName);
    }
    const strategy = strategyFactory.getFactory(CancellationStrategyName);
    const config = await configFactory.getConfig(disposeMode, options);

    const genkiDisposableStoreFactory = new GenkiDisposableStoreFactory(strategy, disposeMode, options, this.eventBus);

    this.disposables.set(disposeMode.getDisposeModeName(), genkiDisposableStoreFactory);

    return genkiDisposableStoreFactory;
  }

  private async getConfigFactory(disposeMode: DisposeMode, options: Options): Promise<GenkiConfigFactory> {
    const cacheKey = `${disposeMode.getDisposeModeName()}${JSON.stringify(options)}`;
    if (this.configFactoryCache.has(cacheKey)) {
      return this.configFactoryCache.get(cacheKey);
    } else {
      const configFactory = new GenkiConfigFactory(this.eventBus);
      this.configFactoryCache.set(cacheKey, configFactory);
      return configFactory;
    }
  }

  async getDisposableStoreObserver(disposalStore: DisposableStore): Promise<DisposableStoreObserver> {
    const genkiDisposableStoreObserver = new GenkiDisposableStoreObserver(disposalStore, this.eventBus);
    await this.subscribe(genkiDisposableStoreObserver);
    return genkiDisposableStoreObserver;
  }

  async initializeNexusCoreFactoryEvolutor(): Promise<void> {
    const allStrategyFactories = await this.eventBus.subscribe(StrategiesEventName);
    allStrategyFactories.forEach(factory => {
      const strategy = factory.getFactory(CancellationStrategyName);
      this.disposables.set(DisposeMode.TRANSACTIONAL_MODE.toString(), new GenkiDisposableStoreFactory(strategy, DisposeMode.TRANSACTIONAL_MODE, null, this.eventBus));
    });
    await this.subscribeStoreManagerEvents(new StoreManager());
  }

  async createDisposableStore(disposeMode: DisposeMode, options?: Options): Promise<DisposableStore> {
    const genkiDisposableStoreFactory = await this.getDisposableStoreFactoryWithStrategies(disposeMode, options);
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

  async observerDisposalStore(disposalStore: DisposableStore): Promise<void> {
    const genkiDisposableStoreObserver = this.getDisposableStoreObserver(disposalStore);
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

  async subscribeStoreManagerEvents(storeManager: StoreManager): Promise<void> {
    await this.eventBus.subscribe(StoreManagerEventName);
    storeManager.on(StoreManagerEventName).subscribe(() => {});
  }
}

class GenkiConfigFactory {
  private readonly eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  async getConfig(disposeMode: DisposeMode, options: Options): Promise<GenkiConfig> {
    const cacheKey = `${disposeMode.getDisposeModeName()}${JSON.stringify(options)}`;
    const config = new GenkiConfig(disposeMode, options);
    return config;
  }
}

class GenkiDisposableStoreFactory implements GenkiDisposable {
  private readonly genkiDisposalStores: Map<string, GenkiDisposableStore>;
  private readonly disposeMode: DisposeMode;
  private readonly strategy: CancelationStrategy;
  private readonly options: Options | undefined;
  private readonly eventBus: EventBus;

  constructor(strategy: CancelationStrategy, disposeMode: DisposeMode, options: Options | undefined, eventBus: EventBus) {
    this.genkiDisposalStores = new Map();
    this.disposeMode = disposeMode;
    this.strategy = strategy;
    this.options = options;
    this.eventBus = eventBus;
  }
}