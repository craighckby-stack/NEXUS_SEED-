# enhancer.py - Evolution with Selection Pressure

import anthropic
import json
import ast
import io
import contextlib
import sys

# NOTE: In a true AGI environment, this client instantiation would be managed by a secrets vault.
client = anthropic.Anthropic()

# --- Evolution Utilities ---

@contextlib.contextmanager
def redirect_stdout(new_target):
    old_target = sys.stdout
    sys.stdout = new_target
    try:
        yield new_target
    finally:
        sys.stdout = old_target


def _safe_execute_function(code_str, func_name, *args):
    """Attempts to execute the function defined in code_str safely."""
    local_scope = {}
    try:
        # Compile and execute the module globally
        tree = ast.parse(code_str)
        compile(tree, filename="<evolution_module>", mode="exec")
        exec(code_str, local_scope)

        if func_name not in local_scope:
            return False, f"Error: Function '{func_name}' not defined."

        # Execute the function and capture output
        f = local_scope[func_name]
        
        output_capture = io.StringIO()
        with redirect_stdout(output_capture):
            result = f(*args)
        
        return True, result, output_capture.getvalue()
    except Exception as e:
        return False, f"Runtime Error: {e}"


def calculate_fitness(code_str, examples):
    """Scores the code based on how well it handles examples (higher is better)."""
    score = 0
    required_function = "handle_greeting"
    
    for example in examples:
        input_greeting = example["input"]
        expected_response_keyword = example["expected_keyword"].lower()
        
        success, *results = _safe_execute_function(code_str, required_function, input_greeting)
        
        if success:
            result_value, result_stdout = results[0], results[1]
            
            # Simple scoring: Check if the expected keyword is in the output (stdout or returned value string)
            output_text = str(result_value).lower() + " " + result_stdout.lower()
            
            if expected_response_keyword in output_text:
                score += 1
    
    # Fitness is the number of correctly handled examples
    return score

# --- Main Evolution ---

# 1. Load human examples
# Format expected: [{'input': 'Hello!', 'expected_keyword': 'nice'}]
try:
    with open('greetings.json', 'r') as f:
        examples = json.load(f)
except FileNotFoundError:
    examples = [
        {"input": "Hello, world!", "expected_keyword": "response"},
        {"input": "Good morning", "expected_keyword": "day"}
    ]
    print("Warning: greetings.json not found, using defaults.")

max_fitness = len(examples)

# 2. Start with baseline functional code (must define handle_greeting)
code = """def handle_greeting(message):
    """This is the initial handler."""
    if 'hello' in message.lower() or 'hi' in message.lower():
        return "A friendly response is required."
    return "Unknown greeting."
"""
current_fitness = calculate_fitness(code, examples)
print(f"Initial Fitness: {current_fitness}/{max_fitness}")

# 3. Evolution loop with Selection Pressure
for i in range(15): # Increased iterations to account for necessary exploration
    
    evolution_prompt = f"""You are evolving a Python function called `handle_greeting(message)` that takes a string message and returns or prints a suitable response. 

Goal: Achieve maximum fitness against the testing suite (defined by the examples).

Human Examples for Testing: {json.dumps(examples, indent=2)}

--- CURRENT STATE ---
Current Code (Fitness {current_fitness}/{max_fitness}):
```python
{code}
```

Critique the current code's performance based on the goal and the examples. Then, provide the NEXT, IMPROVED version of the COMPLETE Python code defining the `handle_greeting` function. Return only the executable code block, ensuring it is syntactically valid Python.
"""
    
    try:
        # Mutate
        response = client.messages.create(
            model="claude-sonnet-4-20250514", # Using a more capable and recent model for complex code tasks
            max_tokens=2048, # Increased token limit for full function returns
            temperature=2.0, # High temperature for variation, moderated by selection
            messages=[{
                "role": "user", 
                "content": evolution_prompt
            }]
        )
        
        new_code = response.content[0].text.strip()
        
        # Test & Select (Survival of the Fittest)
        new_fitness = calculate_fitness(new_code, examples)

        print(f"\nIteration {i + 1} | Mutate attempt (Fit: {new_fitness}/{max_fitness}):")
        
        if new_fitness > current_fitness:
            # Selection applied: Accept the mutation
            current_fitness = new_fitness
            code = new_code
            print(f"SUCCESS: Improvement accepted. New Code is now standard (Fitness: {current_fitness}).")
        elif new_fitness == current_fitness:
            print("STASIS: Code accepted, but no fitness gain (neutral mutation).")
            code = new_code # Accept neutral mutation for exploration
        else:
            print(f"REJECTED: Fitness decreased or code failed execution (Fitness: {new_fitness}). Reverting to previous stable code.")
        
        if current_fitness == max_fitness:
            print("*** EVOLUTION COMPLETE: Optimal fitness achieved. ***")
            break

    except anthropic.APIError as e:
        print(f"API Error occurred: {e}")
        break
    except Exception as e:
        print(f"Unexpected error during iteration {i}: {e}")
        # Often occurs if Claude returns non-parsable or non-Python text
        
print("\n--- Final Evolved Code ---")
print(code)