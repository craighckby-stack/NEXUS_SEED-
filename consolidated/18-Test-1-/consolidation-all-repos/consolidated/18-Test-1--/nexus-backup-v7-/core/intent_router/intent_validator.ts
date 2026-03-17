import Ajv from 'ajv';
import intentSchema from '../../governance/m01_intent_schema_v1.json';
import { IntentPayload } from '../types/intent_types';

const ajv = new Ajv({ allErrors: true });
const validateIntent = ajv.compile(intentSchema);

/**
 * Validates an incoming payload against the standard Intent Schema V1.
 * If valid, routes the intent to the appropriate Execution Handler queue.
 * @param intent The intent object to process.
 */
export function validateAndRouteIntent(intent: IntentPayload): void {
    if (!validateIntent(intent)) {
        const errors = validateIntent.errors;
        console.error('Intent Validation Failed:', errors);
        throw new Error(`Invalid Intent Structure: ${JSON.stringify(errors)}`);
    }

    console.log(`Intent ID ${intent.intent_id} of Type ${intent.type} is valid.`);
    
    // High-efficiency routing based on Type and Priority
    switch (intent.type) {
        case 'CODE_EVOLUTION':
            // IntentQueue.enqueueCodeEvolution(intent);
            break;
        case 'RESOURCE_ALLOCATION':
            // Scheduler.prioritizeResource(intent);
            break;
        default:
            // DefaultKernelQueue.enqueue(intent);
    }
    // Further routing logic here...
}