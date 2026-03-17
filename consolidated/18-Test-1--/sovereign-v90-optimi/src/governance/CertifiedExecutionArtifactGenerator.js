/**
 * Interface for the extracted cryptographic utility.
 * This interface is satisfied by the Integrity Utility Plugin.
 */
interface IntegrityHashingAndSigningUtilityInterface {
    hash(record: any): string;
    sign(payload: any, signingKey: string): string;
}

/**
 * @class CEAG
 * Manages the finalization of a successful governance proposal into an artifact ready for implementation.
 */
class CEAG {
    private signingKey: string;
    private cryptoUtility: IntegrityHashingAndSigningUtilityInterface;

    /**
     * @param {object} trustLayerConfig - Configuration containing the signing key.
     * @param {string} trustLayerConfig.SIGNING_KEY_PRIVATE - The private key used for artifact signing.
     * @param {IntegrityHashingAndSigningUtilityInterface} [cryptoUtilityInstance] - Optional injected utility.
     */
    constructor(trustLayerConfig: { SIGNING_KEY_PRIVATE: string }, cryptoUtilityInstance?: IntegrityHashingAndSigningUtilityInterface) {
        this.signingKey = trustLayerConfig.SIGNING_KEY_PRIVATE;
        
        // Dependency Injection and Fallback Handling
        if (cryptoUtilityInstance) {
             this.cryptoUtility = cryptoUtilityInstance;
        } else {
             // Fallback instantiation: relies on the utility being available via a global plugin.
             const Utility = (globalThis as any).IntegrityHashingAndSigningUtility;
             if (!Utility) {
                 throw new Error("Cryptography Utility missing. Must be injected or available globally.");
             }
             this.cryptoUtility = new Utility(); 
        }
    }

    /**
     * Creates the final certified execution artifact.
     * @param {object} immutableTransactionRecord - The ITR output from GSEP-C L8.
     * @returns {object} Certified execution payload.
     */
    generateArtifact(immutableTransactionRecord: { validated_payload: any, context: any, p01_seal_valid?: boolean }): { certifiedPayload: object, signature: string, manifestVersion: string } {
        const { validated_payload, context } = immutableTransactionRecord;

        if (!this.validateITR(immutableTransactionRecord)) {
            throw new Error("ITR failed validation: P-01 Seal is not valid or missing.");
        }

        const timestamp = new Date().toISOString();
        
        // Step 1: Hash the entire record using the extracted utility
        const itrHash = this.cryptoUtility.hash(immutableTransactionRecord);

        const payload = {
            ITR_HASH: itrHash,
            ITR_TIMESTAMP: timestamp,
            PROPOSAL_CONTEXT: context, 
            EXECUTION_PARAMS: validated_payload
        };

        // Step 2: Sign the resulting payload using the extracted utility
        const signature = this.cryptoUtility.sign(payload, this.signingKey);

        return {
            certifiedPayload: payload,
            signature: signature,
            manifestVersion: 'CEAG-V1'
        };
    }

    /**
     * Placeholder validation check for the ITR.
     * Must ensure L7/P-01 Seal is present and valid.
     * @param {object} record 
     * @returns {boolean}
     */
    private validateITR(record: { p01_seal_valid?: boolean }): boolean {
        // TODO: Integrate dedicated structural schema validator (e.g., StructuralSchemaValidatorTool) here.
        return record && record.p01_seal_valid === true;
    }
}

export = CEAG;