export interface PemEngineMapEntry {
  /** Unique internal identifier for the policy map entry. */
  id: string;
  /** Defines the operational boundary (e.g., 'security', 'data', 'control'). */
  scope: 'security' | 'integrity' | 'system' | 'telemetry';
  /** Human-readable policy name. */
  policy_name: string;
  /** Runtime path or reference to the execution handler. */
  engine_handler: string;
  /** Semantic version of the engine configuration. */
  version: string;
  /** Execution priority (lower number = higher priority). */
  priority: number;
  /** Runtime requirements or prerequisites for activation. */
  constraints: string[];
  /** Current operational status of the mapping. */
  status: 'ACTIVE' | 'PENDING' | 'DEPRECATED';
}

export type PemEngineMap = PemEngineMapEntry[];