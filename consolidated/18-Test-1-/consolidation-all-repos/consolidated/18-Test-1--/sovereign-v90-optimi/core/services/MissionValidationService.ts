import { ErrorObject } from 'ajv';
import mecSchemaDefinition from '../../schemas/MECSchemaDefinition.json';
import { EvolutionMission } from '../types/MissionTypes';
import { ajvValidator } from '../plugins/SchemaValidatorPlugin';

// CRITICAL: We rely on the AjvErrorFormatterTool plugin to handle the formatting of validation errors.
declare const AjvErrorFormatterTool: {
    format: (errors: ErrorObject[]) => string;
};

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
 * Service responsible for rigorous structural and semantic validation of MEC configurations.
 * Ensures missions conform exactly to Sovereign AGI v94.1 protocols before execution.
 */
export class MissionValidationService {
  private readonly validateMission: (data: unknown, identifier?: string) => EvolutionMission;
  private readonly schemaTitle: string;

  constructor() {
    // Synchronous setup: Load schema definition and compile validator function.
    this.#initializeConfiguration();
  }

  /**
   * Extracts synchronous schema definition verification and compilation logic.
   * Satisfies Synchronous Setup Extraction goal.
   */
  #initializeConfiguration(): void {
    const { schema, title } = this.#getValidatedMECSchemaDefinition();
    this.schemaTitle = title;
    
    // Delegate compilation to isolate external tool interaction
    this.validateMission = this.#delegateToSchemaCompilation(schema, title);
  }

  /** 
   * Isolates synchronous data preparation and dependency validity check for the schema.
   */
  #getValidatedMECSchemaDefinition(): { schema: object, title: string } {
    if (!mecSchemaDefinition || typeof mecSchemaDefinition !== 'object') {
        throw new Error("MEC Schema definition could not be loaded or is invalid.");
    }
    const title = (mecSchemaDefinition as any).title || 'MEC Schema Definition';
    return { schema: mecSchemaDefinition as object, title };
  }

  /**
   * Proxies interaction with the external AJV compiler dependency.
   * Satisfies I/O Proxy Creation goal (Setup I/O).
   */
  #delegateToSchemaCompilation(
    schema: object,
    title: string
  ): (data: unknown, identifier?: string) => EvolutionMission {
    try {
        // Compile the definition using the centralized plugin instance
        return ajvValidator.compile<EvolutionMission>(schema, title);
    } catch (e) {
        // Catch fatal compilation failures originating from the plugin
        console.error("AJV Schema Compilation Failed during Service initialization:", e);
        throw e; 
    }
  }

  /**
   * Validates a mission configuration object against the central MEC Schema.
   * @param missionConfig The mission configuration payload (unknown input type).
   * @returns EvolutionMission The validated and strictly typed mission configuration.
   * @throws {MissionValidationError} If validation fails.
   */
  public validate(missionConfig: unknown): EvolutionMission {
    const missionId = this.#extractMissionId(missionConfig);

    try {
        // Delegate validation execution to isolate external tool interaction
        return this.#delegateToValidationExecution(missionConfig, missionId);
    } catch (e) {
        // Pass missionId for enhanced logging/error message generation
        this.#handleValidationExecutionError(e, missionId);
    }
  }

  /** Synchronously extracts the Mission ID for logging/context. */
  #extractMissionId(missionConfig: unknown): string {
    if (typeof missionConfig === 'object' && missionConfig !== null && 'missionId' in missionConfig) {
        return (missionConfig as Partial<EvolutionMission>).missionId as string || 'N/A';
    }
    return 'N/A';
  }

  /**
   * Proxies the execution of the compiled validation function.
   * Satisfies I/O Proxy Creation goal (Runtime I/O).
   */
  #delegateToValidationExecution(missionConfig: unknown, missionId: string): EvolutionMission {
      // Delegation executes the function compiled from the external ajvValidator.
      return this.validateMission(missionConfig, missionId);
  }

  /** 
   * Handles and transforms errors originating from the validation delegation.
   * Optimization: Uses AjvErrorFormatterTool to generate a high-quality, actionable error message.
   */
  #handleValidationExecutionError(e: unknown, missionId: string): never {
      // The plugin throws a generic internal error (SchemaValidationError) with attached validationErrors.
      const validationError = e as any;
      
      // Check if the error structure contains the expected AJV errors array
      if (validationError && Array.isArray(validationError.validationErrors)) {
          const errors: ErrorObject[] = validationError.validationErrors;
          
          // CRITICAL OPTIMIZATION: Use the dedicated formatter tool to generate a high-quality, actionable message.
          const formattedDetails = AjvErrorFormatterTool.format(errors);
          
          const message = `Mission Validation Failed for ID '${missionId}'. Structural violations detected: ${formattedDetails}`;

          throw new MissionValidationError(
              message, 
              errors
          );
      }
      
      // Re-throw if it's an unexpected system error or lacks validation details
      throw e; 
  }
}