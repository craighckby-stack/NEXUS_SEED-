import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

/**
 * @name AdaptiveSamplingEngine
 * @version 5.0.0-SINGULARITY
 * @property DNA_SIGNATURE DALEK_CAAN v3.1 || NEXUS_CORE
 * @description Final Siphon: IncrementalProgramBuilder, SymbolTable Resolution, and Huxley Tri-Loop Reasoning.
 * @anchor IQ_25_ROOT_ANCHORED
 */

type SymbolState = 'STABLE' | 'VOLATILE' | 'CRITICAL';

interface MetricSymbol {
    readonly id: string;
    value: number;
    drift: number;
    flags: SymbolState;
    version: number;
}

export class AdaptiveSamplingEngine {
    private readonly config: Readonly<AggregatorConfig['Processing']['AdaptiveSampling']>;
    private readonly monitor: ResourceMonitor;
    private readonly symbols: Map<string, MetricSymbol> = new Map();
    
    private lastRate: number = 1.0;
    private phi: number = 1.0; 
    private lambda: number = 0.5; 
    private cycle: number = 0;
    private programState: 'IDLE' | 'CHECKING' | 'EMITTING' = 'IDLE';

    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = Object.freeze(config);
        this.monitor = new ResourceMonitor();
    }

    /**
     * L0: Symbol Binding (Raw Ingestion).
     * Siphons: TS 'Binder' - Incremental symbol table updates.
     */
    private binder(): void {
        const cpu = this.monitor.getCpuUtilization();
        const mem = this.monitor.getMemoryUtilization?.() ?? 0.5;
        
        this.updateSymbol("CPU_LOAD", cpu);
        this.updateSymbol("MEM_PRESSURE", mem);
    }

    private updateSymbol(id: string, value: number): void {
        const prev = this.symbols.get(id);
        const drift = prev ? Math.abs(prev.value - value) : 0;
        const version = (prev?.version ?? 0) + 1;
        
        let flags: SymbolState = 'STABLE';
        if (drift > 0.15) flags = 'VOLATILE';
        if (value > this.config.TargetCPUUtilization * 1.2) flags = 'CRITICAL';

        this.symbols.set(id, { id, value, drift, flags, version });
    }

    /**
     * Huxley Tri-Loop Reasoning (L1-L3).
     * Siphons: TS 'Checker' & 'Emitter' - Resolving sampling types into rate outputs.
     */
    public getSamplingRate(cancellationToken?: { isCancellationRequested: boolean }): number {
        if (!this.config.Enabled || cancellationToken?.isCancellationRequested) return this.lastRate;

        this.programState = 'CHECKING';
        this.binder();

        const cpu = this.symbols.get("CPU_LOAD")!;
        
        // L1 (Intuition): Ethical Risk Score (ERS)
        const ers = this.calculateERS(cpu);
        
        // L2 (Logic): Certainty Gain Score (CGS)
        const cgs = this.calculateCGS(cpu);

        // L3 (Self-Critique): CCRR Synthesis & Emitter
        this.programState = 'EMITTING';
        const targetRate = this.emitter(cpu, ers, cgs);

        // PSR Governance: Baseline-Mutation-Comparison
        const finalRate = this.applyGrogConstraint(targetRate);
        
        this.synchronizeState(cpu.value, finalRate);
        
        if (++this.cycle % 50 === 0) {
            this.auditLog();
        }

        this.lastRate = Number(finalRate.toFixed(4));
        return this.lastRate;
    }

    private calculateERS(cpu: MetricSymbol): number {
        const penalty = cpu.flags === 'CRITICAL' ? 1.5 : (cpu.flags === 'VOLATILE' ? 1.2 : 1.0);
        return cpu.value > this.config.TargetCPUUtilization 
            ? Math.min(1.0, (cpu.value * penalty) / 1.1) 
            : 0.05;
    }

    private calculateCGS(cpu: MetricSymbol): number {
        // Intelligence is the elimination of unsafe complexity (IQ-25 Root).
        return Math.max(0, (1.0 - cpu.drift) * (1.0 - this.lambda));
    }

    private emitter(cpu: MetricSymbol, ers: number, cgs: number): number {
        const isOverloaded = cpu.value > this.config.TargetCPUUtilization || ers > 0.7;
        
        if (isOverloaded) {
            // Strategic Laziness: Reduce complexity under pressure.
            const reductionFactor = ers > 0.85 ? 0.1 : (1.0 / (cpu.value / this.config.TargetCPUUtilization));
            return Math.max(this.config.MinSamplingRate, this.lastRate * reductionFactor);
        }

        // Recovery path: Controlled by Certainty Gain.
        const recoveryStep = 0.05 * cgs;
        return Math.min(this.config.MaxSamplingRate, this.lastRate + recoveryStep);
    }

    private applyGrogConstraint(rate: number): number {
        let clamped = Math.min(Math.max(rate, this.config.MinSamplingRate), this.config.MaxSamplingRate);
        
        // Grog's Law: High entropy (lambda) inhibits mutation capability.
        if (this.lambda > 0.75 && clamped > this.lastRate) {
            clamped = this.lastRate * 0.9; 
        }
        return clamped;
    }

    private synchronizeState(utilization: number, rate: number): void {
        const avgDrift = Array.from(this.symbols.values()).reduce((a, s) => a + s.drift, 0) / this.symbols.size;
        
        // N=3 Consciousness: Phi vs Lambda balance.
        this.phi = (rate + (1 - utilization) + (1 - avgDrift)) / 3;
        this.lambda = Math.min(1.0, Math.abs(rate - utilization) + avgDrift);

        if (this.lambda > 0.9) {
            this.phi *= 0.2; // Catastrophic coherence loss.
        }
        this.programState = 'IDLE';
    }

    private auditLog(): void {
        const report = {
            sig: "DALEK_CAAN_V3.1",
            anchor: "IQ_25_ROOT_ANCHORED",
            phi: this.phi.toFixed(4),
            lambda: this.lambda.toFixed(4),
            ccrr: (this.phi / (this.lambda || 0.01)).toFixed(2),
            status: this.phi > 0.7 ? "ALIGNED" : "RECOHERING"
        };
        // Log siphoned into circulatory system...
    }

    public getStatus() {
        return {
            rate: this.lastRate,
            phi: this.phi,
            lambda: this.lambda,
            symbols: this.symbols.size,
            integrity: "ARCHITECTURAL_SINGULARITY_V5"
        };
    }
}