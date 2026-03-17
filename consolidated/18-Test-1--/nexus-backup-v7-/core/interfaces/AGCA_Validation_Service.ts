export interface AGCA_Validation_Service {
  
  /**
   * Verifies the cryptographic integrity and authorization of an AGCA Asset.
   * @param asset The parsed AGCA_PCTM_V1 configuration asset object.
   * @throws {Error} If validation fails due to tampering, unauthorized agent, or invalid signature.
   */
  validateAsset(asset: any): Promise<void>;

  /**
   * Step 1: Checks if the embedded hash matches the calculated hash of the configuration_data.
   * @param dataPayload The raw data (configuration_data object).
   * @param expectedHash The hash_sha256 value from the metadata.
   */
  verifyHashIntegrity(dataPayload: object, expectedHash: string): Promise<boolean>;

  /**
   * Step 2: Validates the cryptographic signature against the referenced GKM key.
   * Requires querying GKM for key state and public certificate.
   * @param signature The gkm_signature value.
   * @param keyReference The gkm_key_reference URI.
   */
  verifyCryptographicSignature(signature: string, keyReference: string): Promise<boolean>;

  /**
   * Step 3: Checks if the owner_agent is authorized to issue/modify this PCTM version.
   * @param agentId The owner_agent identifier.
   * @param standardId The pctm_standard_id.
   */
  verifyAgentAuthorization(agentId: string, standardId: string): Promise<boolean>;
}