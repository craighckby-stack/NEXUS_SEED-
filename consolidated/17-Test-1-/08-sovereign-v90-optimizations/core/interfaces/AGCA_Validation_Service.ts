import { AGCA_PCTM_V1_Asset } from "../models/AGCA_Asset_Types";
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
   * NOTE: Implementation must ensure consistent canonical serialization of configurationData prior to hashing.
   * @param asset The AGCA Asset containing the configuration data and expected hash.
   * @throws {AGCA_IntegrityError} If hash mismatch occurs.
   */
  verifyHashIntegrity(asset: AGCA_PCTM_V1_Asset): Promise<void>;

  /**
   * Step 2: Validates the cryptographic signature against the referenced GKM key material.
   * Ensures authenticity (proof of origin).
   * Requires secure interaction with the Global Key Management (GKM) system.
   *
   * NOTE: Implementation must re-derive the signed canonical payload (usually the serialized configurationData)
   * before signature verification.
   * @param asset The AGCA Asset containing the configuration data, signature, and key reference.
   * @throws {AGCA_SignatureVerificationError} If the signature is invalid or key is revoked.
   */
  verifyCryptographicSignature(asset: AGCA_PCTM_V1_Asset): Promise<void>;

  /**
   * Step 3: Checks if the owner_agent possesses the required permissions (policy/role) 
   * to issue/modify assets under this specific PCTM version/standard.
   * Ensures authorization (proof of legal standing).
   * Requires external Authorization Service (AAS) consultation.
   * @param asset The AGCA Asset containing the agent ID and standard ID.
   * @throws {AGCA_AuthorizationError} If the agent is unauthorized.
   */
  verifyAgentAuthorization(asset: AGCA_PCTM_V1_Asset): Promise<void>;
}