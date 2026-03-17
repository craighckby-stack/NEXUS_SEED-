SUPPORTED_OPERATIONS = [
    'Multiplication', 
    'Addition', 
    'Subtraction', 
    'Division', 
    'VectorAddition', 
    'MagnitudeNormalization',
    'MatrixDotProduct' # Added for future computational expansion
]

# NOTE: This dictionary can be expanded later to hold metadata like required
# input types, minimum arity, and resulting data type for more rigorous type validation.
OPERATION_METADATA = {
    'Multiplication': {'type': 'scalar', 'min_inputs': 2},
    'VectorAddition': {'type': 'vector', 'min_inputs': 2}
}