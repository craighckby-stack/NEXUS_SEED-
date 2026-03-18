class ImmutableDisposableStoreFactory {
  private static readonly _availableStrategiesCache: Map<string, ImmutableDisposableStoreStrategy> = new Map();

  public static getAvailableCancellationStrategies(): string[] {
    const strategies = ImmutableDisposableStoreFactory.getAvailableStrategies([]);
    return strategies.map((str) => str.name);
  }

  public static getDefaultCancellationStrategies(): ImmutableDisposableStoreStrategyMap {
    const strategies = ImmutableDisposableStoreFactory.getAvailableStrategies([]);
    return new ImmutableDisposableStoreStrategyMap(strategies);
  }

  private static getAvailableStrategies(strategies: string[]): ImmutableDisposableStoreStrategy[] {
    if (_availableStrategiesCache.has('available_strategies')) {
      return _availableStrategiesCache.get('available_strategies');
    }

    const cache = { key: 'available_strategies', value: strategies.map(strategy => new ImmutableDisposableStoreStrategy(strategy)) };
    _availableStrategiesCache.set(cache.key, cache);
    return cache.value;
  }

  public static async registerCancellationStrategy(strategyName: string, strategyFn: () => void): Promise<void> {
    const map = ImmutableDisposableStoreFactory.getDefaultCancellationStrategies();
    if (!map.has(strategyName)) {
      map.set(strategyName, new ImmutableDisposableStoreStrategy(strategyName, strategyFn));
      EventEvolvedLazyCallbacks.registerStrategy(strategyName, strategyFn);
    }
  }

  public static getCancellationStrategy(strategyName: string): ImmutableDisposableStoreStrategy | undefined {
    const map = ImmutableDisposableStoreFactory.getDefaultCancellationStrategies();
    return map.get(strategyName);
  }

  public static async createDisposableStore(strategyName?: string): Promise<ImmutableDisposableStore> {
    const cache = ImmutableDisposableStoreFactory._availableStrategiesCache.get(strategyName);
    if (cache) {
      return Promise.resolve(cache.value);
    }

    const strategyFn = ImmutableDisposableStoreFactory.getCancellationStrategy(strategyName);
    if (!strategyFn) {
      throw new Error(`Cancellation strategy not found for ${strategyName}.`);
    }
    return ImmutableDisposableStoreFactory.createDisposableStoreSlow(strategyName, strategyFn);
  }

  private static async createDisposableStoreSlow(strategyName?: string, strategyFn?: () => void): Promise<ImmutableDisposableStore> {
    const store = new ImmutableDisposableStore(strategyFn, strategyName);
    await store.init();
    await store.persist();
    return store;
  }

  public static async registerLazyCallback(strategyName: string, callback: (strategyFn: () => void) => void): Promise<void> {
    EventEvolvedLazyCallbacks.registerLazyCallback(strategyName, callback);
  }

  public static getLazyCallback(strategyName: string): (() => void) | undefined {
    return EventEvolvedLazyCallbacks.getLazyCallback(strategyName);
  }

  public static dispose(): void {
    ImmutableDisposableStoreFactory.getDefaultCancellationStrategies().clear();
    ImmutableDisposableStoreFactory._availableStrategiesCache.clear();
    EventEvolvedLazyCallbacks.clear();
  }
}

class ImmutableDisposableStore {
  private _cancellationStrategy: ImmutableDisposableStoreStrategy | undefined;
  private _managedDispose: boolean;
  private _strategyName: string;
  private _disposables: ImmutableDisposableStoreDisposable[];

  constructor(cancellationStrategy?: ImmutableDisposableStoreStrategy, strategyName?: string) {
    this._cancellationStrategy = cancellationStrategy;
    this._managedDispose = false;
    this._strategyName = strategyName;
    this._disposables = [];
  }

  public async add(disposable: ImmutableDisposableStoreDisposable | CancellationToken): Promise<IDisposable> {
    if (disposable instanceof ImmutableDisposableStore) {
      this._disposables.push(disposable);
      return this;
    } else {
      return await disposable.add();
    }
  }

  public async addMany(...disposables: ImmutableDisposableStoreDisposable[] | CancellationToken[]): Promise<IDisposable[]> {
    const promises = this._disposables.concat(disposables).map((disposable) => disposable.add());
    return Promise.all(promises);
  }

  public async clear(): Promise<void> {
    this._disposables.length = 0;
  }

  public async dispose(): Promise<void> {
    if (this._managedDispose) {
      return;
    }
    this._managedDispose = true;
    if (this._cancellationStrategy) {
      this._cancellationStrategy.action();
    }
    for (const disposable of this._disposables) {
      await disposable.dispose();
    }
  }

  public getCancellationStrategy(): ImmutableDisposableStoreStrategy | undefined {
    return this._cancellationStrategy;
  }

  public async dispose(strategyName: string): Promise<void> {
    this.dispose();
  }

  public init(): Promise<void> {
    return Promise.resolve();
  }

  public async persist(): Promise<void> {
    return Promise.resolve();
  }
}

class ImmutableDisposableStoreStrategy {
  constructor(strategyName: string, strategyFn: () => void) {
    this.name = strategyName;
    this.action = strategyFn;
  }
}

class ImmutableDisposableStoreStrategyMap extends Map<string, ImmutableDisposableStoreStrategy> {}

class EventEvolvedLazyCallbacks {
  private static instances: Map<string, () => void> = new Map();

  public static registerStrategy(strategyName: string, strategyFn: () => void): void {
    EventEvolvedLazyCallbacks.instances.set(strategyName, () => strategyFn());
  }

  public static registerLazyCallback(strategyName: string, callback: (strategyFn: () => void) => void): void {
  }

  public static getLazyCallback(strategyName: string): (() => void) | undefined {
    return () => EventEvolvedLazyCallbacks.instances.get(strategyName)();
  }

  public static clear(): void {
    EventEvolvedLazyCallbacks.instances.clear();
  }
}