import { DisposableStoreFactory } from './nexus_core';

// Dispose mode definition
enum DisposeMode {
  TRANSACTIONAL_MODE = 'transactional',
  BATCH_MODE = 'batch',
}

// Cancelation strategy definition
class CancelationStrategy {
  public name: string;
  public strategyContexts: string[];
  public strategyFn: () => void;

  constructor(strategyName: string, strategyFn: () => void, strategyContexts: string[]) {
    this.name = strategyName;
    this.strategyContexts = strategyContexts;
    this.strategyFn = strategyFn;
  }
}

class CancelationStrategyFactory {
  private static _availableStrategiesCache: Map<string, CancelationStrategy> = new Map();

  public static getAvailableCancellationStrategies(): string[] {
    return CancelationStrategyFactory.getAvailableStrategies([], false).map(strategy => strategy.name);
  }

  public static getDefaultCancellationStrategies(): Map<string, CancelationStrategy> {
    const strategies = CancelationStrategyFactory.getAvailableStrategies([], true);
    return new Map(strategies);
  }

  public static getCancellationStrategy(strategyName: string): CancelationStrategy | undefined {
    const map = CancelationStrategyFactory.getDefaultCancellationStrategies();
    return map.get(strategyName);
  }

  public static async registerCancellationStrategy(strategyName: string, strategyFn: () => void): Promise<void> {
    const map = CancelationStrategyFactory.getDefaultCancellationStrategies();
    if (!map.has(strategyName)) {
      map.set(strategyName, new CancelationStrategy(strategyName, strategyFn, []));
    }
  }

  private static getAvailableStrategies(strategies: string[], shouldCache: boolean): CancelationStrategy[] {
    if (CancelationStrategyFactory._availableStrategiesCache.has('available_strategies')) {
      return CancelationStrategyFactory._availableStrategiesCache.get('available_strategies');
    }

    const newStrategies = strategies.map(strategy => new CancelationStrategy(strategy, () => {}, []));
    CancelationStrategyFactory._availableStrategiesCache.set('available_strategies', newStrategies);
    return newStrategies;
  }
}

// Define the disposable store data structure
class DisposableStoreDataStructure {
  disposeMode?: DisposeMode;
  data?: any;
  context?: string;
  initialized: boolean;

  constructor(context?: string, disposeMode?: DisposeMode) {
    this.context = context;
    this.disposeMode = disposeMode;
    this.initialized = false;
  }

  init(options: any) {
    this.initialized = true;
    // Initialize the data structure here
  }

  persist() {
    // Persist the data structure here
  }
}

class DisposableStore {
  private _cancellationStrategy: CancelationStrategy;
  private _managedDispose: boolean;
  private _disposeMode?: DisposeMode;
  private _disposables: any[];
  private _options?: any;

  constructor(
    cancellationStrategy: CancelationStrategy,
    options?: any,
    disposeMode?: DisposeMode
  ) {
    this._cancellationStrategy = cancellationStrategy;
    this._managedDispose = false;
    this._disposeMode = disposeMode || this.getDisposeModeFromOptions(options);
    this._disposables = [];
    this._options = options;
  }

  public add(disposable: any): void {
    this._disposables.push(disposable);
  }

  public async dispose(): Promise<void> {
    if (this._managedDispose) {
      return;
    }
    this._managedDispose = true;
    this._cancellationStrategy.strategyFn();
    for (const disposable of this._disposables) {
      await disposable.dispose();
    }
  }

  private getDisposeModeFromOptions(options: any): DisposeMode {
    return options.disposeMode ? options.disposeMode : DisposeMode.TRANSACTIONAL_MODE;
  }
}

class DisposableStoreFactoryEnhancer {
  public static async getDisposableStore(
    strategyName?: string,
    options?: any,
    disposeMode?: DisposeMode
  ): Promise<DisposableStore> {
    const cancellationStrategy = CancelationStrategyFactory.getCancellationStrategy(strategyName);

    if (!cancellationStrategy) {
      throw new Error(`Cancellation strategy not found for ${strategyName}.`);
    }

    const dataStructure = new DisposableStoreDataStructure(strategyName, disposeMode);
    return DisposableStoreFactoryEnhancer._getDisposableStoreInternal(cancellationStrategy, dataStructure);
  }

  private static async _getDisposableStoreInternal(
    strategy: CancelationStrategy,
    dataStructure: DisposableStoreDataStructure
  ): Promise<DisposableStore> {
    const disposablesStore = new DisposableStore(strategy);
    await disposablesStore.init(dataStructure);
    await disposablesStore.persist();
    return disposablesStore;
  }
}