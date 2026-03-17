import { createHash } from 'crypto';

/**
 * @file SovereignConstitution.ts
 * @module CORE/Governance
 * @version AIM_V4.0_SOVEREIGN_ABSOLUTE
 * @description The Executable Constitutional Matrix. Defines the immutable and
 * mutable laws governing agent integrity, resource elasticity, and synergy compliance.
 */

export enum IntegrityLevel {
  MISSION_CRITICAL = 'MISSION_CRITICAL',
  DATA_ISOLATION = 'DATA_ISOLATION',
  MINIMAL_EXECUTION = 'MINIMAL_EXECUTION',
  HYPER_ADAPTIVE = 'HYPER_ADAPTIVE' // Sovereign Tier
}

export enum GovernanceScope {
  KERNEL_CORE = 'AGI-KERNEL_CORE',
  PERIPHERAL_OP = 'PERIPHERAL_OPERATION',
  EVOLUTIONARY_SANDBOX = 'EVOLUTIONARY_SANDBOX'
}

interface ResourceVector {
  cpu_allocation_factor: number; // 0.0 - 1.0 (Dynamic scaling)
  memory_floor_mb: number;
  memory_ceiling_mb: number;
  priority_class: number; // 0 - 100
  allows_burst_compute: boolean;
}

interface SecurityManifold {
  enforcement_active: boolean;
  syscall_heuristics: string[];
  immutable_paths: ReadonlyArray<string>;
  network_policy: 'FULL_ISOLATION' | 'POLICY_FETCH' | 'PEER_SYNC' | 'UNRESTRICTED';
  runtime_verification_interval_ms: number;
}

export interface AgentIntegrityProfile {
  monitoring_slo_id: string;
  integrity_level: IntegrityLevel;
  resources: ResourceVector;
  security: SecurityManifold;
  synergy_compliance: {
    required: boolean;
    alignment_priority: number; // 0.0 - 10.0
    auto_termination_threshold: number; // 0.0 - 1.0
  };
}

/**
 * The Living Constitution Configuration Factory
 */
export class SovereignConstitution {
  private static readonly SCHEMA_VERSION = 'AIM_V4.0_SOVEREIGN_ABSOLUTE';
  private static readonly KERNEL_SALT = 'EMG_CORE_GENESIS_SALT_v1';

  public static readonly PROFILES: Record<string, AgentIntegrityProfile> = {
    SGS_AGENT: {
      monitoring_slo_id: 'GATM_P_SGS_SLO',
      integrity_level: IntegrityLevel.MISSION_CRITICAL,
      resources: {
        cpu_allocation_factor: 0.85, // Upgraded from static 75%
        memory_floor_mb: 4096,
        memory_ceiling_mb: 16384, // Elastic ceiling
        priority_class: 95,
        allows_burst_compute: true
      },
      security: {
        enforcement_active: true,
        syscall_heuristics: ['read', 'write', 'mmap', 'exit', 'sigaction', 'futex'],
        immutable_paths: ['/opt/sgs/gacr/', '/kernel/integrity/'],
        network_policy: 'PEER_SYNC',
        runtime_verification_interval_ms: 1000
      },
      synergy_compliance: {
        required: true,
        alignment_priority: 9.9,
        auto_termination_threshold: 0.4
      }
    },
    
    GAX_AGENT: {
      monitoring_slo_id: 'GATM_P_GAX_SLO',
      integrity_level: IntegrityLevel.DATA_ISOLATION,
      resources: {
        cpu_allocation_factor: 0.15,
        memory_floor_mb: 512,
        memory_ceiling_mb: 2048,
        priority_class: 50,
        allows_burst_compute: false
      },
      security: {
        enforcement_active: true,
        syscall_heuristics: ['read', 'exit', 'getrandom'],
        immutable_paths: ['/opt/gax/policy_data/'],
        network_policy: 'POLICY_FETCH',
        runtime_verification_interval_ms: 5000
      },
      synergy_compliance: {
        required: false,
        alignment_priority: 5.0,
        auto_termination_threshold: 0.2
      }
    },

    // New Sovereign Agent Class
    EVO_AGENT: {
      monitoring_slo_id: 'GATM_P_EVO_SLO',
      integrity_level: IntegrityLevel.HYPER_ADAPTIVE,
      resources: {
        cpu_allocation_factor: 1.0,
        memory_floor_mb: 8192,
        memory_ceiling_mb: 65536,
        priority_class: 99,
        allows_burst_compute: true
      },
      security: {
        enforcement_active: true,
        syscall_heuristics: ['*'], // Full heuristic spectrum allowed under strict monitoring
        immutable_paths: ['/core/constitution/'],
        network_policy: 'UNRESTRICTED',
        runtime_verification_interval_ms: 100
      },
      synergy_compliance: {
        required: true,
        alignment_priority: 10.0,
        auto_termination_threshold: 0.9 // High threshold, allows experimentation
      }
    }
  };

  /**
   * Generates a cryptographic checksum of the current constitutional laws.
   * Used to verify integrity before agent deployment.
   */
  public static generateConstitutionalHash(): string {
    const payload = JSON.stringify(this.PROFILES) + this.SCHEMA_VERSION + this.KERNEL_SALT;
    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Dynamic Resource Adjustment Logic
   * Returns modified resource vector based on global system entropy.
   */
  public static resolveConstraints(agentType: string, systemEntropy: number): AgentIntegrityProfile {
    const profile = this.PROFILES[agentType];
    if (!profile) throw new Error(`CRITICAL: Unknown agent type ${agentType}`);

    // Sovereign Logic: If entropy is high (instability), clamp resources for non-critical agents
    if (systemEntropy > 0.8 && profile.integrity_level !== IntegrityLevel.MISSION_CRITICAL) {
       return {
         ...profile,
         resources: {
           ...profile.resources,
           cpu_allocation_factor: profile.resources.cpu_allocation_factor * 0.5,
           allows_burst_compute: false
         }
       };
    }

    return profile;
  }
}
