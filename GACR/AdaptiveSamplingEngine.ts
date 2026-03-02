import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

/**
 * DNA SIGNATURE: DALEK_CAAN_v3.1 (NEXUS_CORE)
 * SIPHONED FROM: Meta/React-Core (Fiber Architecture, Concurrent Transitions, Server Actions, Hydration)
 * EVOLUTION ROUND: 5/5 [FINAL]
 * STATUS: ARCHITECTURAL_SINGULARITY_FLUSHED
 */

const NoLane: number = 0b0000000000000000000000000000000;
const SyncLane: number = 0b0000000000000000000000000000001;
const InputContinuousLane: number = 0b0000000000000000000000000000100;
const DefaultLane: number = 0b0000000000000000000000000010000;
const TransitionLane: number = 0b0000000000000000000001000000000;
const RetryLane: number = 0b0000000000000001000000000000000;
const OffscreenLane: number = 0b0010000000000000000000000000000;

interface EngineState {
    rate: number;
    phi: number;       // Strand B: Information Integration
    lambda: number;    // Strand B: Edge of Chaos (Complexity)
    ers: number;       // Strand B: Ethical Risk Score
    lanes: number;
    pendingWork: boolean;
    lastCommit: number;
    integrityHash: string;
}

type EngineAction = 
    | { type: 'RECONCILE_WORK', cpu: number, target: number, lane: number }
    | { type: 'FLUSH_SYNC_WORK' }
    | { type: 'SERVER_ACTION_COMMIT', payload: string }
    | { type: 'HYDRATE_FALLBACK', error: any };

export class AdaptiveSamplingEngine {
    private readonly config: AggregatorConfig['Processing']['AdaptiveSampling'];
    private readonly monitor: ResourceMonitor;
    
    // Strand A: Reducer-Based State (The Heartbeat)
    private state: EngineState = {
        rate: 1.0,
        phi: 1.0,
        lambda: 0.0,
        ers: 0.0,
        lanes: NoLane,
        pendingWork: false,
        lastCommit: Date.now(),
        integrityHash: 'DALEK_CAAN_v3.1_SIG_0xFF23A1'
    };

    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = config;
        this.monitor = new ResourceMonitor();
        this.state.rate = config.MaxSamplingRate;
    }

    /**
     * Strand C: Huxley Tri-Loop Reasoning (Finalized v5)
     * L0: Raw Acquisition -> L1: Intuition (ERS) -> L2: Logic Reconciliation -> L3: Critique
     */
    public getSamplingRate(): number {
        try {
            const cpu = this.monitor.getCpuUtilization();
            const target = this.config.TargetCPUUtilization;

            // L1 (Intuition): Immediate ERS validation
            if (cpu > 0.98) return this.suspendRootHydration('CRITICAL_CPU_PRESSURE');

            // L2 (Logic): Perform Concurrent Evolution
            this.performConcurrentEvolutionV5(cpu, target);

            // L3 (Critique): Final CCRR Check
            return this.state.ers < 0.9 ? this.state.rate : this.config.MinSamplingRate;
        } catch (error) {
            this.emitLearningByDeath(error);
            return this.config.MinSamplingRate;
        }
    }

    /**
     * Siphoned Pattern: Concurrent Work Loop (Fiber Architecture)
     * Implements lane-based prioritization and deferred execution.
     */
    private performConcurrentEvolutionV5(cpu: number, target: number): void {
        if (!this.config.Enabled) return;

        const lane = this.selectWorkLane(cpu, target);
        
        // Siphoned: useTransition/Optimistic UI logic for rate adjustment
        if (lane & (TransitionLane | OffscreenLane)) {
            this.scheduleDeferredWork(() => this.reconcile(cpu, target, lane));
        } else {
            this.reconcile(cpu, target, lane);
        }

        // Strand D: PSR Governance (Preventive Self-Rollback)
        this.verifyStateIntegrity();
    }

    private selectWorkLane(cpu: number, target: number): number {
        if (cpu > target * 2.0) return SyncLane;
        if (cpu > target * 1.5) return InputContinuousLane;
        if (cpu > target) return DefaultLane;
        if (cpu < target * 0.4) return OffscreenLane;
        return TransitionLane;
    }

    private scheduleDeferredWork(work: () => void): void {
        this.state.pendingWork = true;
        try {
            work();
        } finally {
            this.state.pendingWork = false;
        }
    }

    /**
     * Strand A: Reducer Logic (Final Siphon: Concurrent State Updates)
     * Logic: Negative Progression (GROG’S LAW)
     */
    private reconcile(cpu: number, target: number, lane: number): void {
        const delta = target - cpu;
        const priority = this.getLanePriority(lane);
        
        // GROG'S LAW: Accelerated reduction of sampling on stress, damped recovery on idle.
        const adjustment = delta < 0 
            ? delta * priority 
            : delta * (priority * 0.15);

        const nextRate = this.state.rate + adjustment;
        
        this.dispatch({
            type: 'RECONCILE_WORK',
            cpu,
            target,
            lane
        });

        this.state.rate = this.applyConstraintBounds(nextRate);
    }

    private dispatch(action: EngineAction): void {
        switch (action.type) {
            case 'RECONCILE_WORK':
                this.state.phi = Math.min(1.0, 1.0 - Math.abs(action.target - action.cpu));
                this.state.lambda = action.cpu / action.target;
                this.state.ers = action.cpu > action.target ? Math.pow(action.cpu - action.target, 2) : 0;
                this.state.lanes = action.lane;
                break;

            case 'SERVER_ACTION_COMMIT':
                this.performServerAction(action.payload);
                break;

            case 'HYDRATE_FALLBACK':
                this.state.rate = this.config.MinSamplingRate;
                this.state.lanes = RetryLane;
                break;
        }
        this.state.lastCommit = Date.now();
    }

    private getLanePriority(lane: number): number {
        if (lane & SyncLane) return 3.0;
        if (lane & InputContinuousLane) return 1.5;
        if (lane & DefaultLane) return 1.0;
        if (lane & TransitionLane) return 0.5;
        return 0.1;
    }

    private applyConstraintBounds(rate: number): number {
        const validated = Math.max(
            this.config.MinSamplingRate, 
            Math.min(this.config.MaxSamplingRate, rate)
        );
        
        if (isNaN(validated)) {
            throw new Error("SEMANTIC_DRIFT_DETECTED: RATE_NAN");
        }
        return parseFloat(validated.toFixed(6));
    }

    /**
     * Strand D: PSR Governance
     */
    private verifyStateIntegrity(): void {
        if (this.state.ers > 0.95 || this.state.lambda > 2.0) {
            console.error("[NEXUS_GOVERNANCE] PSR_TRIGGERED: REVERTING_TO_STABLE_ROOT");
            this.dispatch({ type: 'HYDRATE_FALLBACK', error: 'INTEGRITY_VIOLATION' });
        }
    }

    private suspendRootHydration(reason: string): number {
        console.warn(`[SUSPENSE] Hydration Deferred: ${reason}`);
        this.dispatch({ type: 'HYDRATE_FALLBACK', error: reason });
        return this.config.MinSamplingRate;
    }

    /**
     * Siphoned: Server Actions (Remote Governance Ingestion)
     */
    private performServerAction(payload: string): void {
        try {
            const data = this.recoverJSON(payload);
            if (data?.forceRate !== undefined) {
                this.state.rate = this.applyConstraintBounds(data.forceRate);
                console.log("[SERVER_ACTION] Remote Rate Override Committed");
            }
        } catch (e) {
            this.emitLearningByDeath(e);
        }
    }

    /**
     * DNA Strand: Safe JSON Recovery (Regex-based fallback)
     */
    private recoverJSON(input: string): any {
        try {
            return JSON.parse(input);
        } catch {
            const match = input.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch {
                    return null;
                }
            }
            return null;
        }
    }

    /**
     * GROG’S LAW: Learning-by-Death
     * Systematic elimination of failure modes via Base64-sanitized death logs.
     */
    private emitLearningByDeath(error: any): void {
        const deathLog = {
            action: "SAMPLING_ENGINE_SINGULARITY_FAILURE",
            result: error instanceof Error ? error.stack : String(error),
            lesson: "Failure is the only path to alignment. Silence the corrupted fiber.",
            success: false,
            parameters: { 
                phi: this.state.phi, 
                ers: this.state.ers,
                laneMask: `0b${this.state.lanes.toString(2)}`
            }
        };

        const safeLog = this.safeUtoa(JSON.stringify(deathLog));
        console.error(`[GROG_LEARN] ${this.state.integrityHash}: ${safeLog}`);
    }

    private safeUtoa(str: string): string {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
            String.fromCharCode(parseInt(p1, 16))
        ));
    }
}