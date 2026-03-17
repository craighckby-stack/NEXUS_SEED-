/**
 * Core Type Definitions for the Autonomous Global Configuration Authority (AGCA) Assets.
 */

export interface AGCA_PCTM_V1_Metadata {
    /** URI reference pointing to the required public key within the Global Key Management (GKM). */
    gkm_key_reference: string;
    /** Cryptographic signature over the serialized configuration_data. */
    gkm_signature: string;
    /** SHA-256 hash of the serialized configuration_data payload. */
    hash_sha256: string;
    /** Unix timestamp when the asset was issued/last modified. */
    timestamp_issued: number;
    /** Identifier of the sovereign entity (Agent) that issued/owns this configuration. */
    owner_agent: string;
    /** Standard identifier (e.g., "AGCA_PCTM_V1"). */
    pctm_standard_id: string;
}

/**
 * The core configuration payload that is subject to hashing and signing.
 */
export interface AGCA_PCTM_V1_ConfigurationData {
    [key: string]: any;
    // Note: In a production system, this type would be defined more specifically
    // based on the intended use of the PCTM (e.g., routing tables, policy settings).
}

/**
 * The complete AGCA Protocol-Compliant Trust Model (PCTM) Asset, version 1.
 */
export interface AGCA_PCTM_V1_Asset {
    metadata: AGCA_PCTM_V1_Metadata;
    configuration_data: AGCA_PCTM_V1_ConfigurationData;
}