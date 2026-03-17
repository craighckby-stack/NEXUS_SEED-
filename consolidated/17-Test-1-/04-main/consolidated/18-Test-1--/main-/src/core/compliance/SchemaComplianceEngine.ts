import Ajv from 'ajv';
import { promises as fs } from 'fs';
import * as path from 'path';

const SCHEMA_PATH = path.join(__dirname, '../../../config/SPDM_Schema.json');

export class SchemaComplianceEngine {
    private ajv: Ajv;
    private schema: any;

    constructor() {
        // Fix: Corrected synchronous Ajv initialization which previously referenced 'this.schema' before it was loaded.
        this.ajv = new Ajv();
    }

    public async loadSchema(): Promise<void> {
        const schemaContent = await fs.readFile(SCHEMA_PATH, 'utf-8');
        this.schema = JSON.parse(schemaContent);
        this.ajv.addSchema(this.schema, this.schema.$id);
        console.log(`[Compliance] Loaded schema: ${this.schema.title}`);
    }

    public validateConfig(configPath: string, configData: any): boolean {
        if (!this.schema) {
            throw new Error('Schema not loaded. Call loadSchema() first.');
        }
        const validate = this.ajv.getSchema(this.schema.$id);
        if (!validate) {
             throw new Error('Schema ID retrieval failed.');
        }
        const isValid = validate(configData);

        if (!isValid) {
            console.error(`[Compliance Failure] Config failed validation: ${configPath}`);
            console.error(validate.errors);
        }
        return isValid;
    }
}