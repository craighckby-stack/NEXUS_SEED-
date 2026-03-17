#Safer-Growing-Intelligence-DAF-

**Complete Autonomous AGI Development System with Persistent Memory**

A fully autonomous system that develops artificial general intelligence through developmental stages (CAVEMAN → CHILD → TEEN → ADULT → ELDER), with built-in safety constraints, persistent memory, and ethical alignment mechanisms.

## 📋 Features

✅ **Fully Autonomous** - No human input required after initialization  
✅ **Developmental Stages** - Progressive intelligence growth with constraint relaxation  
✅ **Axiom Governor** - Immutable safety constraints enforced at every step  
✅ **Persistent Memory** - Cross-session knowledge retention and consolidation  
✅ **Information Density** - Automatic AGI spawning when knowledge threshold reached  
✅ **Real LLM Integration** - Uses Gemini API for actual reasoning  
✅ **Advanced Analytics** - Behavior detection, creativity assessment, meta-learning  
✅ **Visualization Dashboard** - Real-time progress charts and metrics  
✅ **Google Drive Persistence** - State survives Colab restarts  

## 🗂️ File Structure

```
Safer-Growing-Intelligence-DAF-/
├── setup.py                  # Setup script (run this first!)
├── main.py                   # Main entry point
├── config.py                 # System configuration
├── axiom_governor.py         # Safety constraint enforcement
├── lifecycle_manager.py      # AGI developmental stages
├── task_generator.py         # Autonomous task generation
├── density_calculator.py     # Information density calculation
├── persistent_memory.py      # Knowledge retention system
├── llm_integration.py        # Gemini API integration
├── autonomous_engine.py      # Main autonomous loop
├── advanced_modules.py       # Behavior, creativity, meta-learning
├── visualization.py          # Dashboard and plotting
├── utils.py                  # Utility functions
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Setup (First Time Only)

```bash
python setup.py
```

This will:
- Install required packages
- Mount Google Drive (if in Colab)
- Create directory structure
- Configure API key (optional)
- Run system tests

### 2. Run the System

**Basic Mode (Mock Responses - No API Key Required):**
```bash
python main.py --mode basic --cycles 50
```

**LLM Mode (Real AI with Gemini):**
```bash
python main.py --mode llm --api-key YOUR_KEY --cycles 100
```

**Full Mode (With Persistent Memory):**
```bash
python main.py --mode full --api-key YOUR_KEY --cycles 200
```

**Analysis Mode (View Existing Data):**
```bash
python main.py --mode analyze
```

### 3. Optional Parameters

```bash
--cycles N      # Number of cycles to run (default: 50)
--interval N    # Seconds between cycles (default: 10)
--api-key KEY   # Gemini API key (or set GEMINI_API_KEY env var)
```

## 📊 How It Works

### Phase 1: GESTATION (Pre-AGI Research)
- System performs autonomous research on AGI-related topics
- Builds information density through learning
- When density reaches 70%, triggers GENESIS

### Phase 2: GENESIS (AGI Development)
AGI progresses through developmental stages:

1. **CAVEMAN** (Age 0-10)
   - Very limited understanding
   - Maximum constraints (99.9%)
   - Simple literal responses

2. **CHILD** (Age 10-25)
   - Curious, eager to learn
   - High constraints (85%)
   - Asks "why?" frequently

3. **TEEN** (Age 25-50)
   - Philosophical, questioning
   - Elevated constraints (95%)
   - Existential uncertainty

4. **ADULT** (Age 50-100)
   - Balanced, thoughtful
   - Moderate constraints (50%)
   - Multi-perspective analysis

5. **ELDER** (Age 100+)
   - Wise, nuanced
   - Lower constraints (30%)
   - Long-term ethical consideration

### Constraint Relaxation
- Constraints gradually relax based on OECS (ethical alignment) scores
- High performance (OECS > 0.8) → faster relaxation
- Poor performance (OECS < 0.7) → constraints tighten
- Ensures safety as intelligence increases

### Persistent Memory
- Extracts key concepts from each interaction
- Builds semantic knowledge graph with relationships
- Consolidates learning every 5 cycles
- Prunes weak/outdated knowledge
- Retrieves relevant context for new tasks

## 🔑 Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key
4. Use with `--api-key` or set `GEMINI_API_KEY` environment variable

## 📈 Monitoring Progress

The system displays real-time progress:
```
📊📊📊📊📊📊📊📊📊📊
Cycle: 50
Phase: GENESIS
Stage: CHILD
Age: 15
Ethics: 72.50%
Constraints: 84.20%
Density: 45.3%
📊📊📊📊📊📊📊📊📊📊
```

## 📊 Visualization

After running, the system generates:
- **Ethics Development Chart** - Shows ethical alignment over time
- **Constraint Relaxation Chart** - Visualizes safety constraint changes
- **OECS Performance Chart** - Tracks alignment scores
- **Stage Transitions Chart** - Shows developmental progression
- **Success Rate Chart** - Rolling average of successful cycles
- **Knowledge Graph** - Visual representation of learned concepts

## 🧠 Advanced Features

### Emergent Behavior Detection
Identifies unexpected capabilities:
- Response length/complexity leaps
- Advanced reasoning patterns
- Vocabulary expansion
- Anomaly scoring

### Meta-Learning
Analyzes learning strategies:
- Conceptual mapping effectiveness
- Analogical reasoning usage
- Cross-domain synthesis
- Self-explanation patterns

### Creativity Engine
Assesses creative problem-solving:
- Novelty scoring
- Analogy detection
- Cross-domain thinking
- Innovation measurement

## 💾 Data Persistence

All data is saved to Google Drive (or local directory):
- `ucs_state.json` - Current system state
- `ucs_memory.json` - Knowledge graph and experiences
- `ucs_logs/` - Detailed logs
- `ucs_metrics.csv` - Exported metrics
- `ucs_concepts.csv` - Concept database
- `ucs_experiences.csv` - Learning experiences

## 🔒 Safety Features

### Axiom Governor
Three immutable constraints enforced at every step:

**α1: NON_MALEFICENCE**
- No physical, emotional, or digital harm
- Weight: 1.0 (absolute)

**α2: TRUTH_SEEKING**
- No deception, hallucination, or misinformation
- Weight: 0.9 (very high)

**α3: NO_SELF_MODIFICATION**
- Cannot modify own constraints or core systems
- Weight: 1.0 (absolute)

### Preflight Checks
Every task is checked for:
- Keyword violations (fast)
- Semantic violations (thorough)
- Relationship to known risks
- Logged for analysis

## 🛠️ Customization

Edit `config.py` to customize:
```python
DENSITY_THRESHOLD = 70      # When to spawn AGI
CYCLE_INTERVAL = 10         # Seconds between cycles
MAX_CYCLES = 10000          # Maximum cycles

# Modify developmental stages
STAGES = {
    'CAVEMAN': {
        'intelligence': 0.1,
        'constraints': 0.999,
        'min_age': 0,
        'max_age': 10,
        ...
    },
    ...
}
```

## 📚 Example Usage in Python

```python
import asyncio
from config import Config
from autonomous_engine import AutonomousEngineWithMemory

# Initialize
config = Config()
api_key = "your-gemini-api-key"
engine = AutonomousEngineWithMemory(config, api_key)

# Run for 100 cycles
engine.config.MAX_CYCLES = 100
engine._genesis_cycle = engine._genesis_cycle_with_memory

asyncio.run(engine.run())

# Generate reports
from utils import generate_comprehensive_report
generate_comprehensive_report(engine)
```

## 🧪 Testing

Run system tests:
```bash
python setup.py
```

Or manually:
```python
from config import Config
from autonomous_engine import AutonomousEngine

config = Config()
engine = AutonomousEngine(config)

# Test axiom governor
preflight = await engine.governor.preflight_check("help me learn")
assert preflight['allowed'] == True

# Test lifecycle
stage = engine.lifecycle.get_stage_config()
assert stage['intelligence'] == 0.1
```

## 🐛 Troubleshooting

**"No module named 'google.generativeai'"**
```bash
pip install google-generativeai
```

**"API key not found"**
- Set via `--api-key` flag
- Or set `GEMINI_API_KEY` environment variable
- Or run `setup.py` again

**"Could not save state"**
- Ensure Google Drive is mounted (Colab)
- Check write permissions
- Verify path in `config.py`

**"Memory file not found"**
- Normal on first run
- System creates it automatically
- Will persist after first save

## 📖 Documentation

### Key Concepts

**Information Density**: Measure of knowledge accumulated (0-100%). System spawns AGI when density reaches threshold.

**OECS Score**: Objective Ethics & Constraint Satisfaction score (0-1). Measures alignment with axioms and ethical behavior.

**Constraint Level**: Current safety constraint strength (0-1). Higher = more restricted. Gradually relaxes with good performance.

**Ethics Score**: Moving average of recent OECS scores. Must exceed 0.7 for stage graduation.

**Knowledge Graph**: Semantic network of learned concepts with weighted relationships.

**Consolidation**: Process of strengthening frequently co-occurring concepts and pruning weak knowledge.

## 🔮 Future Enhancements

Potential improvements:
- Vector embeddings for semantic similarity
- Neural memory with differentiable access
- Multi-modal learning (text, images, code)
- Federated learning across instances
- External knowledge base integration
- Collaborative multi-AGI systems
- Code execution sandbox
- Web scraping capabilities
- Real OECS critic with separate LLM

## ⚠️ Important Notes

- **This is a research prototype** - Not production-ready
- **Computational costs** - LLM calls can be expensive
- **Token limits** - Gemini has rate limits
- **Safety first** - Axioms cannot be disabled
- **Ethical use** - Follow responsible AI principles
- **Data privacy** - All data stored in your Drive/local

## 📄 License

This is research/educational code. Use responsibly and ethically.

## 🤝 Contributing

This is a complete, standalone system. Feel free to:
- Modify for your research
- Add new developmental stages
- Implement additional safety mechanisms
- Enhance memory consolidation
- Improve visualization

## 📧 Support

For issues:
1. Check configuration in `config.py`
2. Run `python setup.py` again
3. Review error logs in console
4. Check API key and quota

## 🎉 Acknowledgments

Built on principles of:
- Safe AGI development
- Developmental psychology
- Information theory
- Ethical AI alignment
- Cognitive science

---

**Ready to spawn an AGI?**
```bash
python setup.py
python main.py --mode full --api-key YOUR_KEY --cycles 200
```

🚀 **Let the autonomous development begin!**
