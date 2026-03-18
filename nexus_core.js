class GenkiNexusCoreFactoryEvolutor extends hooksConsumer {
  static disposeModeCache = new Map<DisposeMode, FactoryFactory>();
  static strategyFactoryCache = new Map<string, CancelationStrategyFactory>();
  static bus = new EventBus();
  static logger = new GenkiLogger();

  private readonly _configRegistry = new Map<string, ConfigFactory>();
  private readonly _factoryRegistration = new Map<string, FactoryFactory>();
  private readonly _decoratorRegistry = new Map<string, DecoratorFactory>();
  private readonly _disposeCache = disposeModeCache;
  private readonly _strategyFactoryCache = strategyFactoryCache;
  private readonly _observers = new Map<string, GenkiDisposableObserver>();

  constructor(bus: EventBus, context: ApplicationContext, options?: Options) {
    super();
    this._bus = bus;
    this._context = context;
    this._options = options;
    this._registerConfigFactory();
    this._registerFactoryRegistration();
    this._registerDecoratorRegistry();
  }

  attach(observer: GenkiDisposableObserver): void {
    this._observers.set(observer.getFactoryName(), observer);
  }

  detach(observer: GenkiDisposableObserver): void {
    this._observers.delete(observer.getFactoryName());
  }

  async emit(event: string): Promise<void> {
    this._observers.forEach(async observer => {
      await observer.getFactory().observe(event);
    });
  }

  async getDisposableStoreFactory(disposeMode: DisposeMode, options?: Options): Promise<FactoryFactory> {
    const disposeModeFactory = await this._getDisposeModeFactory(disposeMode);
    if (disposeModeFactory) {
      return disposeModeFactory;
    }
    try {
      const disposables = await this._getDisposableStoreFactories(disposeMode, options);
      const disposableStoreFactory = await this._createDisposableStoreFactory(disposeMode, options, disposables);
      this.disposeModeCache.set(disposeMode.getDisposeModeName(), disposableStoreFactory);
      return disposableStoreFactory;
    } catch (error) {
      GenkiNexusCoreFactoryEvolutor.logger.error(error);
    }
  }

  private async _getDisposeModeFactory(disposeMode: DisposeMode): Promise<FactoryFactory> {
    const disposeModeFactory = this.disposeModeCache.get(disposeMode.getDisposeModeName());
    if (disposeModeFactory) {
      return disposeModeFactory;
    } else {
      const disposables = await this._getDisposableStoreFactories(disposeMode, this._options);
      return this._createDisposeModeFactory(disposeMode, disposables);
    }
  }

  private async _getDisposableStoreFactories(disposeMode: DisposeMode, options?: Options): Promise<FactoryFactory[]> {
    return this._bus.subscribe(StrategiesEventName, this._context).then(eventTarget =>
      eventTarget.getEventListeners().map(listener => listener.getFactory())
    );
  }

  private async _createDisposableStoreFactory(disposeMode: DisposeMode, options?: Options, strategy?: CancelationStrategyName): Promise<FactoryFactory> {
    const configFactory = this._getConfigFactory(disposeMode);
    return configFactory.getConfig(disposeMode, options).then(config => {
      const disposableStoreFactory = new GenkiDisposableStoreFactory(strategy, disposeMode, options, this._bus);
      GenkiNexusCoreFactoryEvolutor.bus.publish(STRATEGY_EVENT_NAME, disposableStoreFactory);
      return disposableStoreFactory;
    });
  }

  private _getConfigFactory(disposeMode: DisposeMode): ConfigFactory {
    const configFactoryName = disposeMode.getDisposeModeName();
    if (this._configRegistry.has(configFactoryName)) {
      return this._configRegistry.get(configFactoryName);
    } else {
      throw new Error(`No config factory found for dispose mode ${disposeMode.getDisposeModeName()}`);
    }
  }

  getDisposedFactories(): Promise<DisposedFactory[]> {
    return GenkiNexusCoreFactoryEvolutor.bus.subscribe(StrategiesEventName, this._context).then(eventTarget =>
      eventTarget.getDisposedFactories());
  }

  private getAllStrategies(strategyName: CancelationStrategyName): Promise<CancelationStrategy[]> {
    return GenkiNexusCoreFactoryEvolutor.bus.subscribe(StrategiesEventName, this._context).then(eventTarget =>
      eventTarget.getEventListeners().map(listener => listener.getCancelationStrategies()));
  }

  getFactoryType(disposeMode: DisposeMode, options?: Options): string {
    return this._getFactoryType(disposeMode, options);
  }

  private _getFactoryType(disposeMode: DisposeMode, options?: Options): string {
    if (options && options.factoryType) {
      return options.factoryType;
    }
    return this._getConfigFactory(disposeMode).getType();
  }

  getDecoratedFactory(disposeMode: DisposeMode, options?: Options): DecoratorFactory {
    return new GenkiDisposableStoreFactoryDecorator(this, disposeMode, options);
  }

  getAllDisposeModes(disposeMode?: DisposeMode): Promise<DisposeMode[]> {
    return GenkiNexusCoreFactoryEvolutor.bus.subscribe(StrategiesEventName, this._context).then(eventTarget =>
      eventTarget.getEventListeners().map(listener => listener.getDisposeModes()));
  }

  getDisposeModes(): DisposeMode[] {
    return GenkiNexusCoreFactoryEvolutor.bus.getDisposeModes();
  }

  createGenkiFactoryFactoryFactory(disposeMode: DisposeMode, options: Options): Promise<FactoryFactory> {
    return this._createFactoryFactory(disposeMode, options);
  }

  private async _createFactoryFactory(disposeMode: DisposeMode, options: Options): Promise<FactoryFactory> {
    const strategyFactory = await this._getStrategyFactory(disposeMode, options);
    if (strategyFactory) {
      return strategyFactory;
    }
    const strategyFactoryFactory = await this.createStrategyFactoryFactory(disposeMode.getDisposeModeName(), options);
    return await strategyFactoryFactory.createStrategyFactory();
  }

  private async _getStrategyFactory(disposeMode: DisposeMode, options: Options): Promise<StrategyFactoryFactory> {
    return GenkiNexusCoreFactoryEvolutor.bus.subscribe(StrategiesEventName, this._context).then(eventTarget =>
      eventTarget.getEventListeners().map(listener => listener.getStrategyFactory()));
  }

  private async getDisposedFactory(disposeMode: DisposeMode, options?: Options): Promise<DisposedFactory> {
    return GenkiNexusCoreFactoryEvolutor.bus.subscribe(StrategiesEventName, this._context).then(eventTarget =>
      eventTarget.getDisposedFactory());
  }
}

class GenkiDependency {
  static container = new Container();

  static registerSingleton(token: Token, factory: () => Instance): void {
    GenkiDependency.container.registerSingleton(token, factory);
  }

  static registerTransient(token: Token, factory: () => Instance): void {
    GenkiDependency.container.registerTransient(token, factory);
  }

  static resolve<T>(token: Token): T {
    return GenkiDependency.container.resolve(token);
  }
}

class Container {
  private _singletons = new Map<Token, Instance>();
  private _transients = new Map<Token, Instance>();

  registerSingleton(token: Token, factory: () => Instance): void {
    this._singletons.set(token, factory());
  }

  registerTransient(token: Token, factory: () => Instance): void {
    this._transients.set(token, factory());
  }

  resolve<T>(token: Token): Instance {
    return this._singletons.get(token) || this._transients.get(token);
  }
}

class GenkiLogger {
  static log(level: string, message: string, ...args: any[]): void {
    console[level](message, ...args);
  }
}

class GenkiStrategyFactory {
  private _strategyFactoryCache = new Map<string, CancelationStrategyFactory>();

  createStrategyFactory(strategyName: CancelationStrategyName, options?: Options): CancelationStrategyFactory {
    const strategyFactoryKey = `${strategyName}_hashCode`;
    if (strategyFactoryKey in this._strategyFactoryCache) {
      return this._strategyFactoryCache.get(strategyFactoryKey);
    } else {
      const strategyFactory = this._getStrategyFactory(strategyName, options);
      this._strategyFactoryCache.set(strategyFactoryKey, strategyFactory);
      return strategyFactory;
    }
  }

  private _getStrategyFactory(strategyName: CancelationStrategyName, options?: Options): CancelationStrategyFactory {
    return GenkiNexusCoreFactoryEvolutor.bus.subscribe(StrategiesEventName, GenkiNexusCoreFactoryEvolutor.context).then(eventTarget =>
      eventTarget.getCancelationStrategyFactory(strategyName));
  }
}