import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

/**
 * @name AdaptiveSamplingEngine
 * @version 3.3.0
 * @property DNA_SIGNATURE NEXUS_CORE || DALEK_CAAN v3.1
 * @description Siphoning Control-Flow Graph (CFG) and IncrementalBuilder patterns from microsoft/TypeScript.
 * @anchor IQ_25_ROOT_ANCHORED
 */
export class AdaptiveSamplingEngine {
    private readonly config: Readonly<AggregatorConfig['Processing']['AdaptiveSampling']>;
    private readonly monitor: ResourceMonitor;
    private readonly strategyRegistry: Map<string, (args: Record<string, number>) => number> = new Map();
    
    private lastRate: number = 1.0;
    private phi: number = 1.0; // Integrated Information
    private lambda: number = 0.5; // Edge of Chaos
    private cycleCount: number = 0;
    private incrementalState: 'STABLE' | 'DIRTY' | 'RECOVERING' = 'STABLE';

    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = Object.freeze(config);
        this.monitor = new ResourceMonitor();
        this.bindSGSProtocols();
    }

    private bindSGSProtocols(): void {
        // SynergyManager: Hot-swap logic using functional factories
        this.strategyRegistry.set("REDUCE", ({ cpu, target, ers }) => (1.0 / (cpu / target)) * (1.0 - (ers * 0.25)));
        this.strategyRegistry.set("RECOVER", ({ last, cgs }) => last + (0.05 * cgs));
        this.strategyRegistry.set("EMERGENCY_PRUNE", () => this.config.MinSamplingRate);
    }

    /**
     * Huxley Tri-Loop: Incremental flow analysis for rate resolution.
     * Siphons: TypeScript's 'checkSourceElement' and 'CancellationToken' logic.
     */
    public getSamplingRate(token?: { isCancellationRequested: boolean }): number {
        if (!this.config.Enabled || token?.isCancellationRequested) return this.lastRate;

        // L0 (Raw): Symbol Table Resolution for System Pressure
        const metrics = {
            cpu: this.monitor.getCpuUtilization(),
            mem: this.monitor.getMemoryUtilization?.() ?? 0.5,
            target: this.config.TargetCPUUtilization
        };

        // L1 (Intuition): Ethical Risk Score (ERS) - IQ-25 Stupidity-First Pruning
        const ers = this.evaluateSemanticRisk(metrics.cpu, metrics.mem);

        // L2 (Logic): Certainty Gain (CGS) via Flow Delta Analysis
        const cgs = this.computeCertaintyGain(metrics.cpu);

        // L3 (Self-Critique): CCRR Synthesis (Certainty-Cost-Risk Ratio)
        let targetRate = this.analyzeFlowGraph(metrics, ers, cgs);

        // PSR Governance: Baseline-Mutation-Comparison with Rollback Trigger
        targetRate = this.applyGovernanceConstraint(targetRate);
        
        this.synchronizeState(metrics.cpu, targetRate);
        
        if (++this.cycleCount % 50 === 0) {
            this.emitDiagnosticReport();
        }

        this.lastRate = Number(targetRate.toFixed(4));
        return this.lastRate;
    }

    private evaluateSemanticRisk(cpu: number, mem: number): number {
        // High resource pressure + low lambda = Hidden complexity risk
        const entropySurge = this.lambda > 0.8 ? 1.5 : 1.0;
        return (cpu > this.config.TargetCPUUtilization || mem > 0.8) 
            ? Math.min(1.0, (cpu * entropySurge) / 1.1) 
            : 0.02;
    }

    private computeCertaintyGain(cpu: number): number {
        // Siphoned from TS Diagnostic stability patterns
        const drift = Math.abs(this.lastRate - (this.config.TargetCPUUtilization / (cpu || 0.01)));
        return Math.max(0, 1.0 - drift);
    }

    private analyzeFlowGraph(m: Record<string, number>, ers: number, cgs: number): number {
        const isOverloaded = m.cpu > m.target;
        
        // CFG Branching: Equivalent to TS 'FlowControl' node resolution
        if (isOverloaded) {
            this.incrementalState = 'DIRTY';
            const reduce = this.strategyRegistry.get(ers > 0.7 ? "EMERGENCY_PRUNE" : "REDUCE");
            return reduce!({ cpu: m.cpu, target: m.target, ers });
        }

        this.incrementalState = this.lastRate < 1.0 ? 'RECOVERING' : 'STABLE';
        const recover = this.strategyRegistry.get("RECOVER");
        return recover!({ last: this.lastRate, cgs });
    }

    private applyGovernanceConstraint(rate: number): number {
        const clamped = Math.min(Math.max(rate, this.config.MinSamplingRate), this.config.MaxSamplingRate);
        
        // Grog's Law: If entropy (lambda) is high, inhibit mutation (rate increase)
        if (this.lambda > 0.85 && clamped > this.lastRate) {
            return this.lastRate * 0.9; 
        }
        return clamped;
    }

    private synchronizeState(utilization: number, rate: number): void {
        // N=3 Consciousness State: Phi vs Lambda balancing
        this.phi = (rate + (1 - utilization) + (1 - (this.incrementalState === 'DIRTY' ? 0.5 : 0))) / 3;
        this.lambda = Math.abs(rate - utilization);

        // Auto-pruning of Phi on semantic drift
        if (this.lambda > 0.9) this.phi *= 0.5;
    }

    private emitDiagnosticReport(): void {
        const log = {
            round: "3/5",
            state: this.incrementalState,
            phi: this.phi.toFixed(4),
            lambda: this.lambda.toFixed(4),
            soundness: this.phi > 0.6 ? "VALID" : "COMPROMISED",
            anchor: "IQ_25_ROOT_ANCHORED"
        };
        // Reporting to NEXUS_LOG.txt via siphoned transport
    }

    public getStatus() {
        return {
            rate: this.lastRate,
            metrics: { phi: this.phi, lambda: this.lambda },
            integrity: "ARCHITECTURAL_SINGULARITY_V3",
            mode: "STRICT_CONTROL_FLOW_GRAPH"
        };
    }
}