class GICMValidatorCompiler:
    """
    Reads the machine-readable GICM Schema (V2.0.0+) and generates
    executable validation artifacts (e.g., Pydantic models, database triggers,
    or monitoring service configuration).
    
    This utility is crucial for translating declarative constraints into runtime
    enforcement logic, eliminating manual configuration boilerplate.
    """

    def __init__(self, schema_path: str):
        import json
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)
        
        if self.schema.get('version') < '2.0.0':
             raise ValueError("Requires GICM Schema V2.0.0 or higher for structured constraints.")

    def compile_entity_validation_rules(self, entity_name: str) -> dict:
        """Translates structured constraints into executable rules for a given entity."""
        
        entity = self.schema['entities'].get(entity_name)
        compiled_rules = {
            "integrity_check": entity['integrity_model'],
            "field_validators": []
        }

        for field_name, field_def in entity['fields'].items():
            rule = {"field": field_name, "type": field_def['type']}
            
            # Process machine-readable constraints
            if 'constraints' in field_def:
                if 'conditional_required' in field_def['constraints']:
                    c = field_def['constraints']['conditional_required']
                    rule['validation_trigger'] = f"REQUIRE({field_name}) IF ({c['if_field']} == '{c['equals']}')"
            
            # Process monitoring definitions
            if 'governance' in field_def:
                rule['monitoring_config'] = field_def['governance']

            compiled_rules['field_validators'].append(rule)
            
        return compiled_rules