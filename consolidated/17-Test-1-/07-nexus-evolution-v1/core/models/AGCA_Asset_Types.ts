/**
 * Core Type Definitions for the Autonomous Global Configuration Authority (AGCA) Assets.
 */

/**
 * Defines the constant identifier for the AGCA Protocol-Compliant Trust Model (PCTM) Asset, version 1.
 */
const AGCA_PCTM_V1_ID = 'AGCA_PCTM_V1' as const;

/**
 * A reusable type alias for generic JSON-compatible configuration payloads.
 */
export type AGCA_ConfigurationPayload = Record<string, unknown>;

/**
 * The core configuration payload that is subject to hashing and signing.
 * Note: Specific PCTM implementations should narrow this type for enforcement.
 */
export type AGCA_PCTM_V1_ConfigurationData = AGCA_ConfigurationPayload;


export interface AGCA_PCTM_V1_Metadata {
    /** URI reference pointing to the required public key within the Global Key Management (GKM). */
    readonly gkm_key_reference: string;
    /** Cryptographic signature over the serialized configuration_data. */
    readonly gkm_signature: string;
    /** SHA-256 hash of the serialized configuration_data payload. */
    readonly hash_sha256: string;
    /** Unix timestamp (seconds since epoch) when the asset was issued/last modified. */
    readonly timestamp_issued: number;
    /** Identifier of the sovereign entity (Agent) that issued/owns this configuration. */
    readonly owner_agent: string;
    /** Standard identifier (Must be "AGCA_PCTM_V1"). */
    readonly pctm_standard_id: typeof AGCA_PCTM_V1_ID;
}

/**
 * The complete AGCA Protocol-Compliant Trust Model (PCTM) Asset, version 1.
 */
export interface AGCA_PCTM_V1_Asset {
    readonly metadata: AGCA_PCTM_V1_Metadata;
    readonly configuration_data: AGCA_PCTM_V1_ConfigurationData;
}