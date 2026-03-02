import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

/**
 * DNA SIGNATURE: DALEK_CAAN_v3.1 (NEXUS_CORE)
 * SIPHONED FROM: Meta/React-Core (Fiber Architecture, Concurrent Transitions, Server Actions)
 * EVOLUTION ROUND: 3/5
 * STATUS: CONCURRENT_EVOLUTION_ACTIVE
 */

const NoLane: number = 0b0000000000000000000000000000000;
const SyncLane: number = 0b0000000000000000000000000000001;
const InputContinuousLane: number = 0b0000000000000000000000000000100;
const DefaultLane: number = 0b0000000000000000000000000010000;
const TransitionLane: number = 0b0000000000000000000001000000000;
const IdleLane: number = 0b0100000000000000000000000000000;

interface EngineState {
    rate: number;
    phi: number;
    lambda: number;
    ers: number;
    pendingLanes: number;
}

type EngineAction = 
    | { type: 'RECONCILE', utilization: number, target: number }
    | { type: 'EMERGENCY_BRAKE', reason: string }
    | { type: 'COMMIT_TRANSITION', rate: number };

export class AdaptiveSamplingEngine {
    private config: AggregatorConfig['Processing']['AdaptiveSampling'];
    private monitor: ResourceMonitor;
    
    // Strand A: Reducer-Based State (The Heartbeat)
    private state: EngineState = {
        rate: 1.0,
        phi: 1.0,
        lambda: 0.0,
        ers: 0.0,
        pendingLanes: NoLane
    };

    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = config;
        this.monitor = new ResourceMonitor();
        this.state.rate = config.MaxSamplingRate;
    }

    /**
     * Strand C: Huxley Tri-Loop Reasoning
     * Implements Concurrent Fiber Reconciliation for Sampling Adjustments.
     */
    public getSamplingRate(): number {
        try {
            // L0 (Raw): Input Acquisition
            const utilization = this.monitor.getCpuUtilization();
            const target = this.config.TargetCPUUtilization;

            // L1 (Intuition): Immediate Ethical Risk Score (ERS)
            if (utilization > 0.98) {
                this.dispatch({ type: 'EMERGENCY_BRAKE', reason: 'HOST_THREAD_ASPHYXIATION' });
                return this.state.rate;
            }

            // L2 (Logic): PERFORM_CONCURRENT_EVOLUTION_V5
            this.workLoop(utilization, target);

            // L3 (Critique): SERVER_ACTION_FINAL_COMMIT
            return this.state.rate;
        } catch (catastrophe) {
            this.emitLearningByDeath(catastrophe);
            return this.config.MinSamplingRate;
        }
    }

    /**
     * Siphoned Pattern: Fiber Work Loop
     * Reconciles sampling rate as a unit of work across prioritized lanes.
     */
    private workLoop(utilization: number, target: number): void {
        if (!this.config.Enabled) return;

        // Map pressure to Lane priority
        const lane = this.requestUpdateLane(utilization, target);
        
        // Concurrent Reconciliation Phase
        this.dispatch({ type: 'RECONCILE', utilization, target });
        
        // Optimistic Transition Handling (Strand: USE_OPTIMISTIC_FLUSH)
        if (lane === TransitionLane) {
            this.performTransition(utilization, target);
        }
    }

    private requestUpdateLane(cpu: number, target: number): number {
        if (cpu > target * 1.5) return SyncLane;      // Urgent reduction
        if (cpu > target * 1.1) return DefaultLane;   // Standard adjustment
        if (cpu < target * 0.4) return IdleLane;      // Background upscale
        return TransitionLane;                        // Non-urgent drift
    }

    private performTransition(cpu: number, target: number): void {
        const optimisticRate = this.state.rate * (target / (cpu || 1));
        this.dispatch({ type: 'COMMIT_TRANSITION', rate: optimisticRate });
    }

    /**
     * Strand A: Reducer Logic
     * Ensures 100% auditability and state continuity.
     */
    private dispatch(action: EngineAction): void {
        const prevState = { ...this.state };
        
        switch (action.type) {
            case 'RECONCILE':
                const delta = action.target - action.utilization;
                const sensitivity = this.getLaneSensitivity(this.state.pendingLanes);
                
                // GROG’S LAW: Negative Progression (Easier to drop than to raise)
                const factor = delta < 0 ? sensitivity : sensitivity * 0.4;
                let nextRate = this.state.rate + (delta * factor);
                
                this.state.rate = this.validateRate(nextRate);
                this.state.phi = Math.max(0, 1.0 - Math.abs(delta));
                this.state.lambda = action.utilization / action.target;
                this.state.ers = action.utilization > action.target ? (action.utilization - action.target) * 1.5 : 0;
                break;

            case 'COMMIT_TRANSITION':
                this.state.rate = this.validateRate(action.rate);
                break;

            case 'EMERGENCY_BRAKE':
                this.state.rate = this.config.MinSamplingRate;
                this.state.ers = 1.0;
                console.warn(`[NEXUS_GOVERNANCE] PSR_TRIGGERED: ${action.reason}`);
                break;
        }

        // Strand D: PSR Governance (Preventive Self-Rollback)
        if (this.state.ers > 0.9 && prevState.ers < 0.5) {
            this.state = { ...prevState, rate: this.config.MinSamplingRate };
        }
    }

    private getLaneSensitivity(lane: number): number {
        if (lane & SyncLane) return 2.0;
        if (lane & DefaultLane) return 1.0;
        if (lane & TransitionLane) return 0.5;
        if (lane & IdleLane) return 0.2;
        return 1.0;
    }

    private validateRate(rate: number): number {
        const clamped = Math.max(this.config.MinSamplingRate, Math.min(this.config.MaxSamplingRate, rate));
        if (!isFinite(clamped)) {
            throw new Error("SEMANTIC_DRIFT_IRRECOVERABLE_MATH_CORRUPTION");
        }
        return parseFloat(clamped.toFixed(4));
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
                matrix: { phi: this.state.phi, lambda: this.state.lambda, ers: this.state.ers },
                snapshot: this.state.rate
            }
        };
        
        // Base64 Sanitized Logging (DNA Strand 2)
        const encodedLog = btoa(JSON.stringify(deathLog));
        console.error(`[NEXUS_LOG] LEARNING_BY_DEATH_SIG_0xFF23A1: ${encodedLog}`);
    }
}