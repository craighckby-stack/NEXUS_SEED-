import Ajv, { JSONSchemaType, ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import mecSchemaDefinition from '../../schemas/MECSchemaDefinition.json';
import { EvolutionMission } from '../types/MissionTypes';

/**
 * Custom Error Class for standardized Mission Validation Failures.
 * Includes detailed AJV error objects for internal debugging.
 */
export class MissionValidationError extends Error {
  public validationErrors: ErrorObject[];
  
  constructor(message: string, errors: ErrorObject[]) {
    super(message);
    this.name = 'MissionValidationError';
    this.validationErrors = errors;
  }
}

/**
 * Helper function to transform raw AJV errors into a human-readable, diagnostic string.
 */
const formatAjvErrors = (errors: ErrorObject[]): string => {
  return errors.map(err => 
    `[${err.keyword}] Error at path '${err.instancePath || '/'}': ${err.message}${err.params ? ` (Params: ${JSON.stringify(err.params)})` : ''}`
  ).join('\n');
};

// Initialize Ajv instance with necessary formats and strict mode for AGI protocols.
const ajv = new Ajv({
  coerceTypes: true,
  strict: true, // High intelligence requires strict schema enforcement
  allErrors: true // Collect all validation errors
});
addFormats(ajv);

/**
 * Service responsible for rigorous structural and semantic validation of MEC configurations.
 * Ensures missions conform exactly to Sovereign AGI v94.1 protocols before execution.
 */
export class MissionValidationService {
  private readonly validator: ValidateFunction<EvolutionMission>;
  private readonly schemaTitle: string;

  constructor() {
    if (!mecSchemaDefinition || typeof mecSchemaDefinition !== 'object') {
        throw new Error("MEC Schema definition could not be loaded or is invalid.");
    }

    this.schemaTitle = (mecSchemaDefinition as any).title || 'MEC Schema Definition';

    // Compile the definition immediately for performance and fail fast if schema is malformed
    try {
        this.validator = ajv.compile(mecSchemaDefinition as JSONSchemaType<EvolutionMission>);
    } catch (e) {
        console.error("AJV Schema Compilation Failed:", e);
        throw new Error(`FATAL: Failed to compile schema ${this.schemaTitle}. Check definition file integrity.`);
    }
  }

  /**
   * Validates a mission configuration object against the central MEC Schema.
   * @param missionConfig The mission configuration payload (unknown input type).
   * @returns EvolutionMission The validated and strictly typed mission configuration.
   * @throws {MissionValidationError} If validation fails.
   */
  public validate(missionConfig: unknown): EvolutionMission {
    if (typeof missionConfig !== 'object' || missionConfig === null) {
      throw new MissionValidationError('Mission configuration must be a non-null object.', []);
    }

    // Ajv validates runtime type compatibility against the TS type (EvolutionMission)
    const isValid = this.validator(missionConfig);

    if (!isValid) {
      const errors = this.validator.errors || [];
      const potentialMission = missionConfig as Partial<EvolutionMission>;
      
      const errorMessages = formatAjvErrors(errors);
      
      throw new MissionValidationError(
        `${this.schemaTitle} Validation Failed (ID: ${potentialMission.missionId || 'N/A'}):
${errorMessages}`,
        errors
      );
    }
    
    // Validation success implies missionConfig now matches EvolutionMission type
    // Success logging removed for cleaner service responsibility.
    return missionConfig as EvolutionMission;
  }
}