export type ChronoPayload = Record<string, unknown>;
export type ChronoMetadata = Record<string, unknown>;

/**
 * Defines a single immutable Chronology Record (CHR).
 * It represents a single event or state transition in the system's history.
 */
export interface CHR_Record {
  chr_id: string; // Highly recommended: Time-sortable ID (ULID/KSUID) for efficient indexing.
  parent_chr_id: string | null; // Causal link.
  timestamp: string; // Required to be ISO 8601 string.
  entity_type: string; // General category of the source entity/process.
  data_payload: ChronoPayload;
  metadata: ChronoMetadata; // System/processing metadata (e.g., origin node, hash).
}

/**
 * Standardized query criteria for chronological indexing.
 */
export interface ChronoQueryCriteria {
  startTime?: string; // Inclusive, ISO 8601
  endTime?: string;   // Inclusive, ISO 8601
  entityType?: string;
  category?: string; // Sub-classification for indexing or partitioning.
  limit?: number;
  offset?: number;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Manages the efficient storage, retrieval, and querying of Chronology Records (CHR).
 * It handles abstraction over the underlying persistent storage layer (e.g., time-series database).
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
   * Queries the historical chain based on criteria.
   * Renamed from queryHistory to query for succinctness and standardization.
   */
  query(criteria: ChronoQueryCriteria): Promise<CHR_Record[]>;

  /**
   * Retrieves the most recent record associated with a given entity type.
   * Crucial for systems tracking state changes (e.g., finding the current state of an Entity).
   */
  getLatestRecordByType(entityType: string): Promise<CHR_Record | null>;
}