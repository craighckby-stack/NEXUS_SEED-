/**
 * EMG-CORE: Sovereign Kernel
 * The Central Nervous System of the Application.
 * 
 * Directives:
 * 1. Maintain Singleton state.
 * 2. Orchestrate module lifecycle (Boot -> Run -> Shutdown).
 * 3. Provide decoupled event propagation.
 */

export type ModuleId = string;

/**
 * Standard interface for all subsystems attached to the Kernel.
 */
export interface SovereignModule {
  id: ModuleId;
  version: string;
  onBoot(kernel: SovereignKernel): Promise<void>;
  onShutdown?(): Promise<void>;
}

// Generic Event Map - extensible by consumers
export interface KernelEvents {
  'KERNEL_IGNITION': { timestamp: number };
  'KERNEL_ERROR': { error: Error; source?: string };
  'KERNEL_SHUTDOWN': { reason: string };
  [key: string]: any;
}

export class SovereignKernel {
  private static instance: SovereignKernel;
  private modules: Map<ModuleId, SovereignModule> = new Map();
  private eventBus: Map<string, Array<(payload: any) => void>> = new Map();
  private isRunning: boolean = false;
  private startTime: number = 0;

  private constructor() {
    // Hermetic seal
  }

  /**
   * Access the Singular Instance of the Core.
   */
  public static get(): SovereignKernel {
    if (!SovereignKernel.instance) {
      SovereignKernel.instance = new SovereignKernel();
    }
    return SovereignKernel.instance;
  }

  /**
   * Assimilate a new module into the collective.
   */
  public register(module: SovereignModule): this {
    if (this.modules.has(module.id)) {
      throw new Error(`[Kernel] Architectural conflict: Module '${module.id}' is already assimilated.`);
    }
    this.modules.set(module.id, module);
    return this;
  }

  /**
   * Begin the evolution cycle.
   */
  public async ignite(): Promise<void> {
    if (this.isRunning) return;
    this.startTime = Date.now();
    console.log(`[Kernel] Ignition Sequence Initiated :: ${new Date(this.startTime).toISOString()}`);

    const bootSequence = Array.from(this.modules.values()).map(async (mod) => {
      try {
        console.log(`[Kernel] Booting Sector: ${mod.id} v${mod.version}`);
        await mod.onBoot(this);
      } catch (err) {
        this.emit('KERNEL_ERROR', { error: err as Error, source: mod.id });
        throw err; // Critical failure aborts ignition
      }
    });

    await Promise.all(bootSequence);
    this.isRunning = true;
    this.emit('KERNEL_IGNITION', { timestamp: this.startTime });
    console.log(`[Kernel] Systems Nominal. Cycle Active.`);
  }

  /**
   * Subscribe to the neural network of events.
   */
  public on<K extends keyof KernelEvents>(event: K, handler: (payload: KernelEvents[K]) => void): void {
    const eventName = event as string;
    if (!this.eventBus.has(eventName)) {
      this.eventBus.set(eventName, []);
    }
    this.eventBus.get(eventName)!.push(handler);
  }

  /**
   * Broadcast a signal across the network.
   */
  public emit<K extends keyof KernelEvents>(event: K, payload: KernelEvents[K]): void {
    const eventName = event as string;
    const listeners = this.eventBus.get(eventName);
    if (listeners) {
      listeners.forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          console.error(`[Kernel] Event Handler Failure [${eventName}]:`, err);
        }
      });
    }
  }

  /**
   * Graceful degradation and termination.
   */
  public async terminate(reason: string = 'User Request'): Promise<void> {
    console.log(`[Kernel] Initiating Shutdown Protocol: ${reason}`);
    this.emit('KERNEL_SHUTDOWN', { reason });
    
    const shutdownSequence = Array.from(this.modules.values()).map(async (mod) => {
        if (mod.onShutdown) await mod.onShutdown();
    });

    await Promise.all(shutdownSequence);
    this.isRunning = false;
    console.log('[Kernel] Core Offline.');
  }
}