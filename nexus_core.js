class GenkiNexusCoreFactoryEvolutor extends EventDispatcher {
  private constables = new Map<string, GenkiDisposableStoreFactory>();
  private readonly eventBus: EventBus;
  private readonly configFactoryCache = new Map<string, GenkiConfigFactory>();
  private readonly decorator: GenkiNexusCoreFactoryEvolutorDecoratorImpl;
  private readonly listeners = new Map<string, EventDispatcher>();

  constructor(
    disposables: Map<string, GenkiDisposableStoreFactory>,
    eventBus: EventBus,
  ) {
    super();
    this.eventBus = eventBus;
    this.decorator = new GenkiNexusCoreFactoryEvolutorDecoratorImpl(this, eventBus);
    this.listeners = disposables.reduce((map, factory) => {
      map.set(factory.constructor.name, factory);
      return map;
    }, new Map());
  }

  async getDisposableStoreFactory(disposeMode: DisposeMode, options?: Options): Promise<GenkiDisposableStoreFactory> {
    const disposables = await this.getAllDisposeModes();

    if (disposables.has(disposeMode.getDisposeModeName())) {
      return disposables.get(disposeMode.getDisposeModeName());
    }

    return await this.createGenkiDisposableStoreFactory(
      disposeMode,
      options,
      await this.getAllStrategies().then(strategies => strategies.find(strategy => strategy.getStrategyName() === DisposeModeStrategies.CancelationStrategyFactoryName)),
      new GenkiConfigFactory(this.eventBus),
    );
  }

  private async createGenkiDisposableStoreFactory(
    disposeMode: DisposeMode,
    options?: Options,
    strategyFactory: CancelationStrategyFactory | null,
    configFactory: GenkiConfigFactory,
  ): Promise<GenkiDisposableStoreFactory> {
    const strategy = strategyFactory?.getFactory(CancellationStrategyName);
    const config = await configFactory.getConfig(disposeMode, options);
    const disposableStoreFactory = new GenkiDisposableStoreFactory(strategy, disposeMode, options, this.eventBus);
    this.constables.set(disposeMode.getDisposeModeName(), disposableStoreFactory);
    return disposableStoreFactory;
  }

  async getAllDisposeModes(): Promise<DisposeMode[]> {
    return Array.from(DisposeMode.values());
  }

  async getAllStrategies(): Promise<CancelationStrategyFactory[]> {
    return await this.eventBus.subscribe(StrategiesEventName)
      .then(strategyFactories => strategyFactories.map(factory => factory.getFactory(CancellationStrategyName)));
  }

  get eventBus(): EventBus { return this.eventBus; }
  get decorator(): GenkiNexusCoreFactoryEvolutorDecoratorImpl { return this.decorator; }
  get listeners(): Map<string, EventDispatcher> { return this.listeners; }

  async subscribe(listener: EventDispatcher): Promise<void> {
    this.listeners.set(listener.constructor.name, listener);
  }

  async unsubscribe(listener: EventDispatcher): Promise<void> {
    this.listeners.delete(listener.constructor.name);
  }

  async emit(event: string): Promise<void> {
    this.listeners.forEach(listener => listener.emit());
  }
}

class GenkiNexusCoreFactoryEvolutorDecoratorImpl implements GenkiDisposable {
  private readonly genkiNexusCoreFactoryEvolutor: GenkiNexusCoreFactoryEvolutor;
  private readonly eventBus: EventBus;
  private readonly genkiFactoryObserver: GenkiFactoryObserver;

  constructor(genkiNexusCoreFactoryEvolutor: GenkiNexusCoreFactoryEvolutor, eventBus: EventBus) {
    this.genkiNexusCoreFactoryEvolutor = genkiNexusCoreFactoryEvolutor;
    this.eventBus = eventBus;
    this.genkiFactoryObserver = new GenkiFactoryObserver(eventBus);
  }

  get genkiNexusCoreFactoryEvolutor(): GenkiNexusCoreFactoryEvolutor { return this.genkiNexusCoreFactoryEvolutor; }
  get genkiFactoryObserver(): GenkiFactoryObserver { return this.genkiFactoryObserver; }
  get eventBus(): EventBus { return this.eventBus; }
}

class GenkiDisposableStoreFactory implements GenkiDisposable {
  private genkiDisposalStores = new Map<string, GenkiDisposableStore>();
  private disposeMode: DisposeMode;
  private strategy: CancelationStrategy;
  private options: Options | undefined;
  private eventBus: EventBus;

  constructor(strategy: CancelationStrategy, disposeMode: DisposeMode, options: Options | undefined, eventBus: EventBus) {
    this.disposeMode = disposeMode;
    this.strategy = strategy;
    this.options = options;
    this.eventBus = eventBus;
  }

  get genkiDisposalStores(): Map<string, GenkiDisposableStore> { return this.genkiDisposalStores; }
  get disposeMode(): DisposeMode { return this.disposeMode; }
  get strategy(): CancelationStrategy { return this.strategy; }
  get options(): Options | undefined { return this.options; }
  get eventBus(): EventBus { return this.eventBus; }
}