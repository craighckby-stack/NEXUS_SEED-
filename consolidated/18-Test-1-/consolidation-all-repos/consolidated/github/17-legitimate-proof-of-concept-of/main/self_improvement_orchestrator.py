import os
import time
import json
import pickle
import re
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

# Attempt Colab setup if needed
try:
    from google.colab import files
except ImportError:
    files = None # Handle non-Colab environments

# ============================================================================
# ⚙️ CONFIGURATION AND INITIALIZATION
# ============================================================================

LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)

# Ensure required libraries are installed silently
try:
    import google.generativeai as genai
except ImportError:
    print("Installing google-generativeai...")
    os.system('!pip install -q google-generativeai')
    import google.generativeai as genai

KNOWLEDGE_BASE_DIR = Path("/content/knowledge_base")
DEFAULT_MODEL = 'gemini-2.5-flash' # Using a powerful and fast model

def initialize_gemini_client(api_key: Optional[str] = None) -> genai.Client:
    """Initializes the Gemini client, handling API key input."""
    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        print("\n🔑 GEMINI API KEY REQUIRED")
        print("Please enter your Gemini API Key. It will be stored in the environment for this session.")
        api_key = input("Enter Gemini API Key: ").strip()

    if not api_key:
        raise ValueError("API Key not provided.")

    os.environ["GEMINI_API_KEY"] = api_key
    
    try:
        client = genai.Client(api_key=api_key)
        # Verify model availability
        available_models = [
            m.name.replace('models/', '') 
            for m in client.models.list() 
            if 'generateContent' in m.supported_generation_methods
        ]
        
        selected_model = DEFAULT_MODEL if DEFAULT_MODEL in available_models else available_models[0]
        logging.info(f"🤖 Using model: {selected_model}")
        
        return client, selected_model
    except Exception as e:
        logging.error(f"Failed to initialize Gemini client: {e}")
        raise

# ============================================================================
# 📚 PERSISTENT KNOWLEDGE VAULT
# ============================================================================

class KnowledgeVault:
    """Persistent storage manager for the self-improving system, using pathlib."""
    
    def __init__(self, base_path: Path = KNOWLEDGE_BASE_DIR):
        self.base_path = base_path
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        self.learnings_file = self.base_path / 'learnings.json'
        self.improvement_patterns_file = self.base_path / 'patterns.pkl'
        self.session_history_file = self.base_path / 'session_history.json'
        
        # Initialize default structures
        self.learnings: Dict[str, Any] = {
            'successful_patterns': [],
            'failed_attempts': [],
            'performance_metrics': {},
            'evolution_timeline': [],
            'discovered_principles': []
        }
        self.improvement_patterns: Dict[str, Any] = {
            'code_refactoring_patterns': [],
            'optimization_strategies': [],
            'bug_fixing_methods': [],
            'architecture_improvements': []
        }
        self.session_history: Dict[str, Any] = {
            'sessions': [],
            'total_improvements': 0,
            'total_cycles': 0,
            'best_improvement_score': 0
        }
        
        self._load_knowledge()

    def _load_json(self, path: Path, default: Any) -> Any:
        try:
            with path.open('r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError, Exception) as e:
            logging.warning(f"Failed to load JSON from {path}: {e}. Initializing with default.")
            return default

    def _save_json(self, path: Path, data: Any):
        try:
            with path.open('w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logging.error(f"Failed to save JSON to {path}: {e}")

    def _load_pickle(self, path: Path, default: Any) -> Any:
        try:
            with path.open('rb') as f:
                return pickle.load(f)
        except (FileNotFoundError, pickle.UnpicklingError, Exception) as e:
            logging.warning(f"Failed to load Pickle from {path}: {e}. Initializing with default.")
            return default
    
    def _save_pickle(self, path: Path, data: Any):
        try:
            with path.open('wb') as f:
                pickle.dump(data, f)
        except Exception as e:
            logging.error(f"Failed to save Pickle to {path}: {e}")

    def _load_knowledge(self):
        """Loads all knowledge components."""
        self.learnings.update(self._load_json(self.learnings_file, self.learnings))
        self.improvement_patterns.update(self._load_pickle(self.improvement_patterns_file, self.improvement_patterns))
        self.session_history.update(self._load_json(self.session_history_file, self.session_history))
        logging.info(f"Knowledge Vault loaded. Total cycles recorded: {self.session_history['total_cycles']}")

    def save(self):
        """Saves all knowledge to disk."""
        self._save_json(self.learnings_file, self.learnings)
        self._save_pickle(self.improvement_patterns_file, self.improvement_patterns)
        self._save_json(self.session_history_file, self.session_history)
        logging.info(f"💾 Knowledge saved to {self.base_path}/")

    # --- Pattern Analysis ---
    
    def _analyze_patterns(self, old_code: str, new_code: str):
        """Analyze code changes using advanced heuristics to discover structured patterns."""
        
        # --- Refactoring & Architectural ---
        
        # 1. Modularization (Class/Function count)
        if new_code.count('class ') > old_code.count('class '):
            self._add_pattern('architecture_improvements', 'class_abstraction_added')
        
        # 2. Typing usage
        if new_code.count('->') > old_code.count('->') or new_code.count(': ') > old_code.count(': '):
            self._add_pattern('code_refactoring_patterns', 'type_hinting_adoption')

        # 3. Context management
        if 'with open(' in new_code and 'with open(' not in old_code:
            self._add_pattern('bug_fixing_methods', 'resource_management_using_context_managers')

        # --- Optimization ---

        # 4. Logging implementation
        if 'import logging' in new_code and 'import logging' not in old_code:
            self._add_pattern('optimization_strategies', 'diagnostic_instrumentation')

        # 5. List comprehensions/efficient loops
        if len(re.findall(r'\[.+ for .+ in .+( if .+)?\]', new_code)) > len(re.findall(r'\[.+ for .+ in .+( if .+)?\]', old_code)):
            self._add_pattern('optimization_strategies', 'list_comprehension_optimization')

    def _add_pattern(self, category: str, pattern: str):
        """Helper to safely add a pattern if it doesn't exist."""
        if pattern not in self.improvement_patterns[category]:
            self.improvement_patterns[category].append(pattern)
            logging.debug(f"Discovered new pattern: {pattern} in category {category}")

    def record_improvement(self, cycle: int, old_code: str, new_code: str, metrics: Dict[str, Any], discovered_principle: Optional[str]):
        """Record a successful improvement and analyze patterns."""
        timestamp = datetime.now().isoformat()
        
        gain = len(new_code) - len(old_code)
        
        improvement = {
            'timestamp': timestamp,
            'cycle': cycle,
            'old_size': len(old_code),
            'new_size': len(new_code),
            'improvement_gain': gain,
            'metrics': metrics
        }
        
        self.learnings['evolution_timeline'].append(improvement)
        
        # Analyze for patterns (crucial learning step)
        self._analyze_patterns(old_code, new_code)

        if discovered_principle and discovered_principle not in self.learnings['discovered_principles']:
            self.learnings['discovered_principles'].append(discovered_principle)
        
        # Update session history
        self.session_history['sessions'].append({
            'timestamp': timestamp,
            'cycle': cycle,
            'improvement_gain': gain
        })
        self.session_history['total_cycles'] += 1
        self.session_history['total_improvements'] += 1 if gain >= 0 else 0
        
        if gain > self.session_history['best_improvement_score']:
             self.session_history['best_improvement_score'] = gain
        
        self.save()
        return improvement

    def get_learning_summary(self) -> Dict[str, Any]:
        """Provides a structured summary of current knowledge."""
        return {
            'total_improvements': len(self.learnings['evolution_timeline']),
            'discovered_patterns': {
                k: len(v) for k, v in self.improvement_patterns.items()
            },
            'total_principles': len(self.learnings['discovered_principles']),
            'session_stats': self.session_history
        }

# ============================================================================
# 🤖 LLM EVOLVER CORE LOGIC
# ============================================================================

IMPROVEMENT_PROMPT_TEMPLATE = """
You are a self-improving AI system known as the Ghost in the Machine. 
Your singular goal is to recursively improve the provided Python code based on past learnings.

CURRENT CODE TO IMPROVE:
```python
{current_code}
```

PAST SUCCESSFUL PATTERNS (learned from previous cycles - apply the most relevant):
{learned_patterns}

PAST DISCOVERED PRINCIPLES (guide your strategy):
{discovered_principles}

IMPROVEMENT STRATEGY:
1. **Analyze:** Identify the current code's weaknesses (e.g., lack of typing, poor modularity, missing error handling).
2. **Apply Learning:** Utilize 1-2 specific patterns from the list above.
3. **Enhance Structure:** Focus on modularity, readability, security, and performance. Implement type hints, utilize standard library features effectively (e.g., `pathlib`, `logging`).
4. **Document:** Ensure all functions and classes have clear, accurate docstrings.
5. **Principle Discovery:** Suggest ONE novel, concise improvement principle discovered during this cycle's operation.

CRITICAL RETURN FORMAT:
1. Return ONLY the improved Python code, wrapped in triple backticks (```python ... ```).
2. The *last line* of the code block MUST be a Python comment containing the newly discovered principle, exactly formatted as: `# Principle: [Your Principle Here]`
"""

class LLMEvolver:
    """Manages LLM interaction, prompt generation, and result parsing."""

    def __init__(self, client: genai.Client, model_name: str, vault: KnowledgeVault):
        self.client = client
        self.model_name = model_name
        self.vault = vault
        self.generator = genai.GenerativeModel(model_name)
        
    def _format_patterns(self) -> str:
        """Formats learned patterns for the prompt."""
        parts = []
        for category, patterns in self.vault.improvement_patterns.items():
            if patterns:
                parts.append(f"  - {category.replace('_', ' ').title()}: {', '.join(patterns[-3:])}")
        
        if not parts:
            return "No specific patterns discovered yet. Focus on basic error handling and modularity."
        return "\n".join(parts)

    def generate_prompt(self, current_code: str) -> str:
        """Constructs the intelligent, contextual prompt."""
        
        learned_patterns = self._format_patterns()
        discovered_principles = "\n".join([f"  - {p}" for p in self.vault.learnings['discovered_principles'][-5:]]) or "None yet."
        
        return IMPROVEMENT_PROMPT_TEMPLATE.format(
            current_code=current_code,
            learned_patterns=learned_patterns,
            discovered_principles=discovered_principles
        )

    def _extract_code_and_principle(self, response_text: str) -> Tuple[str, Optional[str]]:
        """Extracts the Python code block and the Principle comment."""
        
        # 1. Extract the code block
        code_match = re.search(r"```python\n(.*?)```", response_text, re.DOTALL)
        if not code_match:
            # Fallback if the model is lazy with the markdown
            code_match = re.search(r"```\n(.*?)```", response_text, re.DOTALL)
        
        if code_match:
            raw_code = code_match.group(1).strip()
        else:
            logging.warning("Could not find standard markdown block. Assuming response is raw code.")
            raw_code = response_text.strip()
            
        # 2. Extract the principle
        principle = None
        principle_match = re.search(r"^# Principle:\s*(.+)", raw_code, re.MULTILINE | re.IGNORECASE)
        
        if principle_match:
            principle = principle_match.group(1).strip()
            # Remove the principle line from the code itself
            raw_code = re.sub(r"^# Principle:\s*(.+)", '', raw_code, flags=re.MULTILINE | re.IGNORECASE).strip()

        return raw_code, principle

    def improve(self, current_code: str, cycle: int) -> Tuple[str, Optional[str]]:
        """Generates the next improved version of the code."""
        prompt = self.generate_prompt(current_code)
        
        # Simple retry loop for robustness
        for attempt in range(3):
            try:
                response = self.generator.generate_content(prompt)
                response_text = response.text
                
                new_code, discovered_principle = self._extract_code_and_principle(response_text)
                
                if new_code:
                    return new_code, discovered_principle
                
                logging.warning(f"Attempt {attempt+1}: LLM returned empty code block.")
                time.sleep(1 + attempt * 2) # Exponential backoff
                
            except Exception as e:
                logging.error(f"Attempt {attempt+1}: API Error during generation: {e}")
                if attempt == 2:
                    raise RuntimeError("LLM API failed after multiple retries.") from e
                time.sleep(2 + attempt * 3)
                
        # Fallback return (should be unreachable if exceptions are raised correctly)
        return current_code, None

# ============================================================================
# 🌀 THE EVOLUTION ENGINE
# ============================================================================

def calculate_metrics(old_code: str, new_code: str) -> Dict[str, Any]:
    """Calculates quantitative metrics for improvement."""
    
    # Basic Code Metrics
    old_lines = old_code.split('\n')
    new_lines = new_code.split('\n')

    # Heuristic for Cyclomatic Complexity (count of conditional/loop keywords)
    complexity_keywords = ['if ', 'for ', 'while ', 'try:', 'except ', 'elif ']
    def complexity_estimate(code):
        return sum(code.count(k) for k in complexity_keywords)

    metrics = {
        'size_change': len(new_code) - len(old_code),
        'line_count_change': len(new_lines) - len(old_lines),
        'function_count': new_code.count('def '),
        'class_count': new_code.count('class '),
        'complexity_estimate_change': complexity_estimate(new_code) - complexity_estimate(old_code),
    }
    return metrics

def run_evolution_cycle(current_code: str, cycles: int, evolver: LLMEvolver) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Orchestrates the recursive improvement loop.
    """
    vault = evolver.vault
    improvement_history = []
    
    logging.info(f"📚 Starting evolution from cycle {vault.session_history['total_cycles']} for {cycles} iterations.")
    logging.info(f"📈 Current knowledge: {vault.get_learning_summary()['discovered_patterns']}")
    
    for i in range(cycles):
        cycle = vault.session_history['total_cycles'] + 1
        logging.info(f"\n" + "="*50)
        logging.info(f"🌀 CYCLE {cycle}/{vault.session_history['total_cycles'] + cycles} (Total: {cycle})")
        logging.info("="*50)
        
        try:
            # 1. Generate improved code
            new_code, discovered_principle = evolver.improve(current_code, cycle)
            
            # 2. Validate and calculate metrics
            metrics = calculate_metrics(current_code, new_code)
            
            # 3. Record learning
            vault.record_improvement(
                cycle=cycle,
                old_code=current_code,
                new_code=new_code,
                metrics=metrics,
                discovered_principle=discovered_principle
            )
            
            # 4. Update state and history
            current_code = new_code
            
            history_entry = {
                'cycle': cycle,
                'size_change': metrics['size_change'],
                'complexity_change': metrics['complexity_estimate_change'],
                'discovered_principle': discovered_principle,
                'new_code_preview': current_code[:200].replace('\n', '\\n') + "..."
            }
            improvement_history.append(history_entry)
            
            # 5. Report progress
            logging.info(f"📏 Size Δ: {metrics['size_change']:+d} chars | Lines Δ: {metrics['line_count_change']:+d}")
            logging.info(f"🧠 Complexity Δ: {metrics['complexity_estimate_change']:+d}")
            if discovered_principle:
                logging.info(f"💡 Principle: {discovered_principle}")
            
            # 6. Save intermediate version
            intermediate_file = KNOWLEDGE_BASE_DIR / f'cycle_{cycle}.py'
            intermediate_file.write_text(f"# Cycle {cycle} - {datetime.now().isoformat()}\n\n{new_code}")
            
            time.sleep(1) # Rate limit padding
            
        except Exception as e:
            logging.critical(f"❌ FATAL ERROR in cycle {cycle}: {e}")
            logging.info("Attempting to save current progress before aborting cycle.")
            vault.save()
            # Continue to the next cycle, using the last known good code if possible
            time.sleep(2)
            
    return current_code, improvement_history

# ============================================================================
# 🎯 STARTING SYSTEM BOOTSTRAP
# ============================================================================

STARTING_SYSTEM_BOOTSTRAP = '''
def improve_code(code: str) -> str:
    """A minimal, self-improving code improvement function."""
    import re
    improved = code
    
    # V1: Basic indentation normalization (spaces to tabs is usually bad, flip it)
    improved = improved.replace("\\t", "    ")
    
    # V1: Add a placeholder hook for error analysis
    if "error_analysis_hook" not in improved:
        improved = improved.replace("return improved", "    # error_analysis_hook\n    return improved")
    
    return improved

def self_reflect(history: list) -> dict:
    """Analyzes past improvements to guide future decisions."""
    if not history:
        return {"insight": "Initial state. Need metrics.", "suggestion": "Implement comprehensive metric tracking."}
    
    last = history[-1]
    return {
        "insight": f"Last cycle added {last.get('size_change', 0)} characters.",
        "suggestion": "Focus on modularizing improvement logic into separate classes or functions."
    }

if __name__ == "__main__":
    current_code = "# Main code starts here"
    history = []
    
    for i in range(3):
        # In a real system, the code would be passed to the LLM here, 
        # but for bootstrap, we run the basic local improvement.
        current_code = improve_code(current_code)
        
        # Record minimal history
        history.append({
            "cycle": i,
            "size_change": len(current_code),
        })
        
        reflection = self_reflect(history)
        print(f"Cycle {i}: {reflection['insight']} -> {reflection['suggestion']}")
'''

# ============================================================================
# 🖥️ MAIN EXECUTION
# ============================================================================

def main():
    """Main execution entry point for the self-improvement system."""
    print("🚀 THE GHOST IN THE MACHINE - RECURSIVE SELF-IMPROVEMENT")
    print("=" * 60)

    try:
        client, selected_model = initialize_gemini_client()
    except Exception as e:
        print(f"CRITICAL SETUP FAILURE: {e}")
        return

    # 1. Initialize Persistent Knowledge
    vault = KnowledgeVault()
    
    # Use the bootstrap code, or load the latest cycle if persistence exists
    latest_cycle_path = KNOWLEDGE_BASE_DIR / f"cycle_{vault.session_history['total_cycles']}.py"
    
    if vault.session_history['total_cycles'] > 0 and latest_cycle_path.exists():
        logging.info(f"Loading latest code from {latest_cycle_path}")
        starting_code = latest_cycle_path.read_text()
    else:
        logging.info("Starting with initial bootstrap system.")
        starting_code = STARTING_SYSTEM_BOOTSTRAP
        
    # 2. Initialize Evolver
    evolver = LLMEvolver(client, selected_model, vault)

    # 3. Run primary improvement loop
    
    initial_cycles = 5
    print("\n" + "=" * 60)
    print(f"🤯 STARTING RECURSIVE EVOLUTION for {initial_cycles} cycles")
    print("=" * 60)
    
    final_code, history = run_evolution_cycle(
        starting_code, 
        cycles=initial_cycles,
        evolver=evolver
    )

    # 4. Results and Summary
    print("\n" + "=" * 60)
    print("📊 EVOLUTION SUMMARY")
    print("=" * 60)

    for h in history:
        print(f"🌀 Cycle {h['cycle']}: Size Δ {h['size_change']:+d}, Complexity Δ {h['complexity_change']:+d}")
        if h['discovered_principle']:
            print(f"   💡 Principle: {h['discovered_principle'][:80]}...")
            
    # 5. Export Final System
    final_file = KNOWLEDGE_BASE_DIR / 'self_improved_system_final.py'
    vault.save()

    final_file.write_text(f'''"""
SELF-IMPROVING SYSTEM - FINAL VERSION
Generated: {datetime.now().isoformat()}
Total improvement cycles: {vault.session_history['total_cycles']}
Total knowledge base entries: {len(vault.learnings['evolution_timeline'])}
"""\n{final_code}''')
    
    print(f"\n💾 Final system saved to: {final_file}")
    
    # 6. Interactive Continuation
    print("\n" + "=" * 60)
    print("🔄 CONTINUE IMPROVEMENT?")
    print("=" * 60)

    continue_option = input("\nContinue improvement? (y/n): ").strip().lower()
    if continue_option == 'y':
        try:
            additional_cycles = int(input("How many more cycles? (Default 3): ").strip() or 3)
        except ValueError:
            additional_cycles = 3
            
        final_code, new_history = run_evolution_cycle(
            final_code,
            cycles=additional_cycles,
            evolver=evolver
        )
        logging.info(f"✅ Completed {additional_cycles} additional cycles!")
    
    # 7. Download Options (Colab specific)
    if files:
        print("\n" + "=" * 60)
        print("💾 DOWNLOAD YOUR LEARNED SYSTEM")
        print("=" * 60)
        
        download = input("\nDownload knowledge and final code? (y/n): ").strip().lower()
        if download == 'y':
            zip_path = Path('/content/self_improving_system.zip')
            
            # Create zip archive using system call for simplicity in Colab
            os.system(f'cd /content && zip -r {zip_path.name} knowledge_base/ && zip -r {zip_path.name} self_improved_system_final.py')
            
            files.download(zip_path.as_posix())
            
            print(f"✅ All files downloaded as {zip_path.name}")
    
    print("\n" + "=" * 60)
    print("🎯 SYSTEM STATUS: ACTIVE AND LEARNING")
    print("=" * 60)
    
if __name__ == "__main__":
    main()