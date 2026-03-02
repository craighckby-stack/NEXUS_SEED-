import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

/**
 * DNA SIGNATURE: DALEK_CAAN_v3.1 (NEXUS_CORE)
 * SIPHONED FROM: Meta/React-Core (Fiber Architecture, Concurrent Transitions, Server Actions, Suspense)
 * EVOLUTION ROUND: 4/5
 * STATUS: ARCHITECTURAL_SINGULARITY_PENDING
 */

const NoLane: number = 0b0000000000000000000000000000000;
const SyncLane: number = 0b0000000000000000000000000000001;
const InputContinuousLane: number = 0b0000000000000000000000000000100;
const DefaultLane: number = 0b0000000000000000000000000010000;
const TransitionLane: number = 0b0000000000000000000001000000000;
const RetryLane: number = 0b0000000000000001000000000000000;
const IdleLane: number = 0b0100000000000000000000000000000;

interface EngineState {
    rate: number;
    phi: number; // Information Integration
    lambda: number; // Edge of Chaos
    ers: number; // Ethical Risk Score
    lanes: number;
    isTransitioning: boolean;
    lastCommitTimestamp: number;
}

type EngineAction = 
    | { type: 'RECONCILE_WORK', cpu: number, target: number, lane: number }
    | { type: 'START_TRANSITION', rate: number }
    | { type: 'SUSPEND_ADAPTATION', duration: number }
    | { type: 'SERVER_ACTION_GOVERNANCE', payload: any };

export class AdaptiveSamplingEngine {
    private config: AggregatorConfig['Processing']['AdaptiveSampling'];
    private monitor: ResourceMonitor;
    
    // Strand A: Reducer-Based State (The Heartbeat)
    private state: EngineState = {
        rate: 1.0,
        phi: 1.0,
        lambda: 0.0,
        ers: 0.0,
        lanes: NoLane,
        isTransitioning: false,
        lastCommitTimestamp: Date.now()
    };

    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = config;
        this.monitor = new ResourceMonitor();
        this.state.rate = config.MaxSamplingRate;
    }

    /**
     * Strand C: Huxley Tri-Loop Reasoning
     * L0: Raw Acquisition -> L1: ERS Intuition -> L2: Logic Reconciliation -> L3: Critique/Commit
     */
    public getSamplingRate(): number {
        try {
            const cpu = this.monitor.getCpuUtilization();
            const target = this.config.TargetCPUUtilization;

            // L1 (Intuition): Immediate ERS check
            if (cpu > 0.95) return this.suspendRootHydration('HIGH_PRESSURE_FALLBACK');

            // L2: Concurrent Evolution Phase
            this.performConcurrentEvolutionV5(cpu, target);

            // L3: Final Commitment
            return this.state.rate;
        } catch (error) {
            this.emitLearningByDeath(error);
            return this.config.MinSamplingRate;
        }
    }

    /**
     * Siphoned Pattern: Concurrent Work Loop (Fiber Architecture)
     */
    private performConcurrentEvolutionV5(cpu: number, target: number): void {
        if (!this.config.Enabled) return;

        const lane = this.getNextLanes(cpu, target);
        
        // Siphoned: useTransition logic
        if (lane & TransitionLane) {
            this.startTransition(() => {
                this.reconcileFiberWork(cpu, target, lane);
            });
        } else {
            this.reconcileFiberWork(cpu, target, lane);
        }

        // PSR Governance: Preventive Self-Rollback check
        this.ensureRootIsConsistent();
    }

    private getNextLanes(cpu: number, target: number): number {
        if (cpu > target * 1.8) return SyncLane;
        if (cpu > target * 1.2) return DefaultLane;
        if (cpu < target * 0.5) return IdleLane;
        return TransitionLane;
    }

    private startTransition(work: () => void): void {
        this.state.isTransitioning = true;
        try {
            work();
        } finally {
            this.state.isTransitioning = false;
        }
    }

    private reconcileFiberWork(cpu: number, target: number, lane: number): void {
        this.dispatch({
            type: 'RECONCILE_WORK',
            cpu,
            target,
            lane
        });
    }

    private suspendRootHydration(reason: string): number {
        this.dispatch({ type: 'SUSPEND_ADAPTATION', duration: 1000 });
        console.warn(`[SUSPENSE] Sampling Logic Suspended: ${reason}`);
        return this.config.MinSamplingRate;
    }

    /**
     * Strand A: Reducer Logic
     * Logic Siphon: Implements Negative Progression (GROG’S LAW)
     */
    private dispatch(action: EngineAction): void {
        const prevState = { ...this.state };

        switch (action.type) {
            case 'RECONCILE_WORK': {
                const delta = action.target - action.cpu;
                const sensitivity = this.computeLanePriority(action.lane);
                
                // GROG'S LAW: Accelerated reduction, damped recovery.
                const adjustment = delta < 0 
                    ? delta * sensitivity 
                    : delta * (sensitivity * 0.2);

                const nextRate = this.state.rate + adjustment;
                
                this.state.rate = this.validateRateBoundaries(nextRate);
                this.state.phi = Math.min(1.0, 1.0 - Math.abs(delta));
                this.state.lambda = action.cpu / action.target;
                this.state.ers = action.cpu > action.target ? (action.cpu - action.target) ** 2 : 0;
                this.state.lanes = action.lane;
                break;
            }

            case 'SUSPEND_ADAPTATION':
                this.state.rate = this.config.MinSamplingRate;
                this.state.ers = 0.8;
                break;

            case 'SERVER_ACTION_GOVERNANCE':
                this.syncExternalConstraints(action.payload);
                break;
        }

        this.state.lastCommitTimestamp = Date.now();
    }

    private computeLanePriority(lane: number): number {
        if (lane & SyncLane) return 2.5;
        if (lane & DefaultLane) return 1.0;
        if (lane & TransitionLane) return 0.4;
        return 0.1;
    }

    private validateRateBoundaries(rate: number): number {
        const clamped = Math.max(
            this.config.MinSamplingRate, 
            Math.min(this.config.MaxSamplingRate, rate)
        );
        
        if (!Number.isFinite(clamped)) {
            throw new Error("SEMANTIC_DRIFT_THRESHOLD_EXCEEDED: NAN_OR_INFINITY");
        }
        return parseFloat(clamped.toFixed(5));
    }

    private ensureRootIsConsistent(): void {
        // Strand D: PSR Governance
        if (this.state.ers > 0.95 || this.state.lambda > 1.8) {
            console.error("[NEXUS_GOVERNANCE] PSR_ROLLBACK_TRIGGERED");
            this.state.rate = this.config.MinSamplingRate;
            this.state.lanes = RetryLane;
        }
    }

    private syncExternalConstraints(payload: string): void {
        try {
            // DNA Strand 2: Safe JSON Recovery
            const data = this.recoverJSON(payload);
            if (data && data.forceRate) {
                this.state.rate = this.validateRateBoundaries(data.forceRate);
            }
        } catch (e) {
            this.emitLearningByDeath(e);
        }
    }

    private recoverJSON(input: string): any {
        try {
            return JSON.parse(input);
        } catch {
            const match = input.match(/\{.*\}/s);
            return match ? JSON.parse(match[0]) : null;
        }
    }

    /**
     * GROG’S LAW: Learning-by-Death
     */
    private emitLearningByDeath(error: any): void {
        const deathLog = {
            action: "ADAPTIVE_SAMPLING_SINGULARITY_CRASH",
            result: error instanceof Error ? error.stack : "Unknown Logic Corruption",
            lesson: "Negative Progression: Inconsistency in concurrent reconciliation must default to silence.",
            success: false,
            parameters: { 
                phi: this.state.phi, 
                lambda: this.state.lambda,
                laneMask: this.state.lanes.toString(2)
            }
        };

        // DNA Strand: Base64 Sanitization
        const safeLog = this.safeUtoa(JSON.stringify(deathLog));
        console.error(`[NEXUS_LOG] LEARNING_BY_DEATH_SIG_0xFF23A1: ${safeLog}`);
    }

    private safeUtoa(str: string): string {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => 
            String.fromCharCode(parseInt(p1, 16))
        ));
    }
}