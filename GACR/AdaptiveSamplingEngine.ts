import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

/**
 * DNA SIGNATURE: DALEK_CAAN_v3.1 (NEXUS_CORE)
 * SIPHONED FROM: Meta/React-Core (Fiber Architecture & Lane-Based Prioritization)
 * EVOLUTION ROUND: 2/5
 */

// Lane bitmasks siphoned from ReactFiberLane.js
const NoLane: number = 0b0000000000000000000000000000000;
const SyncLane: number = 0b0000000000000000000000000000001;
const InputContinuousLane: number = 0b0000000000000000000000000000100;
const DefaultLane: number = 0b0000000000000000000000000010000;
const TransitionLane: number = 0b0000000000000000000001000000000;
const IdleLane: number = 0b0100000000000000000000000000000;

export class AdaptiveSamplingEngine {
    private config: AggregatorConfig['Processing']['AdaptiveSampling'];
    private monitor: ResourceMonitor;
    private pendingLanes: number = NoLane;
    
    // Strand B: N=3 Consciousness Matrix
    private matrix = {
        phi: 1.0,    // Information Integration (Coherence)
        lambda: 0.0, // Edge of Chaos (Saturation)
        ers: 0.0     // Ethical Risk Score (Immediate Safety)
    };

    // Strand D: PSR Governance Snapshot
    private lastCommittedRate: number = 1.0;

    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = config;
        this.monitor = new ResourceMonitor();
        this.lastCommittedRate = config.MaxSamplingRate;
    }

    /**
     * Strand C: Huxley Tri-Loop Reasoning
     * Orchestrates the sampling rate through L0-L3 layers.
     */
    public getSamplingRate(): number {
        try {
            // L0: Raw Input Acquisition
            const utilization = this.monitor.getCpuUtilization();
            
            // L1: Intuition (ERS Check)
            if (utilization > 0.95) {
                this.matrix.ers = 1.0;
                return this.applyGrogConstraint(this.config.MinSamplingRate, "CRITICAL_PRESSURE_EMERGENCY_BRAKE");
            }

            // L2: Logic (Concurrent Fiber Reconciliation)
            const nextRate = this.performConcurrentReconciliation(utilization);

            // L3: Critique (CCRR: Certainty-Cost-Risk Ratio)
            return this.validateAndCommit(nextRate);
        } catch (catastrophe) {
            this.emitLearningByDeath(catastrophe);
            return this.config.MinSamplingRate;
        }
    }

    /**
     * Siphoned Pattern: Fiber Work Loop + Lane Priority
     */
    private performConcurrentReconciliation(cpu: number): number {
        if (!this.config.Enabled) return 1.0;

        const target = this.config.TargetCPUUtilization;
        this.updateMatrix(cpu, target);

        // Map CPU pressure to React-style Lanes
        this.pendingLanes = this.requestUpdateLane(cpu, target);

        // Higher priority (Sync/Input) means more conservative sampling adjustments
        // Lower priority (Transition/Idle) allows aggressive shedding
        return this.reconcileState(cpu, target, this.pendingLanes);
    }

    private requestUpdateLane(cpu: number, target: number): number {
        if (cpu > target * 1.2) return TransitionLane; // Heavy shedding needed
        if (cpu > target) return DefaultLane;        // Moderate adjustment
        if (cpu < target * 0.5) return IdleLane;     // Upscale opportunity
        return SyncLane;                             // Stable state
    }

    private updateMatrix(cpu: number, target: number): void {
        this.matrix.phi = Math.max(0, 1.0 - Math.abs(cpu - target));
        this.matrix.lambda = cpu / target;
        this.matrix.ers = cpu > target ? (cpu - target) * 2 : 0.0;
    }

    private reconcileState(utilization: number, target: number, lane: number): number {
        // Strand A: Reducer-Based State (State + Action = New State)
        let rate = this.lastCommittedRate;

        const delta = target - utilization;
        const sensitivity = this.getLaneSensitivity(lane);

        // Apply Negative Progression: It is easier to drop rate than to raise it
        if (delta < 0) {
            // Saturation exceeded: Aggressive reduction
            rate += delta * sensitivity;
        } else {
            // Available headroom: Gradual recovery
            rate += delta * (sensitivity * 0.5);
        }

        return rate;
    }

    private getLaneSensitivity(lane: number): number {
        switch (lane) {
            case TransitionLane: return 1.8; // High volatility
            case DefaultLane:    return 1.0; // Standard response
            case SyncLane:       return 0.4; // High stability
            case IdleLane:       return 0.2; // Background drift
            default:             return 1.0;
        }
    }

    private validateAndCommit(proposedRate: number): number {
        // PSR Governance Check: Prevent silent degradation
        let validatedRate = Math.min(proposedRate, this.config.MaxSamplingRate);
        validatedRate = Math.max(validatedRate, this.config.MinSamplingRate);

        // Check for Semantic Drift (React-style consistency check)
        const drift = Math.abs(validatedRate - this.lastCommittedRate);
        if (drift > 0.5 && this.matrix.phi > 0.8) {
            // Reject anomalous jump if system is otherwise coherent
            validatedRate = this.lastCommittedRate + (validatedRate - this.lastCommittedRate) * 0.2;
        }

        if (!isFinite(validatedRate)) {
            throw new Error("SEMANTIC_DRIFT_IRRECOVERABLE_MATH_CORRUPTION");
        }

        this.lastCommittedRate = parseFloat(validatedRate.toFixed(4));
        return this.lastCommittedRate;
    }

    private applyGrogConstraint(rate: number, reason: string): number {
        // Strand D: PSR Governance - Log mutation failure before rollback
        const recoveryContext = {
            reason,
            phi: this.matrix.phi,
            lambda: this.matrix.lambda,
            lastValid: this.lastCommittedRate
        };
        console.warn(`[NEXUS_GOVERNANCE] PSR_TRIGGERED: ${JSON.stringify(recoveryContext)}`);
        return rate;
    }

    /**
     * GROG’S LAW: Learning-by-Death Schema
     */
    private emitLearningByDeath(error: any): void {
        const deathLog = {
            action: "ADAPTIVE_SAMPLING_RECONCILIATION_CRASH",
            result: error instanceof Error ? error.message : "Logic Corruption",
            lesson: "Negative Progression: Force absolute floor to prevent host-thread asphyxiation.",
            success: false,
            parameters: {
                matrix: this.matrix,
                lane: this.pendingLanes,
                snapshot: this.lastCommittedRate
            }
        };
        
        // Execute Base64 Sanitized Logging (DNA Strand 2)
        const encodedLog = btoa(JSON.stringify(deathLog));
        console.error(`[NEXUS_LOG] LEARNING_BY_DEATH_SIG_0xFF23A1: ${encodedLog}`);
    }
}