const TEDS_STATUS_CODES = {
  description: "Standardized Status Codes for TEDS (Trusted Event Data Stream). Used in conjunction with TEDS_event_schema.json to define semantic meaning for status_code integers.",
  ranges: {
    "1xx": "Informational/Observation. Event generated but requires no immediate action.",
    "2xx": "Success/Completion. Task completed successfully.",
    "3xx": "Redirection/Delegation. Task handed off or moved to another service.",
    "4xx": "Client/Input Error. Issue originated from the input context or initiating system.",
    "5xx": "Server/Execution Error. Internal failure or exception during processing."
  },
  codes: {
    "101": "OBSERVATION_GENERATED",
    "200": "EXECUTION_SUCCESS",
    "201": "RESOURCE_CREATED",
    "202": "ASYNC_PROCESSING_INITIATED",
    "401": "INVALID_INPUT_CONTEXT",
    "403": "POLICY_VIOLATION_TRIGGERED",
    "404": "RESOURCE_NOT_FOUND",
    "500": "INTERNAL_EXECUTION_FAILURE",
    "503": "DEPENDENCY_UNAVAILABLE"
  }
};

module.exports = { TEDS_STATUS_CODES };