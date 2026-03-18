class DisposableStoreEvolver extends DisposableStoreFactory {
  private static cache = new Map({
    capacity: 10
  });

  static registerCancellationStrategy(strategyName: string, strategyFn: () => void): void {
    if (!DisposableStoreEvolver.defaultCancellationStrategies.has(strategyName)) {
      DisposableStoreEvolver.defaultCancellationStrategies.set(strategyName, strategyFn);
    }
  }

  static createDisposableStore(strategyName?: string): Promise<DisposableStore> {
    const cachedStore = DisposableStoreEvolver.cache.get(strategyName);
    if (cachedStore) {
      return Promise.resolve(cachedStore);
    }

    const strategyFn = DisposableStoreEvolver.getCancellationStrategy(strategyName);
    if (!strategyFn) {
      throw new Error(`Cancellation strategy not found for ${strategyName}.`);
    }

    return DisposableStoreEvolver.createDisposableStoreSlow(strategyName, strategyFn).then((store) => {
      DisposableStoreEvolver.cache.set(strategyName, store);
      return store;
    });
  }

  static createDisposableStoreSlow(strategyName?: string, strategyFn?: () => void): Promise<DisposableStore> {
    return Promise.resolve(new DisposableStore(strategyFn ? strategyFn : () => {}));
  }

  static getCancellationStrategy(strategyName: string): () => void {
    return DisposableStoreEvolver.defaultCancellationStrategies.get(strategyName);
  }
}

class DisposableStoreCache {
  private static cache = new Map({
    capacity: 10
  });

  static clearCache(): void {
    DisposableStoreCache.cache.clear();
  }

  static getDisposableStore(strategyName?: string): Promise<DisposableStore> {
    const cachedStore = DisposableStoreCache.cache.get(strategyName);
    if (cachedStore) {
      return Promise.resolve(cachedStore);
    }

    return DisposableStoreEvolver.createDisposableStore(strategyName);
  }
}

class DisposableStoreObserverEvolved extends DisposableStoreObserver {
  observe(observer: Callback): IDisposable {
    const disposableStoreObserver = DisposableStoreObserverEvolved.prototype._disposableStore.observe(observer);
    return {
      disposable: disposableStoreObserver.disposable,
      uninstall: (): void => {
        disposableStoreObserver.uninstall();
      },
      disposeStore: (): void => {
        DisposableStoreEvolver.cache.delete('default');
        DisposableStoreCache.clearCache();
      },
    };
  }

  disposeObservers(): void {
    DisposableStoreEvolver.cache.delete('default');
    DisposableStoreCache.clearCache();
    super.disposeObservers();
  }
}

class DisposableStoreDecorator {
  private _decoratedTokenStore: DisposableStore;

  constructor(_decoratedTokenStore: DisposableStore) {
    this._decoratedTokenStore = _decoratedTokenStore;
  }

  add(disposable: CancellationToken | Disposable): IDisposable {
    return this._decoratedTokenStore.add(disposable);
  }

  addMany(...disposables: CancellationToken[] | Disposable[]): IDisposable[] {
    return this._decoratedTokenStore.addMany(...disposables);
  }

  clear(): void {
    this._decoratedTokenStore.clear();
  }

  dispose(): void {
    this._decoratedTokenStore.dispose();
  }

  decorateTokenStore(tokenStore: DisposableStore): DisposableStoreDecorator {
    return new DisposableStoreDecorator(tokenStore);
  }
}

abstract class EventEvolved extends Event {
  private _lazyListeners: Map<string, Callback> = new Map();
  private _pendingCallbacks: Map<string, Callback> = new Map();
  private _disposed: boolean = false;

  subscribe(listener: Callback): IDisposable {
    if (this._disposed) {
      throw new Error('Cannot subscribe to a disposed Event');
    }
    const key = listener.toString();
    this._lazyListeners.set(key, listener);
    return {
      disposable: listener,
      uninstall: (): void => {
        this._lazyListeners.delete(key);
      },
      resolveCallback: (index: number, resolve: (value?: void | PromiseLike<void>) => void): void => {
        if (this._disposed) {
          throw new Error('Cannot resolve a pending callback for a disposed Event');
        }
        this._pendingCallbacks.set(index, listener);
      },
    };
  }

  unsubscribe(listener: Callback): void {
    if (this._disposed) {
      return;
    }
    this._lazyListeners.delete(listener.toString());
    const pendingCallback = this._pendingCallbacks.get(listener.toString());
    if (pendingCallback) {
      this._pendingCallbacks.delete(listener.toString());
    }
  }

  fire(data: any): void {
    this._lazyListeners.forEach((callback) => {
      callback(data);
    });
    if (this._pendingCallbacks.size === 0) {
      return;
    }
    this._pendingCallbacks.forEach((pendingCallback, index) => {
      const resolveCallback = this._pendingCallbacksResolve.get(this._pendingCallbacks.keys().next().value);
      if (resolveCallback) {
        resolveCallback(data);
      }
    });
  }

  protected disposeLazyListeners(): void {
    this._lazyListeners.clear();
  }

  dispose(): void {
    this._disposed = true;
    this.disposeLazyListeners();
    this._pendingCallbacks.clear();
    this._pendingCallbacksResolve.clear();
    super.dispose();
  }
}

class ConcreteEventEvolved extends EventEvolved {
  subscribe(listener: Callback): IDisposable {
    return super.subscribe(listener);
  }

  unsubscribe(listener: Callback): void {
    super.unsubscribe(listener);
  }
}

class DisposableStoreConcurrentEvolver {
  private _stores: DisposableStore[];

  constructor(_stores: DisposableStore[]) {
    this._stores = _stores;
  }

  registerCancellationStrategy(strategyName: string, strategyFn: () => void): void {
    DisposableStoreEvolver.registerCancellationStrategy(strategyName, strategyFn);
    this._stores.forEach((store) => {
      store.registerCancellationStrategy(strategyName, strategyFn);
    });
  }

  createDisposableStore(strategyName?: string): Promise<DisposableStore> {
    return DisposableStoreEvolver.createDisposableStore(strategyName);
  }
}