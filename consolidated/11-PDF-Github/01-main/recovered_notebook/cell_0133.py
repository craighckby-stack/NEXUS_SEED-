import os
import json
import glob
import random
import time
from datetime import datetime
import importlib.util
import sys
import tempfile

# NOTE: Hallucinated import for advanced scoring utility.
# In a real system, this would be a library like sentence-transformers or ROUGE.
class TextScorer:
    def compare(self, response: str, expected: str) -> float:
        """Placeholder for robust NLP similarity scoring (e.g., BERT Score, ROUGE-L)."""
        
        # Simple heuristic to replace the original, based on common substring and length ratio
        response_clean = response.lower().strip()
        expected_clean = expected.lower().strip()

        if not response_clean or response_clean == "i don't know yet.":
            return 0.0
            
        # Simple token overlap check (Jaccard-like)
        resp_tokens = set(response_clean.split())
        exp_tokens = set(expected_clean.split())
        overlap = len(resp_tokens.intersection(exp_tokens))
        union = len(resp_tokens.union(exp_tokens))
        
        if union == 0: return 0.5
        
        # Prioritize quality over simple match (0.5 to 1.0)
        return 0.5 + (0.5 * (overlap / union))

from openai import OpenAI  # or Anthropic, or local LLM

# --- Configuration ---
CLIENT = OpenAI()
TEMPERATURE = 0.7  # Slightly more exploration
NUM_CANDIDATES = 10
NUM_ITERATIONS = 50
BEHAVIOR_DOMAINS = ["greetings", "questions", "emotions", "reasoning"]

CANDIDATES_DIR = "candidates"
BEHAVIORS_ROOT = "behaviors"
TEMP_MODULE_NAME = "temp_candidate_module"

# Initialize the advanced (though locally mocked) scorer
SCORER = TextScorer()

# A consistent structure expected from LLM generated candidates
CANDIDATE_TEMPLATE = """
# Candidate AI Response Handler

# IMPORTANT: Must define a function 'respond(input_text)'
def respond(input_text: str) -> str:
    # Your generated logic here
    if input_text.lower() == "hello":
        return "Hello! How can I assist you?"
    return "I don't know yet."

# Note: This template provides a basic default response.
"""

# --- State Management Helpers ---

def get_metadata_path(candidate_base_name):
    """Returns the path to the candidate's metadata file."""
    return os.path.join(CANDIDATES_DIR, f"{candidate_base_name}.json")

def load_candidate_metadata(candidate_base_name):
    """Loads score and history for a candidate."""
    metadata_path = get_metadata_path(candidate_base_name)
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    # Default structure if missing
    return {"best_score": 0.0, "last_mutation": "N/A", "total_mutations": 0}

def save_candidate_metadata(candidate_base_name, metadata):
    """Saves updated score and history for a candidate."""
    metadata_path = get_metadata_path(candidate_base_name)
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

# --- Setup Functions ---
def setup_environment():
    """Creates necessary directories and initializes candidates/behaviors."""
    if not os.path.exists(CANDIDATES_DIR):
        os.makedirs(CANDIDATES_DIR)

    for domain in BEHAVIOR_DOMAINS:
        domain_dir = os.path.join(BEHAVIORS_ROOT, domain)
        if not os.path.exists(domain_dir):
            os.makedirs(domain_dir)
        
        # Create/overwrite placeholder behavior examples
        examples_file = os.path.join(domain_dir, "examples.json")
        if not os.path.exists(examples_file):
            examples = []
            for i in range(5):
                input_text = f"[{domain}] test input {i}"
                output_text = f"[{domain}] expected output {i} and specific {domain} keyword."
                examples.append({"input": input_text, "output": output_text})
            with open(examples_file, "w") as f:
                json.dump({"examples": examples}, f, indent=2)

    # Create initial candidate files and metadata
    for i in range(NUM_CANDIDATES):
        base_name = f"candidate_{i:03d}"
        file_path = os.path.join(CANDIDATES_DIR, f"{base_name}.py")
        
        if not os.path.exists(file_path):
            with open(file_path, "w") as f:
                f.write(CANDIDATE_TEMPLATE)
            
        # Ensure metadata exists
        if not os.path.exists(get_metadata_path(base_name)):
            save_candidate_metadata(base_name, {"best_score": 0.0, "last_mutation": str(datetime.now()), "total_mutations": 0})


def load_behavior_examples(domain):
    """Loads structured examples for a given domain."""
    try:
        examples_file = os.path.join(BEHAVIORS_ROOT, domain, "examples.json")
        with open(examples_file, 'r') as f:
            data = json.load(f)
            return data.get('examples', [])
    except Exception as e:
        return []


def evaluate_candidate(new_code, domain_examples):
    """Safely executes and scores the candidate code against behavior examples using tempfile and NLP scoring."""
    if not domain_examples:
        return 0.5 # Neutral score if no tests
        
    total_score = 0.0
    tmp_filepath = None
    
    # 1. Write the code to a temporary file using tempfile
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as tmp:
            tmp_filepath = tmp.name
            tmp.write(new_code)
        
        # 2. Dynamically load the module (safely)
        if TEMP_MODULE_NAME in sys.modules:
             del sys.modules[TEMP_MODULE_NAME]
             
        spec = importlib.util.spec_from_file_location(TEMP_MODULE_NAME, tmp_filepath)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        if not hasattr(module, 'respond'):
            return 0.1 # Fail if required function is missing
            
        # 3. Test the function
        num_tests = len(domain_examples)
        for example in domain_examples:
            try:
                response = module.respond(example['input'])
                expected = example['output']
                
                # Use the sophisticated TextScorer utility
                example_score = SCORER.compare(response, expected)
                total_score += example_score
                
            except Exception:
                # Catch runtime errors within the candidate logic
                pass
                
        # Calculate average score
        score = total_score / num_tests
        return score
        
    except Exception as e:
        # Catch loading or module execution errors
        # print(f"Evaluation error: {e}")
        return 0.0
    finally:
        # Clean up temporary file
        if tmp_filepath and os.path.exists(tmp_filepath):
            os.remove(tmp_filepath)
        # Clean up module from system cache
        if TEMP_MODULE_NAME in sys.modules:
            del sys.modules[TEMP_MODULE_NAME]


def extract_code(llm_response_content):
    """Utility to safely extract Python code block from LLM response."""
    if '```python' in llm_response_content:
        # Basic extraction logic for common Markdown formatting
        parts = llm_response_content.split('```python')
        if len(parts) > 1:
            return parts[1].split('```')[0].strip()
    return llm_response_content.strip()

def mutate_candidate(candidate_base_name, current_code, current_best_score, selected_domain, domain_examples):
    """Generates a new candidate code version using the LLM API."""
    
    prompt = f"""
    You are an AI evolving code based on observed performance in the '{selected_domain}' domain.
    The goal is to maximize performance on the provided test examples. You MUST NOT remove the 'respond' function definition.
    
    Current Best Score: {current_best_score:.3f} (Max 1.0)
    Target Domain: {selected_domain}
    Domain Examples (Input -> Expected Output):
    {json.dumps([{'input': ex['input'], 'expected': ex['output']} for ex in domain_examples], indent=2)}
    
    Current candidate code for {candidate_base_name}:
    --- CODE START ---
    {current_code}
    --- CODE END ---
    
    Improve ONLY the implementation details of the 'respond' function to maximize the score in the '{selected_domain}' domain.
    Ensure the generated code is syntactically correct and fully contained. Provide robust error handling within the function if necessary.
    Return ONLY the improved Python source code, including the necessary imports and the complete function definition, wrapped in a python markdown block (```python...```).
    """
    
    try:
        response = CLIENT.chat.completions.create(
            model="gpt-4", 
            temperature=TEMPERATURE,
            messages=[{"role": "user", "content": prompt}]
        )
        new_code_full = response.choices[0].message.content
        return extract_code(new_code_full)

    except Exception as e:
        # print(f"[LLM INTERACTION FAILED]: {e}")
        time.sleep(1) 
        return None


# --- Evolution Loop Function ---
def run_evolution(num_iterations, candidates_dir):
    start_time = datetime.now()
    print(f"Evolution loop started for {num_iterations} iterations.")
    
    # Find all .py candidate files
    all_candidate_paths = glob.glob(os.path.join(candidates_dir, "candidate_*.py"))
    candidate_base_names = [os.path.basename(p)[:-3] for p in all_candidate_paths] # e.g., 'candidate_001'

    if not candidate_base_names:
        print("No candidates found. Check setup.")
        return
    
    for iteration in range(num_iterations):
        print(f"\n--- Iteration {iteration+1}/{num_iterations} ---")
        random.shuffle(candidate_base_names) 

        for candidate_base_name in candidate_base_names:
            candidate_path = os.path.join(candidates_dir, f"{candidate_base_name}.py")
            
            # 1. Select a domain and load examples
            selected_domain = random.choice(BEHAVIOR_DOMAINS)
            domain_examples = load_behavior_examples(selected_domain)
            
            # 1.5 Load current metadata
            metadata = load_candidate_metadata(candidate_base_name)
            current_best_score = metadata['best_score']
            
            # 2. Load current code
            with open(candidate_path, "r") as f:
                current_code = f.read()
            
            # 2.5 Mutate (Call LLM)
            new_code = mutate_candidate(candidate_base_name, current_code, current_best_score, selected_domain, domain_examples)

            if new_code:
                # 3. Test New Code
                score = evaluate_candidate(new_code, domain_examples)
                
                # 4. Compare and Save if Better (or equal, to encourage exploration)
                if score >= current_best_score:
                    # Update code file
                    with open(candidate_path, "w") as f:
                        f.write(new_code)
                        
                    # Update metadata
                    metadata['best_score'] = score
                    metadata['last_mutation'] = str(datetime.now())
                    metadata['total_mutations'] += 1
                    save_candidate_metadata(candidate_base_name, metadata)
                    
                    status = "SUCCESS (Improved)" if score > current_best_score else "SUCCESS (Stable/Equal)"
                    print(f"[{status}] {candidate_base_name} evolved for '{selected_domain}'. New Score: {score:.3f}")
                else:
                    print(f"[FAIL] {candidate_base_name} in '{selected_domain}'. New Score: {score:.3f}. (Kept Best Score: {current_best_score:.3f})")
            else:
                print(f"[SKIP] {candidate_base_name}. LLM mutation failed or returned empty code.")

    print(f"\nEvolution loop finished in {datetime.now() - start_time}.")

# --- Main Execution ---
setup_environment()
run_evolution(NUM_ITERATIONS, CANDIDATES_DIR)

# Final results logging 
with open("results.json", "w") as f:
    # Log summary of final scores
    final_scores = {}
    all_candidate_base_names = [os.path.basename(p)[:-3] for p in glob.glob(os.path.join(CANDIDATES_DIR, "candidate_*.py"))]
    for base_name in all_candidate_base_names:
        metadata = load_candidate_metadata(base_name)
        final_scores[base_name] = metadata['best_score']
        
    json.dump({"run_time": str(datetime.now()), "final_scores": final_scores}, f, indent=2)