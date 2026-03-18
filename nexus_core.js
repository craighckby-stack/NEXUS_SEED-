import type { CancellationToken, CancellationTokenSource } from 'nexus-core';

class DisposableStore extends Disposable {
  private _cancellationTokens: Map<string, CancellationToken>;
  private _otherDisposables: Map<string, Disposable>;

  constructor() {
    super();
    this._cancellationTokens = new Map();
    this._otherDisposables = new Map();
  }

  dispose(): void {
    super.dispose();
    this._cancellationTokens.forEach((token) => token.dispose());
    this._cancellationTokens.clear();
    this._otherDisposables.forEach((disposable) => disposable.dispose());
    this._otherDisposables.clear();
  }

  clear(): void {
    this._cancellationTokens.clear();
    this._otherDisposables.clear();
    super.clear();
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

class MutableDisposableStore extends DisposableStore {
  constructor() {
    super();
  }

  set value(value: CancellationToken | Disposable) {
    if (value instanceof CancellationToken) {
      super.setDisposable(value);
    } else {
      super.value = value;
    }
  }

  get value(): CancellationToken | Disposable {
    return super.getDisposable();
  }
}

class Event implements IDisposable {
  private listeners: Map<string, Callback>;
  private _disposed: boolean;

  constructor() {
    this.listeners = new Map();
    this._disposed = false;
  }

  on(callback: Callback): IDisposable {
    const key = callback.toString();
    if (this._disposed) {
      throw new Error('Event is disposed');
    }
    this.listeners.set(key, callback);
    return {
      disposable: callback,
      uninstall: (): void => {
        if (!this._disposed) {
          this.listeners.delete(key);
        }
      }
    };
  }

  fire(data: any): void {
    this.listeners.forEach((callback) => callback(data));
  }

  dispose(): void {
    this._disposed = true;
    this.listeners.forEach((callback) => callback());
    this.listeners.clear();
  }
}

class Subject extends Event {}

class TokenStore implements IDisposable {
  private disposables: Set<Disposable>;

  constructor() {
    this.disposables = new Set();
  }

  add(disposable: Disposable): IDisposable {
    this.disposables.add(disposable);
    return {
      disposable: disposable,
      uninstall: (): void => {
        this.disposables.delete(disposable);
        disposable.dispose();
      }
    };
  }

  addMany(...disposables: Disposable[]): IDisposable[] {
    return disposables.map((d) => this.add(d));
  }

  clear(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables.clear();
  }

  dispose(): void {
    this.clear();
  }
}

class TokenStoreFactory {
  private tokenStoreCache: Map<string, TokenStore>;

  constructor() {
    this.tokenStoreCache = new Map();
  }

  getTokenStore(tokenStore?: TokenStore): TokenStore {
    if (tokenStore) {
      const key = JSON.stringify(tokenStore);
      if (this.tokenStoreCache.has(key)) {
        return this.tokenStoreCache.get(key);
      }
      this.tokenStoreCache.set(key, tokenStore);
      return tokenStore;
    }
    return this.createTokenStore();
  }

  createTokenStore(): TokenStore {
    return new TokenStore();
  }
}