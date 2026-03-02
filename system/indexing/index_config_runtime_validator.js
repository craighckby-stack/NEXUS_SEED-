import { validateSchema } from 'json-schema-validator';
import artifactIndexSchema from './config/artifact_index_config.json';

// --- Static Rule Definitions (Maximum Abstraction & Composability) ---
const ValidationRules = {
    
    // R1: Foundational Schema Check (Must execute first)
    validateSchemaRule: (config) => {
        const result = validateSchema(artifactIndexSchema, config);
        return result.valid ? [] : result.errors;
    },

    // R2: DynamoDB Specific Consistency Check (Context dependent)
    validateDynamoDBConsistency: (config, context) => {
        const errors = [];
        const partitionKey = context.primaryPartitionKey;

        // Efficient check for LSI constraints using pre-calculated context
        config.secondary_indexes?.forEach(index => {
            if (index.scope === 'LOCAL') {
                const indexPartitionKey = index.index_fields?.[0];
                if (indexPartitionKey !== partitionKey) {
                    errors.push(`LSI '${index.index_name}' must use the primary partition key ('${partitionKey}') as its primary key component.`);
                }
            }
        });
        return errors;
    },

    // R3: Vector Index Constraints (Deep Check)
    validateVectorConstraints: (config) => {
        const errors = [];
        if (config.vector_indexes?.length > 0) {
            config.vector_indexes.forEach(vIndex => {
                // Ensure dimension exists and is positive
                if (!vIndex.dimension || typeof vIndex.dimension !== 'number' || vIndex.dimension <= 0) {
                    errors.push(`Vector index '${vIndex.index_name}' requires a positive 'dimension' parameter.`);
                }
                // Additional complex algorithm parameter checks would go here
            });
        }
        return errors;
    },

    // R4: Data Lifecycle Consistency (Checks efficiency of lifecycle field usage)
    validateLifecycleMapping: (config, context) => {
        if (config.data_lifecycle?.partition_field) {
            const field = config.data_lifecycle.partition_field;
            // O(1) lookup using the pre-built Set in context
            if (!context.allIndexedFields.has(field)) {
                return [`Data lifecycle partition field '${field}' must be included in primary keys or secondary indexes for efficient deletion/archiving.`];
            }
        }
        return [];
    }
};

class IndexConfigRuntimeValidator {
    
    constructor(config) {
        this.config = config;
    }
    
    /**
     * Creates a comprehensive context object to centralize configuration lookups.
     * Computational efficiency is maximized by calculating indexed fields only once.
     */
    _buildContext() {
        const primaryPartitionKey = this.config.key_schema.find(k => k.key_role === 'PARTITION')?.field_name;
        const engineType = this.config.engine_configuration.engine_type;
        
        const allIndexedFields = new Set();
        
        this.config.key_schema.forEach(k => allIndexedFields.add(k.field_name));
        this.config.secondary_indexes?.forEach(index => {
            index.index_fields.forEach(f => allIndexedFields.add(f));
        });
        this.config.vector_indexes?.forEach(index => {
            allIndexedFields.add(index.field_name);
        });

        return {
            primaryPartitionKey,
            engineType,
            allIndexedFields,
        };
    }

    /**
     * Executes the validation pipeline using functional composition (flatMap),
     * demonstrating recursive abstraction by dynamically branching rules based on engine type.
     */
    validateConsistency() {
        // Step 1: Execute required Schema Validation (Efficiency: Early Exit)
        let errors = ValidationRules.validateSchemaRule(this.config);
        if (errors.length > 0) {
            return { valid: false, errors }; 
        }
        
        // Step 2: Build Context (Efficiency: O(N) pre-calculation for O(1) lookups)
        const context = this._buildContext();

        // Step 3: Define the dynamic validation pipeline (Abstraction & Composition)
        const validationPipeline = [
            // Dynamic branching based on configuration property (Recursive Abstraction)
            (cfg, ctx) => {
                if (ctx.engineType === 'DYNAMODB_GLOBAL') {
                    return ValidationRules.validateDynamoDBConsistency(cfg, ctx);
                }
                return [];
            },
            // Cross-engine structural rules
            ValidationRules.validateVectorConstraints,
            (cfg, ctx) => ValidationRules.validateLifecycleMapping(cfg, ctx),
        ];
        
        // Step 4: Run the pipeline using flatMap for composition and error aggregation
        const newErrors = validationPipeline.flatMap(rule => rule(this.config, context));

        errors.push(...newErrors);
        
        return { valid: errors.length === 0, errors };
    }

    mergeEngineSpecificParams() {
        // Logic remains simple, focusing only on the validator's primary role.
        return this.config; 
    }
}

export default IndexConfigRuntimeValidator;