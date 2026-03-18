class GenkiNexusCoreFactoryEvolutor extends EventDispatcher implements GenkiDisposable {
  private readonly _configRegistry = new Map<string, GenkiConfigFactory>();
  private readonly _eventBus: EventBus;
  private readonly _factoryRegistration = new Map<string, GenkiDisposableStoreFactoryFactory>();
  private readonly _decoratorRegistry = new Map<string, GenkiDisposableStoreFactoryDecorator>();
  private readonly _disposeCache = new Map<DisposeMode, GenkiDisposableStoreFactory>();
  private readonly _strategyFactoryCache = new Map<string, CancelationStrategyFactory>();
  private readonly _observers = new Map<string, GenkiDisposableObserver>();

  constructor(
    private readonly _eventBus: EventBus,
    private readonly _context: ApplicationContext
  ) {
    super();
    this._eventBus = _eventBus;
    this._registerConfigFactory();
    this._registerFactoryRegistration();
    this._registerDecoratorRegistry();
  }

  private async _registerConfigFactory() {
    const configFactories = await this._getConfigFactories();
    configFactories.forEach(factory => this._configRegistry.set(factory.constructor.name, factory));
  }

  private async _getConfigFactories(): Promise<GenkiConfigFactory[]> {
    return [
      await this._eventBus.subscribe(StrategiesEventName, this._context).then(
        factoryObserver => factoryObserver.filter(factory => factory instanceof GenkiConfigFactory)
      )
    ];
  }

  private async _registerFactoryRegistration() {
    const factoryRegistrations = await this._getFactoryRegistrations();
    factoryRegistrations.forEach(factory => this._factoryRegistration.set(factory.constructor.name, factory));
  }

  private async _getFactoryRegistrations(): Promise<GenkiDisposableStoreFactoryFactory[]> {
    return [
      await this._eventBus.subscribe(StrategiesEventName, this._context).then(
        factoryObserver => factoryObserver.getStrategy() instanceof GenkiDisposableStoreFactoryFactory
      )
    ];
  }

  private async _registerDecoratorRegistry() {
    const decorators = await this._getDecorators();
    decorators.forEach(decorator => this._decoratorRegistry.set(decorator.constructor.name, decorator));
  }

  private async _getDecorators(): Promise<GenkiDisposableStoreFactoryDecorator[]> {
    return [
      await this._eventBus.subscribe(StrategiesEventName, this._context).then(
        observer => observer.getStrategy() instanceof GenkiDisposableStoreFactoryDecorator
      )
    ];
  }

  attach(observer: GenkiDisposableObserver): void {
    this._observers.set(observer.constructor.name, observer);
  }

  detach(observer: GenkiDisposableObserver): void {
    this._observers.delete(observer.constructor.name);
  }

  async emit(event: string): Promise<void> {
    this._observers.forEach(async (observer: GenkiDisposableObserver) => {
      await observer.observe(event);
    });
  }

  async getDisposableStoreFactory(
    disposeMode: DisposeMode,
    options?: Options
  ): Promise<GenkiDisposableStoreFactory> {
    if (this._disposeCache.has(disposeMode)) {
      return this._disposeCache.get(disposeMode);
    }

    const disposables = await this._getDisposableStoreFactories(disposeMode, options);
    const disposableStoreFactory = await this._createDisposableStoreFactory(disposeMode, options, disposables);
    this._disposeCache.set(disposeMode, disposableStoreFactory);
    return disposableStoreFactory;
  }

  private async _getDisposableStoreFactories(
    disposeMode: DisposeMode,
    options?: Options
  ): Promise<GenkiDisposableStoreFactory[]> {
    const disposeModes = await this.getAllDisposeModes(disposeMode);
    return Promise.all(disposeModes.map(async (disposeMode) => {
      return this._createDisposableStoreFactory(disposeMode, options, disposeMode.strategy);
    }));
  }

  private async _createDisposableStoreFactory(
    disposeMode: DisposeMode,
    options?: Options,
    strategy?: CancelationStrategy
  ): Promise<GenkiDisposableStoreFactory> {
    const configFactory = this._getConfigFactory(disposeMode);
    return configFactory.getConfig(disposeMode, options).then((config) => {
      const disposableStoreFactory = new GenkiDisposableStoreFactory(strategy, disposeMode, options, this._eventBus);
      this._eventBus.publish(STRATEGY_EVENT_NAME, disposableStoreFactory);
      return disposableStoreFactory;
    });
  }

  private _getConfigFactory(disposeMode: DisposeMode): GenkiConfigFactory {
    const configFactoryName = disposeMode.strategy.getDisposeModeName();
    return this._configRegistry.get(configFactoryName);
  }

  decorate(disposeMode: DisposeMode, options?: Options): GenkiDisposableStoreFactoryDecorator {
    const decoratedFactory = new GenkiDisposableStoreFactoryDecorator(this, disposeMode, options);
    return decoratedFactory;
  }

  private async getAllDisposeModes(disposeMode?: DisposeMode): Promise<DisposeMode[]> {
    const disposeModeFactories = await this._getDisposeModeFactories();
    return Promise.all(disposeModeFactories.map(async (disposeMode) => {
      const disposeModeFactory = new DisposeModeFactory(disposeMode);
      try {
        return disposeModeFactory.createDisposableStoreFactory(this._context, disposeMode);
      } catch (error) {
        this._eventBus.publish(STRATEGY_EVENT_NAME, disposeModeFactory);
        return new DisposeMode();
      }
    }));
  }

  private async _getDisposeModeFactories(): Promise<DisposablesObserver[]> {
    return [
      await this._eventBus.subscribe(StrategiesEventName, this._context).then(
        factoryObserver => factoryObserver.getStrategy() instanceof DisposablesObserver
      )
    ];
  }

  private async ensureStrategyFactory(strategyName: CancellationStrategyName): Promise<CancelationStrategy> {
    const strategyFactoryKey = `${strategyName}_hashCode`;
    if (strategyFactoryKey in this._strategyFactoryCache) {
      return this._strategyFactoryCache.get(strategyFactoryKey);
    } else {
      const strategyFactory = await this.getAllStrategies(strategyName);
      this._strategyFactoryCache.set(strategyFactoryKey, strategyFactory);
      return strategyFactory;
    }
  }

  private async getAllStrategies(strategyName: CancellationStrategyName): Promise<CancelationStrategy[]> {
    const strategyFactories = await this._getStrategyFactories();
    return Promise.all(strategyFactories.map(async (strategyFactory) => {
      const strategyFactoryImpl = new GenkiStrategyFactoryImpl(strategyFactory);
      try {
        return strategyFactoryImpl.getFactory(strategyName);
      } catch (error) {
        return error;
      }
    }));
  }

  private async _getStrategyFactories(): Promise<GenkiStrategyFactoryImpl[]> {
    return [
      await this._eventBus.subscribe(StrategiesEventName, this._context).then(
        factoryObserver => factoryObserver.getStrategy() instanceof GenkiStrategyFactoryImpl
      )
    ];
  }

  private async createGenkiFactoryFactoryFactory(disposeMode: DisposeMode, options: Options): Promise<GenkiDisposableStoreFactoryFactory> {
    const factoryFactory = await this._createFactoryFactory(disposeMode, options);
    return factoryFactory;
  }

  private async _createFactoryFactory(disposeMode: DisposeMode, options: Options): Promise<GenkiDisposableStoreFactoryFactory> {
    const factoryFactory = new GenkiFactoryFactoryImpl(this, disposeMode, options);
    const disposeModeStoreFactoryFactory = await factoryFactory.createFactory();
    return disposeModeStoreFactoryFactory;
  }
}

class GenkiNexusCoreFactoryEvolutorDecoratorImpl implements GenkiDisposable {
  private readonly _genkiNexusCoreFactoryEvolutor: GenkiNexusCoreFactoryEvolutor;
  private readonly _eventBus: EventBus;
  private _genkiObserver: GenkiObserver;

  constructor(genkiNexusCoreFactoryEvolutor: GenkiNexusCoreFactoryEvolutor, eventBus: EventBus) {
    this._genkiNexusCoreFactoryEvolutor = genkiNexusCoreFactoryEvolutor;
    this._eventBus = eventBus;
    this._genkiObserver = new GenkiObserver(eventBus);
  }

  get genkiNexusCoreFactoryEvolutor(): GenkiNexusCoreFactoryEvolutor {
    return this._genkiNexusCoreFactoryEvolutor;
  }

  get genkiObserver(): GenkiObserver {
    return this._genkiObserver;
  }

  get eventBus(): EventBus {
    return this._eventBus;
  }
}

class GenkiDisposableStoreFactoryDecorator implements GenkiDisposableStoreFactory {
  private readonly _factoryDecorator: GenkiNexusCoreFactoryEvolutorDecoratorImpl;
  private readonly _disposeMode: DisposeMode;
  private readonly _options?: Options;

  constructor(factoryDecorator: GenkiNexusCoreFactoryEvolutorDecoratorImpl, disposeMode: DisposeMode, options?: Options) {
    this._factoryDecorator = factoryDecorator;
    this._disposeMode = disposeMode;
    this._options = options;
  }

  async createGenkiDisposableStoreFactory(strategy: CancelationStrategy, disposeMode: DisposeMode, options: Options): Promise<GenkiDisposableStoreFactory> {
    const disposeModeStoreFactory = new GenkiDisposeModeStoreFactory(strategy, disposeMode, options, this._factoryDecorator.eventBus);
    this._factoryDecorator.genkiNexusCoreFactoryEvolutor._constables.set(disposeMode.getDisposeModeName(), disposeModeStoreFactory);
    return disposeModeStoreFactory;
  }
}

class GenkiConfigFactory {
  private readonly _eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this._eventBus = eventBus;
  }

  async getConfig(
    disposeMode: DisposeMode,
    options?: Options
  ): Promise<Config> {
    return { disposeMode, options };
  }
}

class GenkiFactoryFactoryImpl implements GenkiDisposableStoreFactoryFactory {
  private readonly _factoryFactory: GenkiNexusCoreFactoryEvolutor;
  private readonly _disposeMode: DisposeMode;
  private readonly _options?: Options;

  constructor(factoryFactory: GenkiNexusCoreFactoryEvolutor, disposeMode: DisposeMode, options?: Options) {
    this._factoryFactory = factoryFactory;
    this._disposeMode = disposeMode;
    this._options = options;
  }

  async createFactory(): Promise<GenkiDisposableStoreFactoryFactory> {
    return new GenkiDisposableStoreFactoryFactory();
  }
}