import type { IDisposable, CancellationToken, Disposable, Callback } from 'nexus-core';

// Factory for creating DisposableStores with specific cancellation behavior
class DisposableStoreFactory {
  private static defaultCancellationStrategy: () => void = () => {};
  private static cancellationStrategies: Map<string, () => void> = new Map();

  static registerCancellationStrategy(strategyName: string, strategyFn: () => void): void {
    DisposableStoreFactory.cancellationStrategies.set(strategyName, strategyFn);
  }

  static createDisposableStore(strategyName?: string): DisposableStore {
    if (strategyName) {
      const strategyFn = DisposableStoreFactory.cancellationStrategies.get(strategyName);
      if (strategyFn) {
        return new DisposableStore(strategyFn);
      }
    }
    return new DisposableStore();
  }
}

// DisposableStore with customized cancellation behavior
class DisposableStore extends Disposable {
  private _cancellationTokens: Map<string, CancellationToken>;
  private _otherDisposables: Map<string, Disposable>;

  constructor(strategyFn?: () => void) {
    super();
    this._cancellationTokens = new Map();
    this._otherDisposables = new Map();
  }

  dispose(): void {
    this.cancel();
    super.dispose();
  }

  cancel(): void {
    this._cancellationTokens.forEach((token) => token.dispose());
    this._cancellationTokens.clear();
  }

  add(disposable: CancellationToken | Disposable): IDisposable {
    if (disposable instanceof CancellationToken) {
      return this.addCancellationToken(disposable);
    } else {
      return this.addOtherDisposable(disposable);
    }
  }

  private addCancellationToken(token: CancellationToken): IDisposable {
    const key = token.toString();
    this._cancellationTokens.set(key, token);
    return {
      disposable: token,
      uninstall: (): void => {
        this._cancellationTokens.delete(key);
        token.dispose();
      }
    };
  }

  private addOtherDisposable(disposable: Disposable): IDisposable {
    const key = disposable.toString();
    this._otherDisposables.set(key, disposable);
    return {
      disposable: disposable,
      uninstall: (): void => {
        this._otherDisposables.delete(key);
        disposable.dispose();
      }
    };
  }

  addMany(...disposables: CancellationToken[] | Disposable[]): IDisposable[] {
    const cancellationTokens = disposables.filter((d) => d instanceof CancellationToken);
    const otherDisposables = disposables.filter((d) => !(d instanceof CancellationToken));
    return [...cancellationTokens.map((token) => this.addCancellationToken(token)), ...otherDisposables.map((disposable) => this.addOtherDisposable(disposable))];
  }

  clearCancellations(): void {
    this._cancellationTokens.entries().forEach((entry) => entry[1].dispose());
    this._cancellationTokens.clear();
  }
}

// Decorator pattern for TokenStore
class TokenStoreDecorator {
  private readonly decoratedTokenStore: TokenStore;

  constructor(decoratedTokenStore: TokenStore) {
    this.decoratedTokenStore = decoratedTokenStore;
  }

  add(disposable: Disposable): IDisposable {
    return this.decoratedTokenStore.add(disposable);
  }

  addMany(...disposables: Disposable[]): IDisposable[] {
    return this.decoratedTokenStore.addMany(...disposables);
  }

  clear(): void {
    this.decoratedTokenStore.clear();
  }

  dispose(): void {
    this.decoratedTokenStore.dispose();
  }

  static decorateTokenStore(tokenStore: TokenStore): TokenStoreDecorator {
    return new TokenStoreDecorator(tokenStore);
  }
}

// Abstract Subject class for event handling
abstract class Event {
  private listeners: Map<string, Callback>;

  constructor() {
    this.listeners = new Map();
  }

  on(callback: Callback): IDisposable {
    const key = callback.toString();
    this.listeners.set(key, callback);
    return {
      disposable: callback,
      uninstall: (): void => {
        this.listeners.delete(key);
      },
    };
  }

  fire(data: any): void {
    this.listeners.forEach((callback) => callback(data));
  }

  dispose(): void {
    this.listeners.clear();
  }

  abstract subscribe(listener: Callback): IDisposable;

  abstract unsubscribe(listener: Callback): void;
}

// Concrete Subject class
class ConcreteEvent extends Event {
  subscribe(listener: Callback): IDisposable {
    return this.on(listener);
  }

  unsubscribe(listener: Callback): void {
    this.on(listener).uninstall();
  }
}

// Observer pattern for DisposableStore
class DisposableStoreObserver extends DisposableStore {
  private subject: Event;

  constructor(subject: Event) {
    super();
    this.subject = subject;
  }

  observe(observer: Callback): IDisposable {
    return this.subject.on(observer);
  }
}

// DisposeObserver class for disposing of observers
class DisposeObserver {
  private subject: Event;
  private disposableStore: DisposableStore;

  constructor(subject: Event, disposableStore: DisposableStore) {
    this.subject = subject;
    this.disposableStore = disposableStore;
  }

  disposeObservers(): void {
    this.subject.listeners.forEach((callback) => callback());
    this.disposableStore.cancel();
  }
}

// Factory for creating TokenStores with custom behavior
class TokenStoreFactory {
  private tokenStoreCache: Map<string, TokenStore>;

  constructor() {
    this.tokenStoreCache = new Map();
  }

  getTokenStore(tokenStore?: TokenStore): TokenStore {
    if (tokenStore) {
      const key = TokenStore.toString();
      if (this.tokenStoreCache.has(key)) {
        return this.tokenStoreCache.get(key);
      }
    }
    return TokenStoreDecorator.decorateTokenStore(new TokenStore());
  }

  createTokenStore(): TokenStore {
    return TokenStoreDecorator.decorateTokenStore(new TokenStore());
  }
}

// Example usage:

// Create a disposable store factory and register a custom cancellation strategy
DisposableStoreFactory.registerCancellationStrategy('custom-cancellation-strategy', () => {
  console.log('Custom cancellation strategy called');
});

// Create a disposable store with the custom cancellation strategy
const disposableStore = DisposableStoreFactory.createDisposableStore('custom-cancellation-strategy');

// Create a token store factory
const tokenStoreFactory = new TokenStoreFactory();

// Create a token store with decorated behavior
const tokenStore = tokenStoreFactory.getTokenStore();