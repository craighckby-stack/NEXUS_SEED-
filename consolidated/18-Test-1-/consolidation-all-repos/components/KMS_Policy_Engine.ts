/**
 * @file KMS_Policy_Engine.ts
 * @description Centralized policy enforcement component for cryptographic operations,
 * responsible for validating signature integrity, usage compliance, and lifecycle state
 * against defined policies.
 */

import { KMS_Identity_Mapping } from '../config/KMS_Identity_Mapping.json';
import { 
    PolicyStructure, 
    KeyRequest, 
    UsageProfile, 
    IdentityMapEntry 
} from '../types/KMS_Policy_Types';

// Assume standard Kernel capability interface for tool execution
declare const KERNEL_SYNERGY_CAPABILITIES: any;

// === Interface for Internal O(1) Caching ===
interface PolicyCache {
    identityMap: Record<string, IdentityMapEntry>;
    usageProfiles: Record<string, UsageProfile>;
    globalPolicies: PolicyStructure['global_security_policies'];
}

// Interface for the prepared dependencies needed for validation
interface ValidationContext {
    identityEntry: IdentityMapEntry;
    profile: UsageProfile;
}
// ===========================================

/**
 * Custom error class for detailed policy validation failures.
 */
export class PolicyValidationError extends Error {
  constructor(message: string, public identityId: string, public checkFailed: string) {
    super(message);
    this.name = 'PolicyValidationError';
  }
}

// Interface for the injected plugin utility
// This interface dictates that the host environment (KMSPolicyEngine) must pass necessary references (Error class, KERNEL capabilities)
interface ConstraintValidationAdapter {
    execute(
        identityId: string, 
        checkFailed: string, 
        toolArgs: object, 
        PolicyValidationErrorRef: typeof PolicyValidationError, 
        KERNEL_SYNERGY_CAPABILITIES_Ref: any
    ): void;
}

// In a real environment, this would be loaded dynamically. Mocking its presence for compilation.
const ConstraintValidationAdapter = { 
    execute: (identityId: string, checkFailed: string, toolArgs: object, ErrorRef: any, KERNEL_Ref: any) => { /* Mock for TS */ } 
} as unknown as ConstraintValidationAdapter;


/**
 * KMSPolicyEngine
 * Handles complex policy enforcement using strongly typed configuration.
 */
class KMSPolicyEngine {
  private cache: PolicyCache;
  private readonly adapter: ConstraintValidationAdapter = ConstraintValidationAdapter;

  constructor() {
    const policies = KMS_Identity_Mapping as unknown as PolicyStructure;
    
    // CRITICAL PERFORMANCE OPTIMIZATION:
    // Convert identity array (O(N) lookup) to a hash map (O(1) lookup) on initialization.
    const identityMap: Record<string, IdentityMapEntry> = policies.identity_map.reduce((acc, entry) => {
        acc[entry.identity_id] = entry;
        return acc;
    }, {} as Record<string, IdentityMapEntry>);

    this.cache = {
        identityMap,
        usageProfiles: policies.usage_profiles,
        globalPolicies: policies.global_security_policies,
    };
  }

  /**
   * Internal helper to delegate execution to the adapter, automatically injecting
   * static dependencies (Error class and KERNEL capabilities).
   */
  private #executeValidationCheck(identityId: string, checkFailed: string, toolArgs: object): void {
    this.adapter.execute(
        identityId,
        checkFailed,
        toolArgs,
        PolicyValidationError, // Static injection
        KERNEL_SYNERGY_CAPABILITIES // Static injection
    );
  }

  /**
   * Resolves the identity entry from the cached mapping (O(1)).
   */
  private #getIdentityEntry(identityId: string): IdentityMapEntry {
    const roleEntry = this.cache.identityMap[identityId];
    if (!roleEntry) {
      throw new PolicyValidationError(`Identity ${identityId} not mapped in system policies.`, identityId, 'IdentityResolution');
    }
    return roleEntry;
  }

  /**
   * Resolves the usage profile based on the identity entry (O(1)).
   */
  private #getUsageProfile(roleEntry: IdentityMapEntry): UsageProfile {
    const profile = this.cache.usageProfiles[roleEntry.usage_profile_id];
    if (!profile) {
        throw new PolicyValidationError(`Usage profile ${roleEntry.usage_profile_id} not defined.`, roleEntry.identity_id, 'ProfileResolution');
    }
    return profile;
  }

  /**
   * Separates the data preparation phase: resolves the identity entry and usage profile
   * which are critical dependencies for subsequent policy checks.
   * Throws PolicyValidationError if dependencies cannot be resolved.
   */
  private #prepareValidationContext(identityId: string): ValidationContext {
    const identityEntry = this.#getIdentityEntry(identityId);
    const profile = this.#getUsageProfile(identityEntry);
    return { identityEntry, profile };
  }

  /**
   * 1. Checks if the requested operation is permitted using the validation adapter.
   */
  private #checkAllowedUsage(identityId: string, profile: UsageProfile, operation: string): void {
    // Use abstracted helper to delegate tool execution
    this.#executeValidationCheck(
        identityId,
        'ForbiddenUsage',
        {
            operation: 'validateInclusion',
            value: operation,
            allowedList: profile.allowed_usages,
        }
    );
  }

  /**
   * 2. Checks if the signature age exceeds the globally defined Time-To-Live (TTL).
   */
  private #checkSignatureTTL(identityId: string, signatureAgeMinutes: number): void {
    const { signature_ttl_minutes: globalTTL } = this.cache.globalPolicies;

    // Use abstracted helper to delegate tool execution
    this.#executeValidationCheck(
        identityId,
        'SignatureTTL',
        {
            operation: 'validateNumericBound',
            value: signatureAgeMinutes,
            // We enforce value <= constraint (TTL)
            constraint: globalTTL,
        }
    );
  }

  /**
   * 3. Checks for geospatial compliance if required by global policy.
   */
  private #checkGeospatialLock(identityId: string, geoCoordinate?: [number, number]): void {
    const { access_controls } = this.cache.globalPolicies;
    
    if (access_controls.enforce_geospatial_lock && !geoCoordinate) {
        throw new PolicyValidationError('Geospatial verification missing when required.', identityId, 'GeospatialLock');
    }
  }

  /**
   * Validates a KeyRequest against all applicable policies.
   * Throws PolicyValidationError on first failure.
   */
  public validate(request: KeyRequest): boolean {
    // Step 1: Data Preparation/Dependency Resolution
    const { profile } = this.#prepareValidationContext(request.identityId);

    // Step 2: Policy Execution
    this.#checkAllowedUsage(request.identityId, profile, request.operation);
    this.#checkSignatureTTL(request.identityId, request.signatureAgeMinutes);
    this.#checkGeospatialLock(request.identityId, request.geoCoordinate);

    return true; // All policies passed
  }
}

export const kmsPolicyEngine = new KMSPolicyEngine();