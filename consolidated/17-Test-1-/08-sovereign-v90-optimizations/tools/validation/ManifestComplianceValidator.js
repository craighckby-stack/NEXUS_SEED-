// tools/validation/ManifestComplianceValidator.js

const fs = require('fs');
const path = require('path');
// AJV and YAML imports are now handled via plugins/injection.

// Constants derived from assumed root structure
const ROOT_DIR = path.join(__dirname, '..', '..');
const SCHEMA_DIR = path.join(ROOT_DIR, 'schema', 'governance');
const GOVERNANCE_MAP_PATH = path.join(ROOT_DIR, 'config', 'GovernanceManifestMap.json');

/**
 * Manages schema loading, compilation, and artifact validation using the central Governance Map.
 * Leverages ArtifactDataParser for I/O parsing and StructuralSchemaValidator for compliance checks.
 */
class ManifestComplianceValidator {
    
    // StructuralSchemaValidator instance
    private validator: any;
    // ArtifactDataParser instance
    private parser: any;
    private governanceMap: Record<string, any>;

    /**
     * @param plugins Injected tool interfaces (validator, parser).
     */
    constructor(plugins: { validator: any, parser: any }) {
        // Initialize Plugin interfaces
        this.validator = plugins.validator;
        this.parser = plugins.parser;

        this.governanceMap = this._loadGovernanceMap();
        this._loadAndCompileSchemas();
    }

    /**
     * Loads the external mapping file defining artifact-to-schema linkage.
     */
    _loadGovernanceMap(): Record<string, any> {
        if (fs.existsSync(GOVERNANCE_MAP_PATH)) {
            console.log(`MCV: Loading Governance Map from ${GOVERNANCE_MAP_PATH}`);
            const content = fs.readFileSync(GOVERNANCE_MAP_PATH, 'utf8');
            
            // Use parser plugin for robust JSON reading
            return this.parser.execute({ content, filePath: GOVERNANCE_MAP_PATH });
        }
        console.warn(`[MCV Initialization Warning] GovernanceManifestMap not found. Using internal fallback registry.`);
        
        // Fallback internal registry definition for immediate functionality (paths must be relative to ROOT_DIR)
        return {
            'TargetEvolutionMandateManifest.json': { schemaKey: 'TEMM', path: 'config/SGS/TargetEvolutionMandateManifest.json', required: true },
        };
    }

    /**
     * Loads and parses content (JSON or YAML) from a given file path using the ArtifactDataParser.
     */
    _loadContent(filePath: string): any {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Artifact/Schema not found: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        
        // PLUGIN CALL
        return this.parser.execute({ content, filePath });
    }

    /**
     * Identifies required schemas from the governance map and compiles them using the StructuralSchemaValidator.
     */
    _loadAndCompileSchemas(): void {
        let compilationSuccess = true;
        
        const requiredSchemas = new Set(Object.values(this.governanceMap).map(m => m.schemaKey));

        for (const schemaKey of requiredSchemas) {
            try {
                const schemaFileName = schemaKey + '.schema.json'; // Assumed naming convention
                const schemaPath = path.join(SCHEMA_DIR, schemaFileName);
                
                const schema = this._loadContent(schemaPath);
                
                // Use StructuralSchemaValidator plugin to add and compile the schema
                // Assuming StructuralSchemaValidator exposes an 'addSchema' interface.
                this.validator.addSchema({ schemaKey, schema });
                
            } catch (e: any) {
                console.error(`[FATAL] MCV Schema Compilation Failure (${schemaKey}): ${e.message}`);
                compilationSuccess = false;
            }
        }
        
        if (!compilationSuccess) {
            throw new Error("MCV Initialization Failure: Failed to compile critical governance schemas.");
        }
    }

    /**
     * Executes validation for all artifacts defined in the Governance Map.
     * Artifacts marked 'required: true' will cause failure if missing or invalid.
     * @returns {{passed: boolean, results: Array<Object>}} Detailed validation report.
     */
    validateArtifacts() {
        console.log("Executing Manifest Compliance Validator (MCV) - Pre-GSEP-C Check...");
        const results: Array<any> = [];
        let validationPassed = true;

        for (const [artifactName, mapEntry] of Object.entries(this.governanceMap)) {
            const artifactPath = path.join(ROOT_DIR, mapEntry.path);
            const schemaKey = mapEntry.schemaKey;

            try {
                if (mapEntry.required && !fs.existsSync(artifactPath)) {
                    throw new Error(`Required artifact is missing.`);
                }

                const artifactContent = this._loadContent(artifactPath);
                
                // Use StructuralSchemaValidator plugin to validate content
                // Assuming the validator returns { isValid: boolean, errors: array | null }
                const validationResult = this.validator.validate({ schemaKey, data: artifactContent });

                const isValid = validationResult.isValid;
                const errors = validationResult.errors;

                const result = {
                    artifact: artifactName,
                    schema: schemaKey,
                    path: artifactPath,
                    compliant: isValid,
                    errors: isValid ? null : errors
                };

                results.push(result);
                if (!isValid) {
                    validationPassed = false;
                    console.error(`[RRP Risk] Non-Compliance: ${artifactName} failed schema check.`);
                }

            } catch (e: any) {
                // Catches missing files (if required) or parsing errors (IH Risk)
                console.error(`[IH Risk] Critical Failure validating ${artifactName} (${schemaKey}): ${e.message}`);
                
                const isCriticalFailure = mapEntry.required || (e.message && e.message.includes('Required artifact is missing'));

                if (isCriticalFailure) {
                    validationPassed = false;
                }
                results.push({ artifact: artifactName, compliant: false, error: e.message, critical: isCriticalFailure });
            }
        }

        if (validationPassed) {
            console.log("MCV Success: All critical manifests comply with defined schemas. Ready for GSEP-C S0.");
        } else {
            console.error("MCV Failure: Governance transition aborted due to critical compliance errors.");
        }
        
        return { passed: validationPassed, results };
    }
}

module.exports = ManifestComplianceValidator;
