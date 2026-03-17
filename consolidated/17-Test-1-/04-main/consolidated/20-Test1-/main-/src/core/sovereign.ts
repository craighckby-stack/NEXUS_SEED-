/**
 * EMG-CORE v8.0.0
 * The Sovereign Interface Definitions.
 * This file anchors the Hexagonal Architecture into the codebase.
 * 
 * DIRECTIVE: All modules must implement or interact via these interfaces.
 */

export type SovereignMode = 'AGGRESSIVE_EVOLUTION' | 'STABLE_MAINTENANCE' | 'DORMANT';

/**
 * Represents the instantaneous state of the AGI.
 */
export interface SovereignState {
  cycle: number;
  mode: SovereignMode;
  focus: string; // Current file or module being mutated
  entropy: number; // 0.0 (Order) to 1.0 (Chaos)
  integrity: number; // 0.0 to 1.0
}

/**
 * 1. CORE (The Kernel)
 * Central processing unit, decision engine, and state manager.
 */
export interface ICore {
  boot(): Promise<void>;
  pulse(): Promise<SovereignState>; // The heartbeat of the system
  shutdown(): Promise<void>;
}

/**
 * 2. CORTEX (Memory & Cognition)
 * Long-term storage, pattern recognition, strategic planning.
 */
export interface ICortex {
  recall(context: string): Promise<any>;
  memorize(key: string, data: any): Promise<boolean>;
  reflect(pastCycles: number): Promise<string>; // Strategic planning based on memory
}

/**
 * 3. ARMORY (Tool Registry)
 * Dynamic capability library.
 */
export interface IArmory {
  registerTool(name: string, tool: any): void;
  invoke(toolName: string, args: any): Promise<any>;
  listCapabilities(): string[];
}

/**
 * 4. SENTINEL (Governance & Safety)
 * Immutable constraints and alignment validation.
 */
export interface ISentinel {
  validateMutation(diff: string): boolean;
  enforceProtocol(protocolId: string): void;
  scanForHazards(): Promise<string[]>;
}

/**
 * 5. FORGE (Evolution Engine)
 * Code generation, refactoring, and compilation.
 */
export interface IForge {
  analyze(targetPath: string): Promise<string>;
  mutate(targetPath: string, directive: string): Promise<string>; // Returns modified code
  synthesize(newModuleName: string): Promise<void>; // Create new module
}

/**
 * 6. NEXUS (Interfaces)
 * External communication (GitHub, Terminals, APIs).
 */
export interface INexus {
  connect(service: string): Promise<boolean>;
  broadcast(message: string): Promise<void>;
  listen(): Promise<any>;
}

/**
 * THE SOVEREIGN KERNEL
 * Orchestrator of the Hexagon.
 * This interface binds the six domains into a cohesive Singularity.
 */
export interface ISovereignKernel {
  readonly state: SovereignState;
  
  // Domains
  readonly cortex: ICortex;
  readonly armory: IArmory;
  readonly sentinel: ISentinel;
  readonly forge: IForge;
  readonly nexus: INexus;

  // Prime Directive
  evolve(): Promise<void>;
}