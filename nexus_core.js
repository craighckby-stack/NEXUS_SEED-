class DisposeModeFactory implements Disposable {
  private readonly disposeModeCache: DisposeModeMap;
  private readonly asyncContext: AsyncContext;

  constructor(private disposeModeCache: DisposeModeMap = new DisposeModeMap(), private asyncContext: AsyncContext = new AsyncContext()) {
    this.disposeModeCache = disposeModeCache;
    this.asyncContext = asyncContext;
  }

  public getInstance(disposeModeCache: DisposeModeMap = this.disposeModeCache, asyncContext: AsyncContext = this.asyncContext): DisposeModeFactory {
    return new DisposeModeFactory(disposeModeCache, asyncContext);
  }

  public async registerDisposeMode(key: string, disposeMode: DisposeMode): Promise<void> {
    await this.disposeModeCache.registerDisposeMode(key, disposeMode);
    await this.asyncContext.invokeObserver('DISPOSE_MODE_REGISTERED', disposeMode);
  }

  public async deregisterDisposeMode(key: string): Promise<void> {
    await this.disposeModeCache.deregisterDisposeMode(key);
  }

  public async injectDependencies(): Promise<void> {
    const disposeModes = await this.disposeModeCache.getDisposeModes(Object.keys(this.disposeModeCache.cache));
    for (const key in disposeModes) {
      const disposeMode = disposeModes[key];
      await disposeMode.enterState('DEPENDENCIES_INJECTED');
      this.asyncContext.invokeObserver('DEPENDENCIES_INJECTED', disposeMode);
    }
  }
}

class DisposeMode implements Observer {
  private state: DisposeModeStateType;
  private observers: Disposable[];

  constructor(private disposeModeFactory: DisposeModeFactory) {
    this.state = null;
    this.observers = [];
  }

  public async enterState(state: DisposeModeStateType): Promise<void> {
    this.state = state;
    this.observers.forEach((observer) => observer.notify());
  }

  public async registerObserver(observer: Disposable): Promise<void> {
    this.observers.push(observer);
  }

  public async unregisterObserver(observer: Disposable): Promise<void> {
    this.observers = this.observers.filter((o) => o !== observer);
  }

  public async notify(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

class DisposeModeMap {
  private cache: { [key: string]: DisposeMode };

  constructor() {
    this.cache = {};
  }

  public async registerDisposeMode(key: string, disposeMode: DisposeMode): Promise<void> {
    this.cache[key] = disposeMode;
  }

  public async deregisterDisposeMode(key: string): Promise<void> {
    delete this.cache[key];
  }

  public async getDisposeModes(keys: string[]): Promise<{ [key: string]: DisposeMode }> {
    const disposeModes = await this.asyncContext.invokeAsyncCallback(() => {
      return keys.reduce((acc, key) => {
        acc[key] = this.cache[key];
        return acc;
      }, {});
    });
    return disposeModes;
  }
}

class DisposeModeServiceProxy {
  private disposeModeFactory: DisposeModeFactory;

  constructor(private disposeModeFactory: DisposeModeFactory) {
    this.disposeModeFactory = disposeModeFactory;
  }

  public async getDisposeModes(): Promise<DisposeMode[]> {
    return Object.values(this.disposeModeFactory.disposeModeCache.cache);
  }

  public async registerDisposeMode(key: string, disposeMode: DisposeMode): Promise<void> {
    await this.disposeModeFactory.registerDisposeMode(key, disposeMode);
  }

  public async deregisterDisposeMode(key: string): Promise<void> {
    await this.disposeModeFactory.deregisterDisposeMode(key);
  }
}

class Disposable {
  public async notify(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

class Observer {
  public async notify(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async registerObserver(observer: Disposable): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async unregisterObserver(observer: Disposable): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

class AsyncContext {
  private readonly observers: Disposable[];

  constructor() {
    this.observers = [];
  }

  public async invokeObserver(event: string, observer: Disposable): Promise<void> {
    this.observers.push(observer);
    if (event === 'DEPENDENCIES_INJECTED') {
      for (const observer of this.observers) {
        await observer.notify();
        this.observers = this.observers.filter((o) => o !== observer);
      }
    }
  }

  public async invokeAsyncCallback(callback: () => Promise<any>): Promise<any> {
    return callback();
  }
}

async function main() {
  const disposeModeCache = new DisposeModeMap();
  const disposeModeFactory = new DisposeModeFactory(disposeModeCache, new AsyncContext());
  await disposeModeFactory.injectDependencies();

  const disposeModeServiceProxy = new DisposeModeServiceProxy(disposeModeFactory);

  while (true) {
    console.log('DisposeModes Registered:', await disposeModeServiceProxy.getDisposeModes());
    console.log('DisposeModes Deregistered:', await disposeModeServiceProxy.getDisposeModes());

    const disposeMode = new DisposeMode(disposeModeFactory);
    await disposeModeServiceProxy.registerDisposeMode('test', disposeMode);

    await disposeModeServiceProxy.deregisterDisposeMode('test');
  }
}

main();