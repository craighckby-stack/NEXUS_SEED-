class DisposableStoreFactory {
  private static _availableStrategiesCache: Map<string, DisposableStoreStrategy> = new Map();

  public static getAvailableCancellationStrategies(): string[] {
    const strategies = DisposableStoreFactory.getAvailableStrategies([], false);
    return strategies.map((str) => str.name);
  }

  public static getDefaultCancellationStrategies(): DisposableStoreStrategyMap {
    const strategies = DisposableStoreFactory.getAvailableStrategies([], true);
    return new DisposableStoreStrategyMap(strategies);
  }

  private static getAvailableStrategies(strategies: string[], shouldCache: boolean): DisposableStoreStrategy[] {
    if (_availableStrategiesCache.has('available_strategies')) {
      return _availableStrategiesCache.get('available_strategies');
    }

    const newStrategies = strategies.map(strategy => new DisposableStoreStrategy(strategy));
    _availableStrategiesCache.set('available_strategies', newStrategies);
    return newStrategies;
  }

  public static async registerCancellationStrategy(strategyName: string, strategyFn: () => void): Promise<void> {
    const map = DisposableStoreFactory.getDefaultCancellationStrategies();
    if (!map.has(strategyName)) {
      map.set(strategyName, new DisposableStoreStrategy(strategyName, strategyFn));
    }
  }

  public static getCancellationStrategy(strategyName: string): DisposableStoreStrategy | undefined {
    const map = DisposableStoreFactory.getDefaultCancellationStrategies();
    return map.get(strategyName);
  }

  public static async createDisposableStore(strategyName?: string, options?: DisposableStoreOptions): Promise<DisposableStore> {
    const cache = DisposableStoreFactory._availableStrategiesCache.get(strategyName);
    if (cache) {
      return Promise.resolve(cache);
    }

    const strategyFn = DisposableStoreFactory.getCancellationStrategy(strategyName);
    if (!strategyFn) {
      throw new Error(`Cancellation strategy not found for ${strategyName}.`);
    }

    const store = new DisposableStore(strategyFn, strategyName, options);
    await store.init(options);
    await store.persist();
    return store;
  }

  protected static async createDisposableStoreSlow(options?: DisposableStoreOptions): Promise<DisposableStore> {
    const store = new DisposableStore();
    await store.init(options);
    await store.persist();
    return store;
  }

  public static dispose(): void {
    DisposableStoreFactory.getDefaultCancellationStrategies().clear();
    DisposableStoreFactory._availableStrategiesCache.clear();
  }
}

class DisposableStore {
  private _cancellationStrategy: DisposableStoreStrategy;
  private _managedDispose: boolean;
  private _strategyName: string;
  private _disposables: DisposableStoreDisposable[];
  private _options?: DisposableStoreOptions;

  constructor(cancellationStrategy: DisposableStoreStrategy, strategyName?: string, options?: DisposableStoreOptions) {
    this._cancellationStrategy = cancellationStrategy;
    this._managedDispose = false;
    this._strategyName = strategyName;
    this._disposables = [];
    this._options = options;
  }

  public async add(disposable: DisposableStoreDisposable | CancellationToken): Promise<IDisposable> {
    if (disposable instanceof DisposableStore) {
      this._disposables.push(disposable);
      return this;
    } else {
      return await disposable.add();
    }
  }

  public async addMany(...disposables: DisposableStoreDisposable[] | CancellationToken[]): Promise<IDisposable[]> {
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
    this._cancellationStrategy.action();
    for (const disposable of this._disposables) {
      await disposable.dispose();
    }
  }

  public async disposeWith(strategyName: string): Promise<void> {
    await this.dispose();
    console.log(`Disposing strategy ${strategyName} on store instance`);
  }

  public async init(options?: DisposableStoreOptions): Promise<void> {
    // Update strategy cache with new instance
  }

  public async persist(): Promise<void> {
    return Promise.resolve();
  }
}

class DisposableStoreStrategy {
  public name: string;
  public action: () => void;

  constructor(strategyName: string, strategyFn: () => void) {
    this.name = strategyName;
    this.action = strategyFn;
  }
}

class DisposableStoreStrategyMap extends Map<string, DisposableStoreStrategy> {}