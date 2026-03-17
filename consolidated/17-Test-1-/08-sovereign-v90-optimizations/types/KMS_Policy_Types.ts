/**
 * @file KMS_Policy_Types.ts
 * @description Centralized type definitions for the KMS policy structure derived from configuration files (e.g., KMS_Identity_Mapping.json).
 * This ensures type safety across the KMS Policy Engine and related components.
 */

// --- Type Aliases for Enhanced Strictness ---

/** Defines a geographical coordinate as [latitude, longitude]. */
export type GeoCoordinate = [number, number]; 

/** Defines the set of permissible operations within the KMS. */
export type KMSOperation = 
  | 'SIGN_RECOVERY' 
  | 'STATE_ATTESTATION'
  | 'DECRYPT_DATA'
  | 'ENCRYPT_DATA'
  | 'KEY_GENERATION';

/** Defines the possible states for key rotation status. */
export type KeyRotationStatus = 'ACTIVE' | 'PENDING_DEPRECATION' | 'DEPRECATED';

// --- Runtime Request Interface ---

export interface KeyRequest {
  identityId: string;
  operation: KMSOperation; 
  signatureAgeMinutes: number;
  geoCoordinate?: GeoCoordinate;
}

// --- Configuration Interfaces ---

export interface UsageProfile {
  description: string;
  allowed_usages: KMSOperation[];
  max_concurrent_ops?: number; 
  rate_limit_per_minute?: number;
}

export interface IdentityMapEntry {
    identity_id: string;
    usage_profile_id: string;
    description: string;
    key_rotation_status?: KeyRotationStatus;
}

export interface GlobalSecurityPolicies {
  signature_ttl_minutes: number;
  access_controls: {
    enforce_geospatial_lock: boolean;
    allowed_countries?: string[];
  };
  enforce_key_rotation_check: boolean;
}

export interface PolicyStructure {
  identity_map: IdentityMapEntry[];
  usage_profiles: { [key: string]: UsageProfile };
  global_security_policies: GlobalSecurityPolicies;
}