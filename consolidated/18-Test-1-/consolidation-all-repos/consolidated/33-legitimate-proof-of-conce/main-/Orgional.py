# ============================================================================
# 🌀 RECURSIVE SELF-IMPROVEMENT SYSTEM WITH PERSISTENT LEARNING
# ============================================================================

!pip install -q google-generativeai
!mkdir -p /content/knowledge_base

import os
import time
import json
import pickle
from datetime import datetime
from google.colab import files

print("🚀 THE FUNDAMENTAL LOOP WITH PERSISTENT LEARNING")
print("=" * 60)

# Get API key
api_key = input("Enter Gemini API Key: ").strip()
os.environ["GEMINI_API_KEY"] = api_key

import google.generativeai as genai
genai.configure(api_key=api_key)

# Check available models
print("\n📊 Checking available models...")
available_models = []
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        model_name = m.name.replace('models/', '')
        available_models.append(model_name)
        print(f"  ✓ {model_name}")

# Use latest model
model_name = 'gemini-2.0-flash-latest' if 'gemini-2.0-flash-latest' in available_models else available_models[0]
print(f"\n🤖 Using model: {model_name}")
model = genai.GenerativeModel(model_name)

# ============================================================================
# 📚 PERSISTENT KNOWLEDGE BASE
# ============================================================================

class KnowledgeBase:
    """Persistent learning storage for the self-improving system"""
    
    def __init__(self, base_path='/content/knowledge_base'):
        self.base_path = base_path
        self.learnings_file = f'{base_path}/learnings.json'
        self.improvement_patterns_file = f'{base_path}/patterns.pkl'
        self.session_history_file = f'{base_path}/session_history.json'
        
        # Load existing knowledge or initialize
        self.learnings = self._load_json(self.learnings_file, default={
            'successful_patterns': [],
            'failed_attempts': [],
            'performance_metrics': {},
            'evolution_timeline': [],
            'discovered_principles': []
        })
        
        self.improvement_patterns = self._load_pickle(self.improvement_patterns_file, default={
            'code_refactoring_patterns': [],
            'optimization_strategies': [],
            'bug_fixing_methods': [],
            'architecture_improvements': []
        })
        
        self.session_history = self._load_json(self.session_history_file, default={
            'sessions': [],
            'total_improvements': 0,
            'total_cycles': 0,
            'best_improvement_score': 0
        })
    
    def _load_json(self, path, default=None):
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except:
            return default if default is not None else {}
    
    def _save_json(self, path, data):
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _load_pickle(self, path, default=None):
        try:
            with open(path, 'rb') as f:
                return pickle.load(f)
        except:
            return default if default is not None else {}
    
    def _save_pickle(self, path, data):
        with open(path, 'wb') as f:
            pickle.dump(data, f)
    
    def record_improvement(self, cycle, old_code, new_code, metrics):
        """Record a successful improvement"""
        timestamp = datetime.now().isoformat()
        
        # Store the improvement
        improvement = {
            'timestamp': timestamp,
            'cycle': cycle,
            'old_size': len(old_code),
            'new_size': len(new_code),
            'improvement_gain': len(new_code) - len(old_code),
            'metrics': metrics
        }
        
        self.learnings['evolution_timeline'].append(improvement)
        
        # Analyze for patterns
        self._analyze_patterns(old_code, new_code)
        
        # Update session history
        self.session_history['sessions'].append({
            'timestamp': timestamp,
            'cycle': cycle,
            'improvement_gain': improvement['improvement_gain']
        })
        self.session_history['total_cycles'] += 1
        self.session_history['total_improvements'] += 1 if improvement['improvement_gain'] > 0 else 0
        
        # Save everything
        self.save()
        
        return improvement
    
    def _analyze_patterns(self, old_code, new_code):
        """Analyze code changes to discover improvement patterns"""
        # Simple pattern detection (can be enhanced)
        changes = []
        
        # Check for added functions
        old_funcs = old_code.count('def ')
        new_funcs = new_code.count('def ')
        if new_funcs > old_funcs:
            changes.append('function_addition')
            if 'function_addition' not in self.improvement_patterns['code_refactoring_patterns']:
                self.improvement_patterns['code_refactoring_patterns'].append('function_addition')
        
        # Check for added error handling
        if 'try:' in new_code and 'try:' not in old_code:
            changes.append('error_handling_added')
            if 'error_handling' not in self.improvement_patterns['bug_fixing_methods']:
                self.improvement_patterns['bug_fixing_methods'].append('error_handling')
        
        # Check for performance improvements
        if any(word in new_code for word in ['cache', 'optimize', 'efficient', 'complexity']):
            changes.append('performance_focus')
            if 'performance_optimization' not in self.improvement_patterns['optimization_strategies']:
                self.improvement_patterns['optimization_strategies'].append('performance_optimization')
        
        return changes
    
    def save(self):
        """Save all knowledge to disk"""
        self._save_json(self.learnings_file, self.learnings)
        self._save_pickle(self.improvement_patterns_file, self.improvement_patterns)
        self._save_json(self.session_history_file, self.session_history)
        print(f"💾 Knowledge saved to {self.base_path}/")
    
    def get_learning_summary(self):
        """Get a summary of what the system has learned"""
        return {
            'total_improvements': len(self.learnings['evolution_timeline']),
            'discovered_patterns': {
                'refactoring': len(self.improvement_patterns['code_refactoring_patterns']),
                'optimization': len(self.improvement_patterns['optimization_strategies']),
                'bug_fixing': len(self.improvement_patterns['bug_fixing_methods'])
            },
            'session_stats': self.session_history
        }
    
    def generate_improvement_prompt(self, current_code):
        """Generate a smarter prompt based on past learnings"""
        base_prompt = f"""
        You are a self-improving AI system. Your goal is to improve this code AND improve your own ability to improve code.
        
        CURRENT CODE TO IMPROVE:
        ```python
        {current_code}
        ```
        
        PAST SUCCESSFUL PATTERNS (learned from previous cycles):
        """
        
        # Add learned patterns
        if self.improvement_patterns['code_refactoring_patterns']:
            base_prompt += f"\n- Refactoring patterns that worked: {', '.join(self.improvement_patterns['code_refactoring_patterns'][-3:])}"
        
        if self.improvement_patterns['optimization_strategies']:
            base_prompt += f"\n- Optimization strategies that worked: {', '.join(self.improvement_patterns['optimization_strategies'][-3:])}"
        
        if self.learnings['discovered_principles']:
            base_prompt += f"\n- Discovered principles: {', '.join(self.learnings['discovered_principles'][-5:])}"
        
        base_prompt += """
        
        IMPROVEMENT STRATEGY:
        1. First, analyze what makes THIS code improvable
        2. Apply patterns that worked in the past
        3. Add new capabilities (error handling, logging, optimization)
        4. Make the code BETTER AT BEING IMPROVED (add hooks, modularity)
        5. Document what you changed and why
        6. Suggest ONE new improvement principle you discovered
        
        Return ONLY the improved Python code, followed by a comment with the new principle.
        """
        
        return base_prompt

# ============================================================================
# 🌀 THE CORE RECURSIVE IMPROVEMENT LOOP
# ============================================================================

def recursive_improvement(starting_code: str, cycles: int = 3, knowledge_base=None):
    """
    Advanced recursive improvement with persistent learning
    """
    if knowledge_base is None:
        knowledge_base = KnowledgeBase()
    
    current_code = starting_code
    improvement_history = []
    
    print(f"\n📚 Loaded knowledge from {len(knowledge_base.learnings['evolution_timeline'])} past improvements")
    print(f"📈 Patterns discovered: {knowledge_base.get_learning_summary()['discovered_patterns']}")
    
    for cycle in range(cycles):
        print(f"\n🌀 CYCLE {cycle + 1}/{cycles}")
        print("-" * 40)
        
        # Generate smarter prompt using past knowledge
        prompt = knowledge_base.generate_improvement_prompt(current_code)
        
        try:
            # Get improvement from AI
            response = model.generate_content(prompt)
            new_code = response.text.strip()
            
            # Extract code from markdown if present
            if '```python' in new_code:
                new_code = new_code.split('```python')[1].split('```')[0]
            elif '```' in new_code:
                new_code = new_code.split('```')[1].split('```')[0]
            
            # Extract discovered principle
            discovered_principle = None
            if '# Principle:' in new_code:
                principle_part = new_code.split('# Principle:')[-1].split('\n')[0].strip()
                discovered_principle = principle_part
                knowledge_base.learnings['discovered_principles'].append(discovered_principle)
            
            # Calculate improvement metrics
            metrics = {
                'size_change': len(new_code) - len(current_code),
                'complexity_estimate': new_code.count('\n'),
                'function_count': new_code.count('def '),
                'cycle': cycle + 1
            }
            
            # Record in knowledge base
            improvement = knowledge_base.record_improvement(
                cycle=cycle + 1,
                old_code=current_code,
                new_code=new_code,
                metrics=metrics
            )
            
            # Add to history
            improvement_history.append({
                'cycle': cycle + 1,
                'old_code_preview': current_code[:150] + ("..." if len(current_code) > 150 else ""),
                'new_code_preview': new_code[:150] + ("..." if len(new_code) > 150 else ""),
                'size_change': metrics['size_change'],
                'discovered_principle': discovered_principle
            })
            
            # Display progress
            print(f"📏 Code size: {len(current_code)} → {len(new_code)} chars (Δ: {metrics['size_change']:+d})")
            print(f"📈 Complexity: {current_code.count('def ')} → {new_code.count('def ')} functions")
            
            if discovered_principle:
                print(f"💡 Discovered: {discovered_principle}")
            
            # Show a sample of the change
            old_lines = current_code.split('\n')
            new_lines = new_code.split('\n')
            if new_lines and old_lines and new_lines[0] != old_lines[0]:
                print(f"🔄 First line changed:")
                print(f"   Was: {old_lines[0][:80]}...")
                print(f"   Now: {new_lines[0][:80]}...")
            
            current_code = new_code
            
            # Save intermediate version
            intermediate_file = f'/content/knowledge_base/cycle_{cycle+1}.py'
            with open(intermediate_file, 'w') as f:
                f.write(f"# Cycle {cycle+1} - {datetime.now().isoformat()}\n")
                f.write(new_code)
            
            time.sleep(1)  # Rate limiting
            
        except Exception as e:
            print(f"❌ Error in cycle {cycle + 1}: {e}")
            print("🔄 Retrying with simpler prompt...")
            # Fallback to simpler prompt
            fallback_prompt = f"Improve this code:\n```python\n{current_code}\n```"
            response = model.generate_content(fallback_prompt)
            new_code = response.text.strip()
            
            if '```python' in new_code:
                new_code = new_code.split('```python')[1].split('```')[0]
            
            current_code = new_code
    
    return current_code, improvement_history, knowledge_base

# ============================================================================
# 🎯 STARTING SYSTEM
# ============================================================================

starting_system = '''
def improve_code(code: str) -> str:
    """A self-improving code improvement function."""
    # Version 1.0 - Basic but extensible
    improved = code
    
    # Fix indentation
    improved = improved.replace("    ", "\\t")
    
    # Add basic error handling template
    if "try:" not in improved:
        header = "import traceback\\nimport sys\\n\\n"
        improved = header + improved
    
    return improved

def self_reflect(history: list) -> dict:
    """Analyze past improvements to do better next time."""
    if not history:
        return {"insight": "No history yet"}
    
    last = history[-1]
    return {
        "insight": f"Last change: {last.get('change_type', 'unknown')}",
        "suggestion": "Add more modular functions"
    }

# Main improvement loop
if __name__ == "__main__":
    current_code = "print('Hello, World')"
    history = []
    
    for i in range(3):
        current_code = improve_code(current_code)
        history.append({
            "cycle": i,
            "code_sample": current_code[:100]
        })
        
        reflection = self_reflect(history)
        print(f"Cycle {i}: {reflection['insight']}")
'''

print("\n" + "=" * 60)
print("🤯 STARTING RECURSIVE SELF-IMPROVEMENT WITH LEARNING")
print("=" * 60)
print("\nInitial system preview:")
print(starting_system[:250] + "...")

# ============================================================================
# 🏃 RUN THE IMPROVEMENT LOOP
# ============================================================================

# Initialize knowledge base
kb = KnowledgeBase()

# Run improvement cycles
final_code, history, kb = recursive_improvement(
    starting_system, 
    cycles=5,
    knowledge_base=kb
)

# ============================================================================
# 📊 RESULTS AND EXPORT
# ============================================================================

print("\n" + "=" * 60)
print("📊 EVOLUTION SUMMARY")
print("=" * 60)

for i, h in enumerate(history):
    print(f"\n🌀 Cycle {h['cycle']}:")
    print(f"   Size Δ: {h['size_change']:+d} chars")
    if h['discovered_principle']:
        print(f"   Principle: {h['discovered_principle'][:80]}...")
    print(f"   Preview: {h['new_code_preview']}")

# Save final system
final_file = '/content/self_improved_system_final.py'
with open(final_file, 'w') as f:
    f.write(f'''"""
SELF-IMPROVING SYSTEM - FINAL VERSION
Generated: {datetime.now().isoformat()}
Total improvement cycles: {len(history)}
Total knowledge base entries: {len(kb.learnings['evolution_timeline'])}
"""
''')
    f.write(final_code)

# Save comprehensive knowledge
kb.save()

# Create a summary report
summary_file = '/content/improvement_summary.md'
with open(summary_file, 'w') as f:
    f.write(f'''# Recursive Self-Improvement Report
Generated: {datetime.now().isoformat()}

## Summary
- Total cycles: {len(history)}
- Final code size: {len(final_code)} characters
- Discovered principles: {len(kb.learnings['discovered_principles'])}
- Improvement patterns: {sum(len(v) for v in kb.improvement_patterns.values())}

## Evolution Timeline
''')
    
    for i, h in enumerate(history):
        f.write(f'\n### Cycle {h["cycle"]}\n')
        f.write(f'- Size change: {h["size_change"]:+d} characters\n')
        if h['discovered_principle']:
            f.write(f'- Principle: {h["discovered_principle"]}\n')

## Discovered Patterns
for pattern_type, patterns in kb.improvement_patterns.items():
    if patterns:
        f.write(f'\n### {pattern_type.replace("_", " ").title()}\n')
        for pattern in patterns:
            f.write(f'- {pattern}\n')

print(f"\n💾 Final system saved to: {final_file}")
print(f"📚 Knowledge saved to: /content/knowledge_base/")
print(f"📄 Summary saved to: {summary_file}")

# ============================================================================
# 🎮 INTERACTIVE CONTINUATION
# ============================================================================

print("\n" + "=" * 60)
print("🔄 CONTINUE IMPROVEMENT?")
print("=" * 60)

continue_option = input("\nContinue improvement? (y/n): ").strip().lower()
if continue_option == 'y':
    additional_cycles = int(input("How many more cycles? (1-10): ").strip() or 3)
    
    final_code, new_history, kb = recursive_improvement(
        final_code,
        cycles=additional_cycles,
        knowledge_base=kb
    )
    
    print(f"\n✅ Completed {additional_cycles} additional cycles!")
    print(f"📊 Total cycles now: {kb.session_history['total_cycles']}")
    print(f"💡 Total principles discovered: {len(kb.learnings['discovered_principles'])}")

# ============================================================================
# 📥 DOWNLOAD OPTIONS
# ============================================================================

print("\n" + "=" * 60)
print("💾 DOWNLOAD YOUR LEARNED SYSTEM")
print("=" * 60)

download = input("\nDownload all files? (y/n): ").strip().lower()
if download == 'y':
    # Create zip archive
    !cd /content && zip -r self_improving_system.zip knowledge_base/ self_improved_system_final.py improvement_summary.md
    
    # Download files
    from google.colab import files
    files.download('/content/self_improving_system.zip')
    
    print("✅ All files downloaded as self_improving_system.zip")
    print("🔧 To continue later, upload this zip to Colab and extract it")

print("\n" + "=" * 60)
print("🎯 SYSTEM STATUS: ACTIVE AND LEARNING")
print("=" * 60)
print(f"""
The system has:

1. Completed {kb.session_history['total_cycles']} improvement cycles
2. Discovered {len(kb.learnings['discovered_principles'])} principles
3. Learned {sum(len(v) for v in kb.improvement_patterns.values())} patterns
4. Saved all knowledge to /content/knowledge_base/

The system WILL REMEMBER its progress between Colab sessions if you:
1. Download the knowledge_base/ folder
2. Upload it next time you run this notebook
3. The system will load from where it left off

THIS IS TRUE RECURSIVE SELF-IMPROVEMENT WITH PERSISTENT LEARNING.
Each run makes the system SMARTER because it BUILDS ON PAST KNOWLEDGE.
""")
