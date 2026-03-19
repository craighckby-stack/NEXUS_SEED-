{
  "improvedCode": {
    "class DisposeModeFactory extends Factory": {
      "private disposeModeLogger: IDisposeModeLogger;",
      "private notificationObserver: INotificationObserver;",
      "private disposeModeHelper: DisposeModeHelper;",
      "private factoryLogger: IFactoryLogger;",
      "private factoryMapper: IFactoryMapper;",
      "private disposeModeRegistry: DisposeModeRegistry;",
      "private instanceMap: { [key: string]: DisposeModeFactory };",
      "private static _instance: DisposeModeFactory;",
      "constructor(disposeModeLogger: IDisposeModeLogger, notificationObserver: INotificationObserver, disposeModeHelper: DisposeModeHelper, factoryLogger: IFactoryLogger, factoryMapper: IFactoryMapper, disposeModeRegistry: DisposeModeRegistry) {
        if (!DisposeModeFactory._instance) {
          DisposeModeFactory._instance = this;
          this.disposeModeLogger = disposeModeLogger;
          this.notificationObserver = notificationObserver;
          this.disposeModeHelper = disposeModeHelper;
          this.factoryLogger = factoryLogger;
          this.factoryMapper = factoryMapper;
          this.disposeModeRegistry = disposeModeRegistry;
          this.instanceMap = {};
        }
        return DisposeModeFactory._instance;
      }",
      "static getInstance(disposeModeLogger: IDisposeModeLogger, notificationObserver: INotificationObserver, disposeModeHelper: DisposeModeHelper, factoryLogger: IFactoryLogger, factoryMapper: IFactoryMapper, disposeModeRegistry: DisposeModeRegistry) {
        return new DisposeModeFactory(disposeModeLogger, notificationObserver, disposeModeHelper, factoryLogger, factoryMapper, disposeModeRegistry);
      }",
      "static createDisposeMode(key: string, disposeMode: DisposeMode, disposeModeMap: DisposeModeMap = new DisposeModeMap()) {
        return new DisposeMode(key, disposeMode, disposeModeMap);
      }",
      "static createCompositeDisposeMode(key: string, disposeModes: DisposeMode[]) {
        return new CompositeDisposeMode(key, disposeModes);
      }",
      "async injectAndRegisterFactory(factory: Factory, disposeModeWrapper: DisposeMode) {
        this.disposeModeHelper.registerDisposeMode(factory.key, disposeModeWrapper);
        this.factoryLogger.logFactory(factory);
        await this.factoryMapper.mapFactoryKey(factory.key);
        await this.disposeModeRegistry.getDisposeMode(disposeModeWrapper.key);
      }",
      "async handleDisposeModeInjectionRequest(factoryKey: string, disposeModeKey: string) {
        const factory = await this.factoryMapper.mapFactoryKey(factoryKey);
        const disposeMode = await this.disposeModeRegistry.getDisposeMode(disposeModeKey);
        this.disposeModeHelper.injectDisposeMode(factoryKey, disposeModeKey);
      }",
      "async registerDisposeMode(key: string, disposeMode: DisposeMode) {
        this.disposeModeRegistry.registerDisposeMode(key, disposeMode);
        await this.disposeModeHelper.registerDisposeModes([key]);
      }",
      "async deregisterDisposeMode(key: string) {
        this.disposeModeRegistry.deregisterDisposeMode(key);
        await this.disposeModeHelper.deregisterDisposeMode(key);
      }",
      "private registerDisposeModeMapper(): Promise<void> {
        return Promise.all([
          this.disposeModeHelper.registerDisposeModes(this.disposeModeRegistry.keys()),
          this.factoryMapper.registerFactories(this.disposeModeRegistry.keys())
        ]).then(() => {
          this.disposeModeLogger.logDisposeModes(this.disposeModeRegistry.keys());
        });
      }",
      "private getDisposeMode(key: string): DisposeMode | null {
        return this.disposeModeRegistry.getDisposeMode(key);
      }"
    },
    "class DisposeMode": {
      "private disposeModeLogger: IDisposeModeLogger;",
      "private disposableList: IDisposable[];",
      "private graphDependencies: DisposeModeGraphDependencies;",
      "private disposeModeMap: DisposeModeMap;",
      "private _isDisposed: boolean;",
      "private disposedNode: boolean;",
      "constructor(key: string, disposeModeLogger: IDisposeModeLogger, disposableList: IDisposable[], disposeModeMap: DisposeModeMap) {
        this.disposeModeLogger = disposeModeLogger;
        this.disposableList = disposableList;
        this.graphDependencies = new DisposeModeGraphDependencies();
        this.key = key;
        this.disposeModeMap = disposeModeMap;
        this._isDisposed = false;
        this.disposedNode = false;
      }",
      "addDisposable(disposable: IDisposable) {
        this.disposableList.push(disposable);
        this.graphDependencies.add(deepClone(disposable));
        this.disposeModeMap.registerDisposeMode(this.key, disposable);
      }",
      "removeDisposable(disposable: IDisposable) {
        this.disposableList = this.disposableList.filter(d => d !== disposable);
        this.graphDependencies.remove(deepClone(disposable));
        this.disposeModeMap.deregisterDisposeMode(this.key, disposable);
      }",
      "deregister() {
        this.disposeModeLogger.logDisposeMode(this);
        this._isDisposed = true;
        this.disposableList = [];
        this.graphDependencies = new DisposeModeGraphDependencies();
        this.disposeModeMap = new DisposeModeMap();
      }",
      "getting disposed(): boolean {
        return this._isDisposed;
      }",
      "onDispose(): void {
        this.disposeModeLogger.logDisposeMode(this);
        this.disposedNode = true;
      }"
    },
    "class DisposeModeGraphDependencies implements IDisposable[]": {
      "private dependencies: DisposeMode[];",
      "private _disposed: boolean;",
      "constructor() {
        this.dependencies = [];
        this._disposed = false;
      }",
      "add(dependency: DisposeMode) {
        this.dependencies.push(dependency);
      }",
      "remove(dependency: DisposeMode) {
        const index = this.dependencies.indexOf(dependency);
        if (index !== -1) {
          this.dependencies.splice(index, 1);
        }
      }",
      "deregister() {
        this._disposed = true;
      }",
      "getting disposed(): boolean {
        return this._disposed;
      }",
      "getDependencies(): DisposeMode[] {
        return this.dependencies;
      }"
    },
    "class DisposeModeMap": {
      "private disposalContext: DisposalContext;",
      "private disposabilityGraph: DisposabilityGraph;",
      "private disposeModeList: DisposeMode[];",
      "constructor(disposalContext: DisposalContext, disposabilityGraph: DisposabilityGraph) {
        this.disposalContext = disposalContext;
        this.disposabilityGraph = disposabilityGraph;
        this.disposeModeList = [];
      }",
      "registerDisposeMode(key: string, disposable: IDisposable) {
        this.disposalContext.registerDisposeMode(key, disposable);
        this.disposabilityGraph.injectDisposeMode(key, disposable.key);
        this.disposeModeList.push(disposable);
      }",
      "deregisterDisposeMode(key: string, disposable: IDisposable) {
        const disposeModeIndex = this.disposeModeList.findIndex((disposeMode) => disposeMode.key === key);
        if (disposeModeIndex !== -1) {
          this.disposeModeList.splice(disposeModeIndex, 1);
        }
        this.disposalContext.deregisterDisposeMode(key);
        this.disposabilityGraph.deregisterDisposeMode(key, disposable.key);
      }",
      "getting disposeMode(key: string): DisposeMode | null {
        return this.disposeModeList.find((disposeMode) => disposeMode.key === key);
      }"
    },
    "class DisposalContext": {
      "private disposeModeList: DisposeMode[];",
      "private disposabilityGraph: DisposabilityGraph;",
      "constructor() {
        this.disposeModeList = [];
        this.disposabilityGraph = new DisposabilityGraph();
      }",
      "registerDisposeMode(key: string, disposable: IDisposable) {
        this.disposeModeList.push(disposable);
        this.disposabilityGraph.injectDisposeMode(key, disposable.key);
      }",
      "deregisterDisposeMode(key: string) {
        const disposeModeIndex = this.disposeModeList.findIndex((disposeMode) => disposeMode.key === key);
        if (disposeModeIndex !== -1) {
          this.disposeModeList.splice(disposeModeIndex, 1);
        }
        this.disposabilityGraph.deregisterDisposeMode(key);
      }",
      "getting disposeMode(key: string): DisposeMode | null {
        return this.disposeModeList.find((disposeMode) => disposeMode.key === key);
      }"
    },
    "class DisposabilityGraph": {
      "private nodes: DisposeMode[];",
      "private edges: { [key: string]: DisposeMode[] };",
      "constructor() {
        this.nodes = [];
        this.edges = {};
      }",
      "async injectingDisposeMode(key: string, disposeModeKey: string): Promise<void> {
        if (!this.edges[disposeModeKey]) {
          const dependencies = await this.getGraphDependencies(disposeModeKey);
          this.edges[disposeModeKey] = dependencies;
        }
        this.addEdge(key, disposeModeKey);
      }",
      "async gettingGraphDependencies(key: string): Promise<DisposeMode[]> {
        const dependencies: DisposeMode[] = [];
        for (const edge in this.edges) {
          if (this.edges[edge].includes(key)) {
            dependencies.push(edge);
          }
        }
        return dependencies;
      }",
      "addEdge(key: string, disposeModeKey: string): void {
        if (!this.edges[key]) {
          this.edges[key] = [];
        }
        this.edges[key].push(disposeModeKey);
      }",
      "deregisterDisposeMode(key: string, disposeModeKey: string): void {
        delete this.edges[key];
        this.removeNode(key);
      }",
      "private removeNode(key: string): void {
        this.nodes = this.nodes.filter((node) => node.key !== key);
      }",
      "async getNodes(): Promise<DisposeMode[]> {
        return Promise.resolve(this.nodes);
      }"
    }
  }
}