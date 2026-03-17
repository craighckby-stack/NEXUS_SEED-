export type ChronoPayload = Record<string, unknown>;
export type ChronoMetadata = Record<string, unknown>;

/**
 * Defines a single immutable Chronology Record (CHR).
 * It represents a single event, state transition, or audit entry in the system's history.
 */
export interface CHR_Record {
  chr_id: string; // Time-sortable ID (e.g., ULID/KSUID) for efficient indexing.
  parent_chr_id: string | null; // Causal link to the preceding record.
  
  // Context & Auditing
  timestamp: string; // Required ISO 8601 string.
  actor_id: string | null; // ID of the system, process, or user that generated this record.

  // Classification & Indexing
  entity_type: string; // General category of the source entity/process (e.g., 'User', 'Order').
  category: string; // Sub-classification or event type for fast partitioning (e.g., 'CREATED', 'STATE_TRANSITION', 'AUDIT').

  // Data
  data_payload: ChronoPayload; // The core immutable data payload (state or delta).
  metadata: ChronoMetadata; // System/processing metadata (e.g., origin node, hash, transaction ID).
}

/**
 * Standardized query criteria for chronological indexing.
 */
export interface ChronoQueryCriteria {
  startTime?: string; // Inclusive, ISO 8601
  endTime?: string;   // Inclusive, ISO 8601
  entityType?: string;
  category?: string; // Matches the 'category' field in CHR_Record.
  limit?: number;
  offset?: number;
  sortDirection?: 'asc' | 'desc';
  // Future refinement: field filters (e.g., where payload.status = 'active')
}

/**
 * Manages the efficient storage, retrieval, and querying of Chronology Records (CHR).
 * This interface abstracts the underlying persistent storage layer (e.g., time-series database).
 */
export interface ChronoIndexManager {
  /**
   * Persists a new CHR record.
   * @param record The CHR object.
   */
  write(record: CHR_Record): Promise<void>;

  /**
   * Retrieves a record by its unique ID.
   */
  getById(chr_id: string): Promise<CHR_Record | null>;

  /**
   * Retrieves all immediate descendants (children) of a specific record, following the causal chain.
   */
  getChildren(parent_chr_id: string): Promise<CHR_Record[]>;

  /**
   * Queries the historical chain based on complex criteria.
   */
  query(criteria: ChronoQueryCriteria): Promise<CHR_Record[]>;

  /**
   * Retrieves the most recent record associated with a given entity type or specific entity instance.
   * Useful for tracking the current state based on chronology.
   * @param entityType The general type (e.g., 'User').
   * @param entityId Optional specific entity instance ID if required for specific latest state tracking.
   */
  getLatestRecordByType(entityType: string, entityId?: string): Promise<CHR_Record | null>;
}