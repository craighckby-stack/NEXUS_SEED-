// Define foundational interfaces used across the core system for Mission Evolution Configuration (MEC).

/**
 * Standard type for step-specific configuration and arbitrary payload details.
 */
export type StepDetails = Record<string, any>;

/**
 * Represents a single declarative step within an evolution mission.
 * The actual structure must conform to MECSchemaDefinition.json.
 */
export interface EvolutionStep {
    /** The type of operation, e.g., 'analyze', 'propose', 'implement', 'verify'. */
    type: string;
    /** The path or resource targeted by this step. */
    targetPath: string;
    /** A concise description of the step's goal. */
    objective: string;
    /** Optional detailed parameters specific to the step type. */
    details?: StepDetails;
}

/**
 * Defines the structural metadata for an AGI Evolution Mission Configuration (MEC).
 * This part provides identification and integrity checks, separate from execution content.
 */
export interface EvolutionMissionMetadata {
    /** Unique identifier for the mission. */
    missionId: string;
    /** Configuration schema version. */
    version: string; 
    /** ISO date string for creation/submission. */
    timestamp: string; 
    /** General description of the mission objective. */
    description: string;
    /** Optional checksum/hash for integrity verification. */
    configHash?: string;
}

/**
 * Defines the core executable content of an AGI Evolution Mission.
 */
export interface EvolutionMissionContent {
    /** Ordered list of steps defining the evolution process. */
    evolutionSteps: EvolutionStep[];
}

/**
 * The top-level structure for an AGI Evolution Mission Configuration (MEC),
 * composed of structural metadata and executable content.
 */
export type EvolutionMission = EvolutionMissionMetadata & EvolutionMissionContent;
