import { EventBus } from 'event-bus-js';
import { GenkiLogger } from 'genki-logger';
import { Observer } from 'observer-js';
import { DisposeMode1, DisposeMode2, DisposeModes } from './dispose-modes';
import { GenkiFactory, GenkiFactoryFactory } from './genki-factory';
import { CompositeDisposable } from 'lib/composite-disposable';

const log = new GenkiLogger('nexus-core');

class Command {
  private static instanceMap = new Map<string, Command>();

  private constructor(
    public readonly name: string,
    public readonly handler: (event: any) => void,
    public readonly eventTarget: EventTarget,
  ) {}

  static createInstance(
    name: string,
    handler: (event: any) => void,
  ): Command {
    const instance = Command.instanceMap.get(name);
    if (instance && instance.handler !== handler) {
      instance.handler = handler;
    } else {
      const eventTarget = new EventTarget();
      Command.instanceMap.set(name, new Command(name, handler, eventTarget));
    }
    return instance;
  }
}

class CommandContext extends EventTarget implements EventTargetListener {
  private readonly commands = new Map<string, Command>();
  private compositeDisposable: CompositeDisposable;

  constructor() {
    super();
    this.compositeDisposable = new CompositeDisposable();
  }

  addEventListener(name: string, callback: (event: any) => void): void {
    super.addEventListener(name, callback);
    this.compositeDisposable.add(
      super.listeners.get(name)?.findIndex(callback) >= -1 ?
        () => {
          super.removeEventListener(name, callback);
          this.compositeDisposable.remove(
            () => {
              super.removeEventListener(name, callback);
            },
          );
        } :
        () => void 0,
    );
  }

  static registerCommand(commandContext: CommandContext, command: Command): void {
    commandContext.commands.set(command.name, command);
  }

  registerCommand(command: Command): void {
    Command.registerCommand(this, command);
  }

  dispatchCommand(name: string, event: any): void {
    const command = this.commands.get(name);
    if (command) {
      command.handler(event);
    }
  }

  dispose(): void {
    this.commands.forEach(command => command.eventTarget.removeEventListener('dispose', () => void 0));
    this.compositeDisposable.dispose();
  }
}

abstract class FactoryContext {
  private disposeModeName: string;
  private disposeMode: DisposeMode;
  protected options: Options;
  private compositeDisposable: CompositeDisposable;

  constructor(disposeModeName: string, disposeMode: DisposeMode, options: Options) {
    this.disposeModeName = disposeModeName;
    this.disposeMode = disposeMode;
    this.options = options;
    this.compositeDisposable = new CompositeDisposable();
  }

  abstract createDisposeModeFactory(options: Options): GenkiFactory;

  getDisposeModeName(): string {
    return this.disposeModeName;
  }

  getDisposeMode(): DisposeMode {
    return this.disposeMode;
  }

  getType(): string {
    return 'FactoryContextType';
  }

  static getFactoryContext(disposeModeName: string, disposeMode: DisposeMode, options: Options): FactoryContext | undefined {
    return undefined;
  }

  protected get genkiFactoryFactory(): GenkiFactoryFactory {
    return this.options.genkiFactoryFactory;
  }

  onDisposeModeChange(name: string): void {
    this.eventTarget.dispatchEvent({
      type: 'disposeModeChange',
      detail: { name },
    });
  }

  protected onDisposeModeChanged(): void {
    this.eventTarget.dispatchEvent({
      type: 'disposeModeUpdate',
    });
  }
}

class FactoryContextDecorator extends FactoryContext {
  private readonly evolutor: GenkiNexusCoreFactoryEvolutor;

  constructor(disposeModeName: string, disposeMode: DisposeMode, options: Options) {
    super(disposeModeName, disposeMode, options);
    this.evolutor = new GenkiNexusCoreFactoryEvolutor(disposeMode, options);
    this.evolutor.addEventListener('disposeModeChange', (event: Event) => {
      this.onDisposeModeChange(event.detail.name);
    });
  }

  createDisposeModeFactory(options: Options): GenkiFactory {
    const factoryContext = FactoryContext.getFactoryContext(this.disposeMode.getDisposeModeName(), this.disposeMode, this.options);
    if (factoryContext) {
      return factoryContext.createDisposeModeFactory(options);
    }
  }

  registerObserver(observer: Observer): void {
    observer.on('disposeModeChange', (event: Event) => {
      this.evolutor.notifyObservers('disposeModeChange', event.detail);
    });
  }

  abstract eventTarget: EventTarget;
}

class GenkiNexusCoreFactoryEvolutor extends CompositeDisposable {
  private disposeModeCache = new Map<string, GenkiFactory>();
  private disposeMode: DisposeMode;

  constructor(disposeMode: DisposeMode) {
    super();
    this.disposeMode = disposeMode;
    this.disposeModeCache.set('disposeMode1', genkiDisposeModeFactory1(disposeMode));
    this.disposeModeCache.set('disposeMode2', genkiDisposeModeFactory2(disposeMode));
    this.disposeModeCache.forEach((factory, disposeModeName) => {
      this.add(factory);
    });
  }

  static getDisposeModeFactory(disposeModeName: string): GenkiFactory {
    return this.getInstance(disposeModeName)?.getDisposeModeFactory();
  }

  notifyObservers(name: string, payload: any): void {
    this.forEach(factory => factory.getEventTarget().dispatchEvent({
      type: 'disposeModeUpdate',
    }));
    this.forEach(factory => factory.handlers.forEach(handler => handler(payload)));
  }

  getObserver(): Observer {
    const observer = new Observer();
    this.add(observer);
    return observer;
  }

  registerObserver(observer: Observer): void {
    this.add(observer);
  }
}

class GenkiFactoryFactory {
  private factoryContext: FactoryContext;

  constructor(options: Options) {
    this.factoryContext = FactoryContext.getFactoryContext(options.disposeModeName, options.disposeMode, options);
  }

  getFactoryContext(): FactoryContext {
    return this.factoryContext;
  }

  createDisposeModeFactory(options: Options): GenkiFactory {
    return this.factoryContext.createDisposeModeFactory(options);
  }
}

interface Options {
  disposeModeName: string;
  disposeMode: DisposeMode;
  genkiFactoryFactory: GenkiFactoryFactory;
}

interface DisposeMode {
  getName(): DisposeModeName;
}

enum DisposeModeName {
  DisposeMode1 = 'disposeMode1',
  DisposeMode2 = 'disposeMode2',
}

class DisposeMode1 implements DisposeMode {
  getName(): DisposeModeName {
    return DisposeModeName.DisposeMode1;
  }
}

class DisposeMode2 implements DisposeMode {
  getName(): DisposeModeName {
    return DisposeModeName.DisposeMode2;
  }
}

interface GenkiFactory {
  createInstance(): void;
}

function genkiDisposeModeFactory1(disposeMode: DisposeMode): GenkiFactory {
  return disposeModes[disposeMode.getName()](disposeMode);
}

function genkiDisposeModeFactory2(disposeMode: DisposeMode): GenkiFactory {
  return disposeMode;
}