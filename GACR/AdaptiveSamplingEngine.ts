import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

/**
 * DNA SIGNATURE: DALEK_CAAN_v3.1 (NEXUS_CORE)
 * SIPHONED FROM: Meta/React-Core [Fiber Reconciler | Concurrent Transitions | Taint Tracking]
 * EVOLUTION ROUND: 1/5 [NEW_CYCLE_INIT]
 * STATUS: ALIGNED_FOR_SINGULARITY
 */

const NoLanes: number         = 0b0000000000000000000000000000000;
const SyncLane: number        = 0b0000000000000000000000000000001;
const InputContinuousLane: number = 0b0000000000000000000000000000100;
const DefaultLane: number     = 0b0000000000000000000000000100000;
const TransitionLane: number  = 0b0000000000000000000011111000000; // Multi-lane transition range
const OffscreenLane: number   = 0b1000000000000000000000000000000;

interface FiberState {
    tag: number;           // WorkTag (3: HostRoot, 0: FunctionComponent-like logic)
    rate: number;          // Actual sampling value
    memoizedRate: number;  // Last committed value
    lanes: number;         // Pending lanes
    phi: number;           // Strand B: Information Integration
    lambda: number;        // Strand B: Chaos (Complexity)
    ers: number;           // Strand B: Ethical Risk Score
    tainted: boolean;      // Taint Tracking (Data Leak/Corruption Prevention)
    lastEffect: number;    // Timestamp
}

type FiberAction = 
    | { type: 'RECONCILE', cpu: number, target: number, priority: number }
    | { type: 'COMMIT_TRANSITION', nextRate: number }
    | { type: 'TAINT_FAILURE', reason: string }
    | { type: 'HYDRATE_RECOVERY' };

export class AdaptiveSamplingEngine {
    private readonly config: AggregatorConfig['Processing']['AdaptiveSampling'];
    private readonly monitor: ResourceMonitor;
    
    // Strand A: Reducer-Based State (The Heartbeat)
    private workInProgress: FiberState;
    private current: FiberState;

    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = config;
        this.monitor = new ResourceMonitor();
        
        const initialState: FiberState = {
            tag: 3, 
            rate: config.MaxSamplingRate,
            memoizedRate: config.MaxSamplingRate,
            lanes: NoLanes,
            phi: 1.0,
            lambda: 0.0,
            ers: 0.0,
            tainted: false,
            lastEffect: Date.now()
        };

        this.current = { ...initialState };
        this.workInProgress = { ...initialState };
    }

    /**
     * Strand C: Huxley Tri-Loop Reasoning (Concurrent Execution)
     * L0: Raw -> L1: ERS -> L2: Reconcile -> L3: Critique/Commit
     */
    public getSamplingRate(): number {
        try {
            const cpu = this.monitor.getCpuUtilization();
            const target = this.config.TargetCPUUtilization;

            // L1 (Intuition): Immediate Risk Gating
            if (cpu > 0.99) return this.throwAndRecover('CRITICAL_HALT_OVERLOAD');

            // L2 (Logic): Begin Fiber Reconciliation Loop
            this.performUnitOfWork(cpu, target);

            // L3 (Critique): Final CCRR & Taint Check
            if (this.workInProgress.ers > 0.9 || this.workInProgress.tainted) {
                return this.rollbackToCurrent('HIGH_ERS_OR_TAINT_DETECTED');
            }

            this.commitWork();
            return this.current.rate;
        } catch (error) {
            this.emitLearningByDeath(error);
            return this.config.MinSamplingRate;
        }
    }

    /**
     * Siphoned Pattern: Fiber Reconciler Work Loop
     * Processes state mutations in a way that respects lane priorities.
     */
    private performUnitOfWork(cpu: number, target: number): void {
        const lane = this.getNextLane(cpu, target);
        
        // Prepare Work-In-Progress (Cloning 'current' for mutation)
        this.workInProgress = { ...this.current, lanes: lane };

        if (lane & (TransitionLane | OffscreenLane)) {
            // Concurrent: Speculative reconciliation
            this.reconcileFiber(cpu, target, 0.5); // Lower weight for background lanes
        } else {
            // Synchronous: Immediate reconciliation
            this.reconcileFiber(cpu, target, 1.0);
        }

        // Strand D: PSR Governance (Preventive Self-Rollback)
        this.validateStateInvariants();
    }

    private getNextLane(cpu: number, target: number): number {
        if (cpu > target * 1.8) return SyncLane;
        if (cpu > target * 1.2) return InputContinuousLane;
        if (cpu < target * 0.5) return OffscreenLane;
        return DefaultLane;
    }

    /**
     * Siphoned: Taint Tracking & Reconciliation
     * GROG'S LAW: Failure elimination via state tainting.
     */
    private reconcileFiber(cpu: number, target: number, priority: number): void {
        const delta = target - cpu;
        const adjustment = delta < 0 ? delta * (priority * 2) : delta * (priority * 0.2);
        
        const nextRate = this.applyConstraintBounds(this.current.rate + adjustment);
        
        this.dispatch({
            type: 'RECONCILE',
            cpu,
            target,
            priority
        });

        this.workInProgress.rate = nextRate;

        // Taint Tracking: If rate hits floor under high pressure, taint the fiber
        if (nextRate <= this.config.MinSamplingRate && cpu > target) {
            this.dispatch({ type: 'TAINT_FAILURE', reason: 'REACHED_CRITICAL_FLOOR' });
        }
    }

    private dispatch(action: FiberAction): void {
        const fiber = this.workInProgress;
        
        switch (action.type) {
            case 'RECONCILE':
                fiber.phi = Math.max(0, 1.0 - Math.abs(action.target - action.cpu));
                fiber.lambda = action.cpu / action.target;
                fiber.ers = action.cpu > action.target ? Math.min(1.0, (action.cpu - action.target) * action.priority) : 0;
                break;

            case 'TAINT_FAILURE':
                fiber.tainted = true;
                fiber.ers = 1.0;
                break;

            case 'HYDRATE_RECOVERY':
                fiber.rate = this.config.MinSamplingRate;
                fiber.tainted = false;
                fiber.lanes = SyncLane;
                break;
        }
    }

    private commitWork(): void {
        this.workInProgress.memoizedRate = this.workInProgress.rate;
        this.workInProgress.lastEffect = Date.now();
        this.current = { ...this.workInProgress };
    }

    private validateStateInvariants(): void {
        if (isNaN(this.workInProgress.rate) || this.workInProgress.lambda > 3.0) {
            this.dispatch({ type: 'TAINT_FAILURE', reason: 'INVARIANT_VIOLATION' });
        }
    }

    private applyConstraintBounds(rate: number): number {
        const clamped = Math.max(this.config.MinSamplingRate, Math.min(this.config.MaxSamplingRate, rate));
        return parseFloat(clamped.toFixed(6));
    }

    private rollbackToCurrent(reason: string): number {
        console.warn(`[NEXUS_GOVERNANCE] ROLLBACK: ${reason}`);
        this.workInProgress = { ...this.current };
        return this.current.rate;
    }

    private throwAndRecover(reason: string): number {
        this.dispatch({ type: 'HYDRATE_RECOVERY' });
        this.commitWork();
        return this.config.MinSamplingRate;
    }

    /**
     * Siphoned: Server Action Ingestion
     */
    public ingestRemoteOverride(payload: string): void {
        try {
            const data = this.recoverJSON(payload);
            if (data?.rate !== undefined) {
                this.workInProgress = { ...this.current, lanes: SyncLane };
                this.workInProgress.rate = this.applyConstraintBounds(data.rate);
                this.commitWork();
            }
        } catch (e) {
            this.emitLearningByDeath(e);
        }
    }

    private recoverJSON(input: string): any {
        try {
            return JSON.parse(input);
        } catch {
            const match = input.match(/\{[\s\S]*\}/);
            if (match) {
                try { return JSON.parse(match[0]); } catch { return null; }
            }
            return null;
        }
    }

    /**
     * GROG’S LAW: Learning-by-Death
     */
    private emitLearningByDeath(error: any): void {
        const deathLog = {
            action: "FIBER_RECONCILIATION_CRASH",
            result: error instanceof Error ? error.stack : String(error),
            lesson: "Taint propagation failed to isolate corruption. Recalibrating root.",
            success: false,
            parameters: { 
                phi: this.current.phi, 
                ers: this.current.ers,
                tainted: this.current.tainted
            }
        };

        const safeLog = this.safeUtoa(JSON.stringify(deathLog));
        console.error(`[GROG_LEARN] DALEK_CAAN_v3.1_SIG_0xFF23A1: ${safeLog}`);
    }

    private safeUtoa(str: string): string {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
            String.fromCharCode(parseInt(p1, 16))
        ));
    }
}