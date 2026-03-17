// Define foundational interfaces used across the core system for Mission Evolution Configuration (MEC).

/**
 * Represents a single declarative step within an evolution mission.
 * The actual structure must conform to MECSchemaDefinition.json.
 */
export interface EvolutionStep {
    type: string; // e.g., 'analyze', 'propose', 'implement', 'verify'
    targetPath: string;
    objective: string;
    details?: Record<string, any>;
}

/**
 * The top-level structure for an AGI Evolution Mission Configuration (MEC).
 */
export interface EvolutionMission {
    missionId: string;
    version: string; 
    timestamp: string; // ISO date string for creation/submission
    description: string;
    evolutionSteps: EvolutionStep[];
    configHash?: string; // Optional checksum for integrity
}