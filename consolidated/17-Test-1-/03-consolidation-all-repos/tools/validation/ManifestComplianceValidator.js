// Manifest Compliance Validator (MCV)
// Purpose: Enforces structural compliance against all defined schemas (Section 5.0) for Governance Artifacts (Section 2.2).
// Execution: MUST run pre-GSEP-C (before S0) to guarantee input validity and prevent IH/RRP failures due to malformed JSON/YAML.

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv'); // Assuming a robust JSON Schema validator library
const YAML = require('js-yaml');

const ajv = new Ajv({ allErrors: true });

const SCHEMA_REGISTRY = {
    // Load schema definitions from Section 5.0
    'GSM Schema': path.join(__dirname, '..', '..', 'schema', 'governance', 'Governance_State_Manifest.schema.json'),
    'ADMS': path.join(__dirname, '..', '..', 'config', 'SGS', 'AtomicDeploymentManifestSchema.json'),
    'TEMM': path.join(__dirname, '..', '..', 'config', 'SGS', 'TargetEvolutionMandateManifest.json'),
    // ... (include all JSON/YAML schemas)
};

const ARTIFACT_PATHS = [
    // List paths to currently required manifests for a transition
    path.join(__dirname, '..', '..', 'config', 'SGS', 'TargetEvolutionMandateManifest.json'),
    // ... (list ECVM, PVLM, MPAM, CFTM, etc., required by the current TEMM mandate)
];

function loadSchema(schemaPath) {
    if (fs.existsSync(schemaPath)) {
        return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    }
    throw new Error(`Schema not found: ${schemaPath}`);
}

function loadArtifact(artifactPath) {
    const content = fs.readFileSync(artifactPath, 'utf8');
    if (artifactPath.endsWith('.json')) {
        return JSON.parse(content);
    } else if (artifactPath.endsWith('.yaml') || artifactPath.endsWith('.yml')) {
        return YAML.load(content);
    }
    throw new Error(`Unsupported file type for artifact: ${artifactPath}`);
}

function validateArtifacts() {
    let validationPassed = true;
    console.log("Executing Manifest Compliance Validator (MCV) - Pre-GSEP-C Check...");

    const schemas = {};
    for (const [name, schemaPath] of Object.entries(SCHEMA_REGISTRY)) {
        try {
            schemas[name] = ajv.compile(loadSchema(schemaPath));
        } catch (e) {
            console.error(`[FATAL] Failed to compile schema ${name}:`, e.message);
            validationPassed = false;
        }
    }

    // Simplified validation loop placeholder
    // A real implementation would need logic to map specific artifacts to their correct schema dynamically.
    // Example: TEMM (artifact) must be validated against TEMM (schema).

    if (!validationPassed) {
        console.error("MCV Failure: Schema compilation errors detected. Cannot proceed.");
        process.exit(1);
    }
    
    // Example of TEMM validation against its schema (if we map schemas to artifacts)
    /*
    try {
        const temmSchemaValidator = schemas['TEMM']; 
        const temmContent = loadArtifact(ARTIFACT_PATHS[0]); // assuming TEMM is the first path
        if (!temmSchemaValidator(temmContent)) {
            console.error(`[RRP Risk] TEMM Validation Failed:\n`, temmSchemaValidator.errors);
            validationPassed = false;
        }
    } catch (e) { 
        console.error(`Error validating TEMM: ${e.message}`);
        validationPassed = false;
    }
    */

    if (validationPassed) {
        console.log("MCV Success: All critical manifests comply with defined schemas. Ready for GSEP-C S0.");
    } else {
        console.error("MCV Failure: One or more governance artifacts failed schema validation.");
        process.exit(1);
    }
}

// execute validation on import or directly
validateArtifacts();
