import { Logger } from './Logger';
import TEDS_SCHEMA from '../schema/teds_field_definitions.json';
import { ZodSchema, z, ZodError, ZodType } from 'zod';
import { executeValidation, ValidationResult } from './plugins/ValidationExecutionUtility';

/**
 * TEDSFieldValidator: Runtime engine consuming teds_field_definitions.json
 * to generate validation and normalization pipelines (using Zod internally).
 */
export class TEDSFieldValidator {
  readonly #compiledSchema: ZodSchema<Record<string, unknown>>;

  constructor() {
    this.#compiledSchema = this.#initializeEngine();
  }

  // --- Initialization and Setup ---

  /**
   * Compiles the TEDS schema into a Zod schema.
   * @returns The compiled Zod schema for TEDS validation.
   */
  #initializeEngine(): ZodSchema<Record<string, unknown>> {
    try {
      const compiledSchema = this.#compileTedsSchema(TEDS_SCHEMA.domains);
      this.#logInfo('TEDS Schema compiled successfully.');
      return compiledSchema;
    } catch (error) {
      this.#logError('Failed to compile TEDS Schema', error);
      throw new Error('TEDSFieldValidator initialization failed');
    }
  }

  // --- Private Proxies (I/O & Internal Logic) ---

  /**
   * Proxy for Logger.info, strictly isolating logging operations.
   */
  #logInfo(message: string): void {
    Logger.info(`[TEDSFieldValidator] ${message}`);
  }

  /**
   * Proxy for Logger.error, strictly isolating logging operations.
   */
  #logError(message: string, error?: unknown): void {
    Logger.error(`[TEDSFieldValidator] ${message}`, error);
  }

  /**
   * Compiles TEDS domains into a Zod schema.
   * @param domains - The domains from the TEDS schema.
   * @returns A Zod schema representing the TEDS structure.
   */
  #compileTedsSchema(domains: Record<string, unknown>): ZodSchema<Record<string, unknown>> {
    // For demonstration, return a basic, conceptual compilation wrapper:
    // In a real implementation, this would map domains to Zod types
    return z.record(z.string(), z.unknown()).passthrough();
  }

  /**
   * Validates and attempts to normalize raw input data against the TEDS standard.
   * @param rawData - The raw data to validate.
   * @returns A ValidationResult object containing the validation outcome.
   */
  public processAndValidate(rawData: unknown): ValidationResult<unknown> {
    const zodValidatorFunction = (data: unknown): unknown => {
      try {
        return this.#compiledSchema.parse(data);
      } catch (error) {
        // The validator must throw the exception (ZodError) for the utility to catch and parse.
        if (error instanceof ZodError) {
          throw error;
        }
        throw new ZodError([
          {
            code: 'custom',
            message: 'An unexpected error occurred during validation',
            path: [],
          },
        ]);
      }
    };

    return executeValidation(zodValidatorFunction, rawData, Logger);
  }
}
