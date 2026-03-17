const fs = require('fs');
const path = require('path');
const { RuntimeArtifactFactory } = require('./compilation/RuntimeArtifactFactory');

/**
 * TEDSCompiler: Manages and compiles structural definition schemas (TEDS).
 * It loads definitions once and compiles individual schemas on demand, caching the results.
 * Compilation involves resolving templates ($ref) and transforming the definition into
 * optimized runtime artifacts (e.g., validation objects, query maps).
 */
class TEDSCompiler {
    constructor(definitionPath = 'schema/teds_field_definitions.json') {
        this.definitionPath = path.resolve(definitionPath);
        this._definitions = this._loadDefinitions();
        this._schemaCache = new new Map(); // Cache for compiled runtime schemas

        // Initialize the dedicated Factory/Engine for complex transformation logic
        this._factory = new RuntimeArtifactFactory(this._definitions.FieldTemplates);

        console.log(`[TEDSCompiler] Initialized. Loaded ${Object.keys(this._definitions.Definitions || {}).length} root definitions.`);
    }

    /**
     * Synchronously loads and parses the structural definition file.
     * @returns {Object} The raw TEDS definitions (e.g., { Definitions: {}, FieldTemplates: {} }).
     */
    _loadDefinitions() {
        try {
            const rawData = fs.readFileSync(this.definitionPath, 'utf8');
            const data = JSON.parse(rawData);

            if (!data.Definitions || !data.FieldTemplates) {
                 console.warn(`[TEDSCompiler] Loaded file seems incomplete. Expected 'Definitions' and 'FieldTemplates' keys.`);
            }
            return data;
        } catch (e) {
            console.error(`[TEDSCompiler Error] FATAL: Could not load or parse definitions at ${this.definitionPath}:`, e.message);
            // Return safe empty structure to prevent runtime errors later
            return { Definitions: {}, FieldTemplates: {} };
        }
    }

    /**
     * Retrieves or compiles the optimized runtime artifact for a given field key.
     * This method ensures template resolution and validation object generation only happen once per key.
     * @param {string} fieldKey The key of the root definition to compile.
     * @param {string} targetType The desired output artifact format (e.g., 'JOI', 'ZOD').
     * @returns {Object|null} The compiled runtime schema or null if the key is not found.
     */
    compileSchema(fieldKey, targetType = 'JOI') {
        const cacheKey = `${fieldKey}:${targetType}`;
        if (this._schemaCache.has(cacheKey)) {
            return this._schemaCache.get(cacheKey);
        }

        const definition = this._definitions.Definitions[fieldKey];
        if (!definition) {
            console.warn(`[TEDSCompiler] Field definition key '${fieldKey}' not found.`);
            return null;
        }

        try {
            // Delegate heavy transformation and reference resolution to the dedicated factory.
            const compiledArtifact = this._internalCompile(fieldKey, definition, targetType);
            this._schemaCache.set(cacheKey, compiledArtifact);
            return compiledArtifact;
        } catch (error) {
            console.error(`[TEDSCompiler Error] Failed to compile schema for '${fieldKey}' targeting '${targetType}':`, error.message);
            return null; 
        }
    }

    /**
     * Executes the actual compilation using the RuntimeArtifactFactory.
     * @private
     */
    _internalCompile(key, definition, targetType) {
        return this._factory.build(key, definition, targetType);
    }

    /**
     * Gets the raw, uncompiled definitions.
     * @returns {Object}
     */
    getDefinitions() {
        return this._definitions;
    }
}

module.exports = { TEDSCompiler };