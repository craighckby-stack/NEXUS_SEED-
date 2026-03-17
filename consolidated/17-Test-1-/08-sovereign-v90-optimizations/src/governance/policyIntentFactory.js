/**
 * Kernel: Policy Intent Factory Kernel (PIF-v94.1 Refactored)
 * ID: PIF-v94.1R
 * Mandate: Asynchronously centralize the creation of standardized, high-security mutation intent packages (M-XX series),
 * ensuring strict metadata compliance required for RSAM attestation by leveraging asynchronous registry services.
 */

class PolicyIntentFactoryKernel {
 /**
 * @param { PayloadSchemaRegistryKernel } payloadSchemaRegistryKernel - For loading intent configuration metadata (e.g., INTENT_SCHEMAS).
 * @param {ITraceableIdGeneratorToolKernel} traceableIdGeneratorToolKernel - For generating standardized, traceable IDs.
 */
 constructor(payloadSchemaRegistryKernel, traceableIdGeneratorToolKernel) {
 if (!payloadSchemaRegistryKernel || typeof payloadSchemaRegistryKernel.getSchema !== 'function') {
 throw new Error("PolicyIntentFactoryKernel requires a compliant PayloadSchemaRegistryKernel.");
 }
 if (!traceableIdGeneratorToolKernel || typeof traceableIdGeneratorToolKernel.generateTraceableId !== 'function') {
 throw new Error("PolicyIntentFactoryKernel requires a compliant ITraceableIdGeneratorToolKernel.");
 }

 this.schemaRegistry = payloadSchemaRegistryKernel;
 this.idGenerator = traceableIdGeneratorToolKernel;
 this.intentSchemasCache = null;
 }

 /**
 * Asynchronously initializes the kernel by loading required schemas.
 * This replaces the synchronous 'require' operation.
 */
 async initialize() {
 if (this.intentSchemasCache === null) {
 // Load intent metadata structure asynchronously from the centralized registry.
 this.intentSchemasCache = await this.schemaRegistry.getSchema('GOVERNANCE_INTENT_METADATA');
 if (!this.intentSchemasCache) {
 // Use MultiTargetAuditDisperserToolKernel in a full implementation, here we throw for fast failure.
 throw new Error("Initialization failed: Could not load GOVERNANCE_INTENT_METADATA schemas.");
 }
 }
 }

 /**
 * Validates and retrieves the required metadata for a given intent type ID (M-XX).
 * @param {string} typeId - E.g., 'M01', 'M02'.
 * @returns {Object} Intent configuration metadata.
 */
 _getIntentMetadata(typeId) {
 if (!this.intentSchemasCache) {
 // Should be initialized externally, but a check remains.
 throw new Error("PolicyIntentFactoryKernel not initialized. Call initialize() first.");
 }

 const metadata = this.intentSchemasCache[typeId];
 if (!metadata) {
 // High security requirement: fail fast on unknown intent types.
 throw new Error(`PIF Integrity Breach: Unknown Intent Type ID provided: ${typeId}`);
 }
 return metadata;
 }

 /**
 * Generically creates a standardized, high-security mutation intent package (M-XX series).
 * Replaces synchronous execution with asynchronous delegation and ensures high-integrity output.
 *
 * @param {string} typeId - The registered intent code (e.g., 'M01').
 * @param {Object} rawRequest - The core operational payload.
 * @returns {Promise < Readonly < Object>>} Structured intent object for governance registration.
 */
 async createIntent(typeId, rawRequest) {
 // Ensure schemas are loaded if initialization hasn't occurred.
 if (!this.intentSchemasCache) await this.initialize();

 const metadata = this._getIntentMetadata(typeId);

 // Delegation to specialized, asynchronous Tool Kernel for traceable ID generation
 const intentId = await this.idGenerator.generateTraceableId(typeId);

 // Construct the compliant package based on centralized governance configuration
 const intentPackage = {
 id: intentId,
 type: metadata.type,
 priority: metadata.priority,
 timestamp: new Date().toISOString(),
 // Embed the original raw payload safely
 targetPayload: rawRequest,
 // Attach standardized security requirements derived from the schema
 securityMetadata: metadata.security
 };

 // Enforce immutability on the final output package.
 return Object.freeze(intentPackage);
 }
}

module.exports = PolicyIntentFactoryKernel;
