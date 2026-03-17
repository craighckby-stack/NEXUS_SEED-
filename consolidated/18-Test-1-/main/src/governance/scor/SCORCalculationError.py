from governance.ConstraintKeys import ConstraintKey

class SCORCalculationError(Exception):
    """
    Specific exception raised when a calculation within the Systemic Constraint 
    Optimization Registrar (SCOR) fails due to payload analysis error, missing external 
    dependency result, or unforeseen numerical instability.
    
    This allows SCOR's error handling to specifically audit calculation integrity failures.
    """
    def __init__(self, key: ConstraintKey, detail: str):
        self.key = key
        self.detail = detail
        super().__init__(f"SCOR calculation failed for constraint {key.value}: {detail}")