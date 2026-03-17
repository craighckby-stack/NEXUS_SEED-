interface SignatureObject {
  algorithm: 'Ed25519' | 'ECDSA_P256' | 'RSA_PSS';
  value: string; // Hex string
}

/**
 * Defines the interface for signing and verifying the integrity
 * of the entire ESVS Manifest content prior to distribution.
 */
export interface ManifestSigner {
  
  /**
   * Creates a detached signature for a normalized manifest content.
   * @param manifestContent The canonicalized JSON string of the manifest.
   * @param privateKey The key used for signing.
   * @param algorithm The signature algorithm to use.
   * @returns A SignatureObject.
   */
  sign(manifestContent: string, privateKey: string, algorithm: SignatureObject['algorithm']): Promise<SignatureObject>;

  /**
   * Verifies the detached signature against the manifest content.
   * @param manifestContent The canonicalized JSON string of the manifest.
   * @param signature The signature object to verify.
   * @param publicKey The corresponding public key.
   * @returns True if verification succeeds.
   */
  verify(manifestContent: string, signature: SignatureObject, publicKey: string): Promise<boolean>;
}