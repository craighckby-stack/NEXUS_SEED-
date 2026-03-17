class AxiomConstraintValidator:
    """Ensures structural integrity and syntax compliance of the ACVD before GAX initiates semantic vetting at P2.

    Failure at this stage immediately triggers an IH protocol with a specific ACVD_STRUCTURE_MISS flag.
    This prevents complex GAX logic from attempting to parse malformed constraints.
    """
    def __init__(self, acvd_schema_path, trusted_schema):
        self.schema_path = acvd_schema_path
        self.trusted_schema = trusted_schema

    def load_and_validate(self) -> bool:
        try:
            # 1. Load the proposed ACVD structure (potential source of malformation)
            acvd_data = self._load_json(self.schema_path)
            # 2. Validate ACVD against the defined governance schema/contract
            self._validate_schema(acvd_data)
            # 3. Check internal constraint coherence (e.g., TEMM thresholds are numeric)
            self._check_coherence(acvd_data)
            return True
        except Exception as e:
            # Log detailed error to FSL and return failure flag
            IH_Sentinel.trigger_halt(f"ACVD_STRUCTURE_MISS: {e}")
            return False

    # Internal implementation methods for loading/schema validation omitted for brevity...