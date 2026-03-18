// Command.js
class Command {
  private static instanceMap = new Map<string, Command>();

  constructor(public name: string, public handler: (event: any) => void) {}

  static createInstance(name: string, handler: (event: any) => void): Command {
    const instance = Command.instanceMap.get(name);
    if (instance && instance.handler !== handler) {
      instance.handler = handler;
    } else {
      Command.instanceMap.set(name, new Command(name, handler));
    }
    return instance;
  }
}

class CommandContext extends EventTarget {
  private readonly commands = new Map<string, Command>();
  private readonly eventTarget: EventTarget;

  constructor(eventTarget: EventTarget) {
    super();
    this.eventTarget = eventTarget;
  }

  addEventListener(name: string, callback: (event: Event) => void): void {
    super.addEventListener(name, callback);
  }

  registerCommand(command: Command): void {
    this.commands.set(command.name, command);
  }

  dispatchCommand(name: string, event: any): void {
    const command = this.commands.get(name);
    if (command) {
      command.handler(event);
    }
  }
}

// FactoryContext.js
abstract class FactoryContext {
  private disposeModeName: string;
  private disposeMode: DisposeMode;
  protected options: Options;

  constructor(disposeModeName: string, disposeMode: DisposeMode, options: Options) {
    this.disposeModeName = disposeModeName;
    this.disposeMode = disposeMode;
    this.options = options;
  }

  abstract createDisposeModeFactory(): GenkiFactory;

  getDisposeModeName(): string {
    return this.disposeModeName;
  }

  getDisposeMode(): DisposeMode {
    return this.disposeMode;
  }

  getType(): string {
    return 'FactoryContextType';
  }
}

// FactoryContextDecorator.js
class FactoryContextDecorator extends FactoryContext {
  private readonly evolutor: GenkiNexusCoreFactoryEvolutor;

  constructor(disposeModeName: string, disposeMode: DisposeMode, options: Options) {
    super(disposeModeName, disposeMode, options);
    this.evolutor = new GenkiNexusCoreFactoryEvolutor(disposeMode, options);
    this.evolutor.addEventListener('disposeModeChange', (event: Event) => {
      this.onDisposeModeChange(event.detail.name);
    });
  }

  createDisposeModeFactory(): GenkiFactory {
    const factoryContext = FactoryContext.getFactoryContext(this.disposeMode.getDisposeModeName(), this.disposeMode, this.options);
    if (factoryContext) {
      return factoryContext.createDisposeModeFactory();
    }
  }
}

// GenkiNexusCoreFactoryEvolutor.js
class GenkiNexusCoreFactoryEvolutor extends EventTarget {
  private readonly disposeModeCache = new Map<string, GenkiFactory>();
  private readonly bus = new EventBus();
  private readonly logger = new GenkiLogger();
  private commandContext: CommandContext;

  constructor(disposeMode: DisposeMode) {
    super();
    this.commandContext = new CommandContext(this);
    this.disposeModeCache.set('disposeMode1', genkiDisposeModeFactory1(disposeMode));
    this.disposeModeCache.set('disposeMode2', genkiDisposeModeFactory2(disposeMode));
  }

  getDisposeModeFactory(disposeModeName: string): GenkiFactory {
    return this.disposeModeCache.get(disposeModeName);
  }

  onDisposeModeChange(name: string): void {
    this.notifyObservers('disposeModeChange', { name });
  }

  private notifyObservers(name: string, payload: any): void {
    const observers = [] as Observer[];
    observers.forEach((observer: Observer) => observer(name, payload));
  }

  registerObserver(observer: Observer): void {
    observer.on('disposeModeChange', (event: Event) => {
      this.onDisposeModeChange(event.detail.name);
    });
  }
}