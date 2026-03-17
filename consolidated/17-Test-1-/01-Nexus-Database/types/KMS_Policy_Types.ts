/**
 * @file KMS_Policy_Types.ts
 * @description Centralized type definitions for the KMS policy structure derived from configuration files (e.g., KMS_Identity_Mapping.json).
 * This ensures type safety across the KMS Policy Engine and related components.
 */

export interface KeyRequest {
  identityId: string;
  operation: string; // e.g., 'SIGN_RECOVERY', 'STATE_ATTESTATION'
  signatureAgeMinutes: number;
  geoCoordinate?: [number, number];
}

export interface UsageProfile {
  description: string;
  allowed_usages: string[];
  max_concurrent_ops?: number; 
  rate_limit_per_minute?: number;
}

export interface IdentityMapEntry {
    identity_id: string;
    usage_profile_id: string;
    description: string;
    key_rotation_status?: 'ACTIVE' | 'PENDING_DEPRECATION' | 'DEPRECATED';
}

export interface GlobalSecurityPolicies {
  signature_ttl_minutes: number;
  access_controls: {
    enforce_geospatial_lock: boolean;
    allowed_countries?: string[];
  };
  enforce_key_rotation_check: boolean; // Proposed security measure
}

export interface PolicyStructure {
  identity_map: IdentityMapEntry[];
  usage_profiles: { [key: string]: UsageProfile };
  global_security_policies: GlobalSecurityPolicies;
}
