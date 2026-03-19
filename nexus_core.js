class DisposeModeRegistry {
    private disposeModeCache: DisposeModeMap;
    private factoryMapper: FactoryMapper;
    private disposeModeFactory: DisposeModeFactory;

    constructor(private disposeModeCache: DisposeModeMap = new DisposeModeMap(), private factoryMapper: FactoryMapper = new FactoryMapper()) {
        this.disposeModeCache = disposeModeCache || new DisposeModeMap();
        this.factoryMapper = factoryMapper || new FactoryMapper();
        this.disposeModeFactory = new DisposeModeFactory(this.disposeModeCache);
    }

    public static getInstance(): DisposeModeRegistry {
        return DisposeModeRegistry.getInstance();
    }

    public async registerDisposeMode(key: string, disposeMode: DisposeMode): Promise<void> {
        await this.disposeModeCache.registerDisposeMode(key, disposeMode);
        this.disposeModeFactory.registerDisposeMode(key, disposeMode);
        this.factoryMapper.registerFactory(key, disposeMode);
    }

    public async deregisterDisposeMode(key: string): Promise<void> {
        await this.disposeModeCache.deregisterDisposeMode(key);
        this.disposeModeFactory.deregisterDisposeMode(key);
        this.factoryMapper.deregisterFactory(key);
    }

    public async getDisposeMode(key: string): Promise<DisposeMode | null> {
        return this.disposeModeCache.getDisposeMode(key);
    }

    public async registerDisposeModes(keys: string[]): Promise<void> {
        await Promise.all(keys.map(async (key) => await this.registerDisposeMode(key, await this.disposeModeCache.getDisposeMode(key))));
    }

    public async registerDisposeModesFromCache(keys: string[]): Promise<void> {
        await Promise.all(keys.map(async (key) => {
            const disposeMode = await this.disposeModeCache.getDisposeMode(key);
            if (disposeMode) {
                await this.disposeModeFactory.registerDisposeMode(key, disposeMode);
            }
        }));
    }

    public async deregisterDisposeModes(keys: string[]): Promise<void> {
        await Promise.all(keys.map(async (key) => await this.deregisterDisposeMode(key)));
    }

    public async handleDisposeModeInjectionRequest(factoryKey: string, disposeModeKey: string): Promise<void> {
        const disposeModeFactory = await this.disposeModeFactory.getDisposeModeFactory(disposeModeKey);
        const disposeMode = await this.disposeModeCache.getDisposeMode(disposeModeKey);
        if (disposeModeFactory && disposeMode) {
            await this.injectAndRegisterFactory(disposeModeFactory, disposeMode);
        } else {
            throw new Error('Invalid dispose mode factory or dispose mode for injection request.');
        }
    }

    public async injectAndRegisterFactory(factory: DisposeModeFactory, disposeMode: DisposeMode): Promise<void> {
        await this.disposeModeCache.registerDisposeMode(factory.getKey(), disposeMode);
        this.disposeModeFactory.registerDisposeMode(factory.getKey(), disposeMode);
        await factory.injectDependencies();
    }
}

class DisposeModeFactory {
    private disposeModeCache: DisposeModeMap;
    private disposeModeFactories: { [key: string]: DisposeMode };

    constructor(private disposeModeCache: DisposeModeMap = new DisposeModeMap()) {
        this.disposeModeCache = disposeModeCache || new DisposeModeMap();
        this.disposeModeFactories = {};
    }

    public static getInstance(disposeModeCache: DisposeModeMap): DisposeModeFactory {
        return new DisposeModeFactory(disposeModeCache);
    }

    public async registerDisposeMode(key: string, disposeMode: DisposeMode): Promise<void> {
        await this.disposeModeCache.registerDisposeMode(key, disposeMode);
        this.disposeModeFactories[key] = disposeMode;
    }

    public async deregisterDisposeMode(key: string): Promise<void> {
        delete this.disposeModeFactories[key];
        await this.disposeModeCache.deregisterDisposeMode(key);
    }

    public async getDisposeModeFactory(key: string): Promise<DisposeModeFactory | null> {
        return this.disposeModeFactories[key] || null;
    }

    public getKey(): string {
        return 'disposeModeFactory';
    }

    public async injectDependencies(): Promise<void> {
        return Promise.resolve();
    }
}

class DisposeMode {
    constructor() {}
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

    public async getDisposeMode(key: string): Promise<DisposeMode | null> {
        return this.cache[key] || null;
    }

    public async getDisposeModes(keys: string[]): Promise<{ [key: string]: DisposeMode }> {
        return keys.reduce((acc, key) => {
            acc[key] = this.cache[key];
            return acc;
        }, {});
    }
}

class Factory {
    private key: string;

    constructor(key: string) {
        this.key = key;
    }

    public injectDependencies(): Promise<void> {
        return Promise.resolve();
    }
}

class FactoryMapper {
    private factories: { [key: string]: DisposeMode };

    constructor() {
        this.factories = {};
    }

    public async registerFactory(key: string, disposeMode: DisposeMode): Promise<void> {
        this.factories[key] = disposeMode;
    }

    public async deregisterFactory(key: string): Promise<void> {
        delete this.factories[key];
    }

    public async getFactory(key: string): Promise<DisposeMode | null> {
        return this.factories[key] || null;
    }
}