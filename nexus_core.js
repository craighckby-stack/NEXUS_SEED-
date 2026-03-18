class DisposableStoreFactoryEvolutor {
  private disposeStoreFactory: DisposableStoreFactory;

  constructor(disposeStoreFactory: DisposableStoreFactory) {
    this.disposeStoreFactory = disposeStoreFactory;
  }

  getDisposableStoreFactoryWithStrategies(cancellationStrategyFactory: CancelationStrategyFactory) {
    const disposeStoreFactory = new DisposableStoreFactory(cancellationStrategyFactory);
    return {
      getDisposableStore(strategies: CancelationStrategy[], disposeMode: DisposeMode) {
        const disposablesStoreFactoryWithStrategies = new DisposableStoreFactoryWithStrategies(strategies);
        return disposablesStoreFactoryWithStrategies.getDisposableStore(disposeMode);
      }
    };
  }

  getDisposableStoreObserver(disposalStore: DisposableStore) {
    const disposablesStoreObserver = new DisposeStoreObserver(disposalStore);
    return {
      addObserver(observer: (disposableStore: DisposableStore) => void) {
        disposablesStoreObserver.addObserver(observer);
      },
      isDisposed() {
        return disposablesStoreObserver.isDisposed();
      }
    };
  }
}

class DisposableStoreFactory {
  private strategies: CancelationStrategy[] = [];

  constructor(private cancellationStrategyFactory: CancelationStrategyFactory) {}

  addStrategy(strategy: CancelationStrategy) {
    this.strategies.push(strategy);
  }

  getDisposableStore(disposeMode: DisposeMode, options: any): DisposableStore {
    const disposablesStore = new DisposableStore(this.strategies[0], options, disposeMode);
    disposablesStore.init(new DisposeStoreDataStructure(undefined, disposeMode));
    return disposablesStore;
  }
}

class DisposableStoreFactoryWithStrategies {
  private disposablesStoreFactory: DisposableStoreFactory;

  constructor(disposablesStoreFactory: DisposableStoreFactory) {
    this.disposablesStoreFactory = disposablesStoreFactory;
  }

  getDisposableStore(disposeMode: DisposeMode) {
    return this.disposablesStoreFactory.getDisposableStore(disposeMode);
  }
}

class DisposableStoreObserver {
  private disposablesStore: DisposableStore;
  private observers: ((disposableStore: DisposableStore) => void)[];

  constructor(disposablesStore: DisposableStore) {
    this.disposablesStore = disposablesStore;
    this.observers = [];
  }

  addObserver(observer: (disposableStore: DisposableStore) => void) {
    this.observers.push(observer);
  }

  notifyObservers(disposableStore: DisposableStore) {
    this.observers.forEach(observer => observer(disposableStore));
  }

  isDisposed() {
    return this.disposablesStore._managedDispose;
  }
}

class CancelationStrategyFactory {
  private strategies: Map<string, CancelationStrategy> = new Map();

  constructor() {}

  registerCancellationStrategy(strategyName: string, strategyFn: () => void) {
    this.strategies.set(strategyName, new CancelationStrategy(strategyName, strategyFn, []));
  }

  getCancellationStrategy(strategyName: string): CancelationStrategy | undefined {
    const strategy = this.strategies.get(strategyName);
    return strategy;
  }
}

class DisposableStore {
  private _cancellationStrategy: CancelationStrategy;
  private _managedDispose: boolean;
  private _disposeMode?: DisposeMode;
  private _disposables: any[];

  constructor(
    cancellationStrategy: CancelationStrategy,
    options?: any,
    disposeMode?: DisposeMode
  ) {
    this._cancellationStrategy = cancellationStrategy;
    this._managedDispose = false;
    this._disposeMode = disposeMode || this.getDisposeModeFromOptions(options);
    this._disposables = [];
  }

  addDisposable(disposable: any) {
    this._disposables.push(disposable);
  }

  async dispose() {
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
    return options.disposeMode
      ? options.disposeMode
      : DisposeMode.TRANSACTIONAL_MODE;
  }
}

class DisposeStoreDataStructure {
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
  }

  persist() {
    // persist the data structure here
  }
}