import json
import uuid
from datetime import datetime
from jsonschema import validate, ValidationError
from config import TRACEABILITY_SCHEMA_PATH  # Assume configuration loads schema path

class TraceIngestionService:
    """Handles asynchronous ingestion, validation, and storage of Trace Logs."""

    def __init__(self, storage_client, schema_path=TRACEABILITY_SCHEMA_PATH):
        self.storage = storage_client  # Abstract storage layer (e.g., Redis, DB client)
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)

    def validate_trace(self, trace_data: dict) -> bool:
        try:
            validate(instance=trace_data, schema=self.schema)
            return True
        except ValidationError as e:
            print(f"Trace Validation Error: {e.message}")
            # Log the error, potentially pushing the failed trace to a separate queue
            return False

    def ingest_trace_async(self, trace_data: dict):
        """Queues the validated trace for persistence, non-blocking execution path."""
        if not self.validate_trace(trace_data):
            return
        
        # Standardize timestamp format if needed
        if 'timestamp_utc' not in trace_data:
             trace_data['timestamp_utc'] = datetime.utcnow().isoformat() + 'Z'

        # Implement actual queuing logic here (e.g., push to a message queue)
        print(f"[TraceIngestion] Successfully validated and queued Trace ID: {trace_data.get('trace_id', 'N/A')}")
        # self.storage.enqueue_trace(trace_data)

    def force_ingest(self, trace_data: dict):
        """Synchronous ingestion path for critical debugging."""
        if self.validate_trace(trace_data):
            self.storage.save_trace(trace_data['trace_id'], trace_data)

# Note: storage_client implementation is external to this scaffold.