// Manifest Compliance Validator (MCV) - v94.1 Intelligence Layer
// Purpose: Enforces structural compliance against defined Governance Artifact Schemas (Section 5.0).
// Execution: MUST run pre-GSEP-C (before S0).

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const YAML = require('js-yaml');

// Constants derived from assumed root structure
const ROOT_DIR = path.join(__dirname, '..', '..');
const SCHEMA_DIR = path.join(ROOT_DIR, 'schema', 'governance');
const GOVERNANCE_MAP_PATH = path.join(ROOT_DIR, 'config', 'GovernanceManifestMap.json'); // Proposed mapping utility

const ajv = new Ajv({ allErrors: true, useDefaults: true });

/**
 * Manages schema loading, compilation, and artifact validation using the central Governance Map.
 */
class ManifestComplianceValidator {
    constructor() {
        this.schemaValidators = {};
        this.governanceMap = this._loadGovernanceMap();
        this._loadAndCompileSchemas();
    }

    /**
     * Loads the external mapping file defining artifact-to-schema linkage.
     */
    _loadGovernanceMap() {
        if (fs.existsSync(GOVERNANCE_MAP_PATH)) {
            console.log(`MCV: Loading Governance Map from ${GOVERNANCE_MAP_PATH}`);
            return JSON.parse(fs.readFileSync(GOVERNANCE_MAP_PATH, 'utf8'));
        }
        console.warn(`[MCV Initialization Warning] GovernanceManifestMap not found. Using internal fallback registry.`);
        
        // Fallback internal registry definition for immediate functionality (paths must be relative to ROOT_DIR)
        return {
            'TargetEvolutionMandateManifest.json': { schemaKey: 'TEMM', path: 'config/SGS/TargetEvolutionMandateManifest.json', required: true },
        };
    }

    /**
     * Loads and parses content (JSON or YAML) from a given file path.
     */
    _loadContent(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Artifact/Schema not found: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        if (filePath.endsWith('.json')) {
            return JSON.parse(content);
        } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
            return YAML.load(content);
        }
        throw new Error(`Unsupported file type for artifact: ${filePath}`);
    }

    /**
     * Identifies required schemas from the governance map and compiles them using AJV.
     */
    _loadAndCompileSchemas() {
        let compilationSuccess = true;
        
        const requiredSchemas = new Set(Object.values(this.governanceMap).map(m => m.schemaKey));

        for (const schemaKey of requiredSchemas) {
            try {
                const schemaFileName = schemaKey + '.schema.json'; // Assumed naming convention
                const schemaPath = path.join(SCHEMA_DIR, schemaFileName);
                
                const schema = this._loadContent(schemaPath);
                this.schemaValidators[schemaKey] = ajv.compile(schema);
            } catch (e) {
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
        const results = [];
        let validationPassed = true;

        for (const [artifactName, mapEntry] of Object.entries(this.governanceMap)) {
            const artifactPath = path.join(ROOT_DIR, mapEntry.path);
            const schemaKey = mapEntry.schemaKey;

            try {
                if (mapEntry.required && !fs.existsSync(artifactPath)) {
                    throw new Error(`Required artifact is missing.`);
                }

                const artifactContent = this._loadContent(artifactPath);
                const validator = this.schemaValidators[schemaKey];

                const isValid = validator(artifactContent);

                const result = {
                    artifact: artifactName,
                    schema: schemaKey,
                    path: artifactPath,
                    compliant: isValid,
                    errors: isValid ? null : validator.errors
                };

                results.push(result);
                if (!isValid) {
                    validationPassed = false;
                    console.error(`[RRP Risk] Non-Compliance: ${artifactName} failed schema check.`);
                }

            } catch (e) {
                // Catches missing files (if required) or parsing errors (IH Risk)
                console.error(`[IH Risk] Critical Failure validating ${artifactName} (${schemaKey}): ${e.message}`);
                if (mapEntry.required || e.message.includes('Required artifact is missing')) {
                    validationPassed = false;
                }
                results.push({ artifact: artifactName, compliant: false, error: e.message, critical: mapEntry.required || false });
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
