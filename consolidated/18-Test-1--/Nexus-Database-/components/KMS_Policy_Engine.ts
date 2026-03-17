/**
 * @file KMS_Policy_Engine.ts
 * @description Centralized policy enforcement component for cryptographic operations, 
 * responsible for validating signature integrity, usage compliance, and lifecycle state 
 * against defined policies.
 */

import { KMS_Identity_Mapping } from '../config/KMS_Identity_Mapping.json';
import { PolicyStructure, KeyRequest, UsageProfile, IdentityMapEntry } from '../types/KMS_Policy_Types';

/**
 * Custom error class for detailed policy validation failures.
 */
export class PolicyValidationError extends Error {
  constructor(message: string, public identityId: string, public checkFailed: string) {
    super(message);
    this.name = 'PolicyValidationError';
  }
}

/**
 * KMSPolicyEngine
 * Handles complex policy enforcement using strongly typed configuration.
 */
class KMSPolicyEngine {
  private policies: PolicyStructure;

  constructor() {
    // Cast the imported JSON structure to the defined interface for safety
    this.policies = KMS_Identity_Mapping as unknown as PolicyStructure;
  }

  /**
   * Resolves the identity entry from the mapping.
   */
  private getIdentityEntry(identityId: string): IdentityMapEntry {
    const roleEntry = this.policies.identity_map.find(e => e.identity_id === identityId);
    if (!roleEntry) {
      throw new PolicyValidationError(`Identity ${identityId} not mapped in system policies.`, identityId, 'IdentityResolution');
    }
    return roleEntry;
  }

  /**
   * Resolves the usage profile based on the identity entry.
   */
  private getUsageProfile(roleEntry: IdentityMapEntry): UsageProfile {
    const profile = this.policies.usage_profiles[roleEntry.usage_profile_id];
    if (!profile) {
        throw new PolicyValidationError(`Usage profile ${roleEntry.usage_profile_id} not defined.`, roleEntry.identity_id, 'ProfileResolution');
    }
    return profile;
  }

  /**
   * 1. Checks if the requested operation is permitted by the profile.
   */
  private checkAllowedUsage(identityId: string, profile: UsageProfile, operation: string): void {
    if (!profile.allowed_usages.includes(operation)) {
      throw new PolicyValidationError(
        `Operation ${operation} forbidden for profile ${profile.description}.`,
        identityId,
        'ForbiddenUsage'
      );
    }
  }

  /**
   * 2. Checks if the signature age exceeds the globally defined Time-To-Live (TTL).
   */
  private checkSignatureTTL(identityId: string, signatureAgeMinutes: number): void {
    const globalTTL = this.policies.global_security_policies.signature_ttl_minutes;
    if (signatureAgeMinutes > globalTTL) {
      throw new PolicyValidationError(
        `Signature expired (Age: ${signatureAgeMinutes}m). Max TTL: ${globalTTL}m.`,
        identityId,
        'SignatureTTL'
      );
    }
  }

  /**
   * 3. Checks for geospatial compliance if required by global policy.
   */
  private checkGeospatialLock(identityId: string, geoCoordinate?: [number, number]): void {
    const geoConfig = this.policies.global_security_policies.access_controls;
    if (geoConfig.enforce_geospatial_lock && !geoCoordinate) {
        throw new PolicyValidationError('Geospatial verification missing when required.', identityId, 'GeospatialLock');
    }
    // NOTE: Full GeoFence enforcement logic (e.g., checking coordinates against 'allowed_countries') 
    // would be handled by an external GeoIP utility and integrated here.
  }
  
  /**
   * Validates a KeyRequest against all applicable policies.
   * Throws PolicyValidationError on first failure.
   */
  public validate(request: KeyRequest): boolean {
    const identityEntry = this.getIdentityEntry(request.identityId);
    const profile = this.getUsageProfile(identityEntry);

    // Execute Checks
    this.checkAllowedUsage(request.identityId, profile, request.operation);
    this.checkSignatureTTL(request.identityId, request.signatureAgeMinutes);
    this.checkGeospatialLock(request.identityId, request.geoCoordinate);

    return true; // All policies passed
  }
}

export const kmsPolicyEngine = new KMSPolicyEngine();
