class DisposeModeRegistry {
    private disposeModeCache: DisposeModeMap;
    private factoryMapper: FactoryMapper;

    constructor(private disposeModeCache: DisposeModeMap = new DisposeModeMap(), private factoryMapper: FactoryMapper = new FactoryMapper()) {
        this.disposeModeCache = disposeModeCache || new DisposeModeMap();
        this.factoryMapper = factoryMapper || new FactoryMapper();
    }

    public static getInstance(): DisposeModeRegistry {
        return DisposeModeRegistry.getInstance();
    }

    public async registerDisposeMode(key: string, disposeMode: DisposeMode): Promise<void> {
        await this.disposeModeCache.registerDisposeMode(key, disposeMode);
        this.factoryMapper.registerFactory(key, disposeMode);
    }

    public async deregisterDisposeMode(key: string): Promise<void> {
        await this.disposeModeCache.deregisterDisposeMode(key);
        this.factoryMapper.deregisterFactory(key);
    }

    public async getDisposeMode(key: string): Promise<DisposeMode | null> {
        return this.disposeModeCache.getDisposeMode(key);
    }

    public async registerDisposeModes(keys: string[]): Promise<void> {
        await Promise.all(keys.map(key => this.registerDisposeMode(key, await this.getDisposeMode(key))));
    }

    public async registerDisposeModesFromCache(keys: string[]): Promise<void> {
        const disposeModes = await this.disposeModeCache.getDisposeModes(keys);
        await Promise.all(keys.map(key => disposeModes[key] ? this.disposeModeCache.registerDisposeMode(key, disposeModes[key]) : Promise.resolve()));
    }

    public async registerFactoriesFromCache(keys: string[]): Promise<void> {
        const factories = this.factoryMapper.getFactories(keys);
        await Promise.all(keys.map(key => factories[key] ? this.factoryMapper.registerFactory(key, factories[key]) : Promise.resolve()));
    }

    public async handleDisposeModeInjectionRequest(factoryKey: string, disposeModeKey: string): Promise<void> {
        const factory = this.factoryMapper.getFactory(factoryKey);
        const disposeMode = await this.disposeModeCache.getDisposeMode(disposeModeKey);
        if (factory && disposeMode) {
            await this.injectAndRegisterFactory(factory, disposeMode);
        } else {
            console.error('Invalid factory or dispose mode for injection request.');
        }
    }

    public async injectAndRegisterFactory(factory: Factory, disposeMode: DisposeMode): Promise<void> {
        await this.disposeModeCache.registerDisposeMode(factory.key, disposeMode);
        this.factoryMapper.registerFactory(factory.key, disposeMode);
        await factory.injectDependencies();
    }
}

class DisposeModeMap {
    private cache: { [key: string]: DisposeMode };

    constructor() {
        this.cache = {};
    }

    public registerDisposeMode(key: string, disposeMode: DisposeMode): void {
        if (!key || !disposeMode) {
            throw new Error('Invalid Dispose Mode Registration');
        }
        this.cache[key] = disposeMode;
    }

    public deregisterDisposeMode(key: string): void {
        delete this.cache[key];
    }

    public getDisposeMode(key: string): DisposeMode | null {
        return this.cache[key];
    }

    public getDisposeModes(keys: string[]): { [key: string]: DisposeMode } {
        const disposeModes: { [key: string]: DisposeMode } = {};
        keys.forEach(key => disposeModes[key] = this.cache[key]);
        return disposeModes;
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

    public registerFactory(key: string, disposeMode: DisposeMode): void {
        this.factories[key] = disposeMode;
    }

    public deregisterFactory(key: string): void {
        delete this.factories[key];
    }

    public getFactory(key: string): DisposeMode | null {
        return this.factories[key];
    }
}

class DisposeMode {
    private disposeModeLogger: IDisposeModeLogger;
    private disposedNode: boolean;

    constructor(private disposeModeLogger: IDisposeModeLogger) {
        this.disposeModeLogger = disposeModeLogger;
        this.disposedNode = false;
    }

    public async deregister(): Promise<void> {
        this.disposeModeLogger.logDisposeMode(this);
        this.disposedNode = true;
    }
}