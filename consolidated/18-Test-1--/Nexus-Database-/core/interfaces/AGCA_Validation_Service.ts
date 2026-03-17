import { AGCA_PCTM_V1_Asset, AGCA_PCTM_V1_ConfigurationData } from "../models/AGCA_Asset_Types";
import { AGCA_IntegrityError, AGCA_SignatureVerificationError, AGCA_AuthorizationError } from "../errors/AGCA_Security_Errors";

export interface AGCA_Validation_Service {
  
  /**
   * Orchestrates the complete cryptographic integrity, authenticity, and authorization validation sequence 
   * for an AGCA Asset, ensuring it is trustworthy and legally signed.
   * 
   * Runs all three critical validation steps (Hash, Signature, Authorization).
   * @param asset The strongly typed AGCA_PCTM_V1 configuration asset object.
   * @throws {AGCA_IntegrityError} If hash mismatch occurs (tampering).
   * @throws {AGCA_SignatureVerificationError} If the cryptographic signature is invalid or key is revoked.
   * @throws {AGCA_AuthorizationError} If the signing agent is unauthorized for this standard/version.
   */
  validateAsset(asset: AGCA_PCTM_V1_Asset): Promise<void>;

  /**
   * Step 1: Checks if the embedded hash matches the calculated hash of the canonical configuration data.
   * Ensures data integrity (proof of non-tampering).
   * 
   * NOTE: Implementation must ensure consistent canonical serialization of dataPayload prior to hashing.
   * @param dataPayload The raw configuration data object (the content being hashed/verified).
   * @param expectedHash The hash_sha256 value from the asset's metadata.
   * @returns Promise<boolean> True if hashes match.
   */
  verifyHashIntegrity(
    dataPayload: AGCA_PCTM_V1_ConfigurationData,
    expectedHash: string
  ): Promise<boolean>;

  /**
   * Step 2: Validates the cryptographic signature against the referenced GKM key material.
   * Ensures authenticity (proof of origin).
   * Requires secure interaction with the Global Key Management (GKM) system.
   * 
   * NOTE: Implementation must re-derive the signed canonical payload (usually the serialized dataPayload)
   * before signature verification.
   * @param dataPayload The content that was originally signed (used to rebuild the signing payload).
   * @param signature The gkm_signature value (e.g., base64 or similar encoded signature blob).
   * @param keyReference The gkm_key_reference URI identifying the public key.
   * @returns Promise<boolean> True if the signature is valid.
   */
  verifyCryptographicSignature(
    dataPayload: AGCA_PCTM_V1_ConfigurationData,
    signature: string,
    keyReference: string
  ): Promise<boolean>;

  /**
   * Step 3: Checks if the owner_agent possesses the required permissions (policy/role) 
   * to issue/modify assets under this specific PCTM version/standard.
   * Ensures authorization (proof of legal standing).
   * Requires external Authorization Service (AAS) consultation.
   * @param agentId The owner_agent identifier (Principal ID).
   * @param standardId The pctm_standard_id (e.g., "AGCA_PCTM_V1").
   * @returns Promise<boolean> True if the agent is authorized.
   */
  verifyAgentAuthorization(agentId: string, standardId: string): Promise<boolean>;
}