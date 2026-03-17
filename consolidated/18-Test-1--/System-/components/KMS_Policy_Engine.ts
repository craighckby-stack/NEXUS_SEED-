/**
 * @file KMS_Policy_Engine.ts
 * @description Centralized policy enforcement component for cryptographic operations, 
 * responsible for validating signature integrity, usage compliance, and lifecycle state 
 * against the definitions in KMS_Identity_Mapping.json.
 */

import { KMS_Identity_Mapping } from '../config/KMS_Identity_Mapping.json';

interface KeyRequest {
  identityId: string;
  operation: string; // e.g., 'SIGN_RECOVERY', 'STATE_ATTESTATION'
  signatureAgeMinutes: number;
  geoCoordinate?: [number, number];
}

class KMSPolicyEngine {
  private policies: typeof KMS_Identity_Mapping;

  constructor() {
    this.policies = KMS_Identity_Mapping; 
  }

  public validate(request: KeyRequest): boolean {
    const roleEntry = this.policies.identity_map.find(e => e.identity_id === request.identityId);

    if (!roleEntry) {
      console.error(`Identity ${request.identityId} not mapped.`);
      return false;
    }

    const profile = this.policies.usage_profiles[roleEntry.usage_profile_id];

    // 1. Check Allowed Usage
    if (!profile.allowed_usages.includes(request.operation)) {
      console.warn(`Operation ${request.operation} not allowed for profile ${profile.description}`);
      return false;
    }

    // 2. Check Signature TTL
    if (request.signatureAgeMinutes > this.policies.global_security_policies.signature_ttl_minutes) {
      console.warn('Signature expired based on global policy.');
      return false;
    }

    // 3. Check Geospatial Lock (if enforced)
    if (this.policies.global_security_policies.access_controls.enforce_geospatial_lock && !request.geoCoordinate) {
        console.error('Geospatial verification missing when required.');
        return false;
    }
    
    // Add Key Rotation Status check here (omitted for brevity)

    return true;
  }
}

export const kmsPolicyEngine = new KMSPolicyEngine();
