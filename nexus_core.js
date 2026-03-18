import type { CancellationToken, CancellationTokenSource } from 'nexus-core';

class DisposableStore extends Disposable {
  private _cancellationTokens: TokenStore;

  constructor() {
    super();
    this._cancellationTokens = new TokenStore();
  }

  dispose(): void {
    super.dispose();
    this._cancellationTokens.dispose();
  }

  clear(): void {
    this._cancellationTokens.clear();
    super.clear();
  }

  add(disposable: CancellationToken | Disposable): Disposable {
    if (disposable instanceof CancellationToken) {
      return this._cancellationTokens.add(disposable);
    }
    return super.add(disposable);
  }

  addMany(...disposables: CancellationToken[] | Disposable[]): Disposable[] {
    const cancellationTokens = disposables.filter((d) => d instanceof CancellationToken);
    const otherDisposables = disposables.filter((d) => !(d instanceof CancellationToken));
    if (cancellationTokens.length > 0) {
      const tokenStore = this._cancellationTokens.addMany(...cancellationTokens);
      return tokenStore.map((item) => ({ disposable: item }));
    }
    return super.addMany(...otherDisposables);
  }

  clearCancellations(): void {
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

class Event {
  private listeners: Callback[];

  constructor() {
    this.listeners = [];
  }

  on(callback: Callback): IDisposable {
    return this.listeners.push(callback);
  }

  fire(data: any): void {
    this.listeners.forEach((callback) => callback(data));
  }
}

class Subject extends Event {}

class TokenStore {
  private disposables: Disposable[];

  constructor() {
    this.disposables = new Set();
  }

  add(disposable: Disposable): IDisposable {
    this.disposables.add(disposable);
    return { 
      disposable, 
      uninstall: () => this.disposables.delete(disposable) 
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

  private createTokenStore(): TokenStore {
    return new TokenStore();
  }
}