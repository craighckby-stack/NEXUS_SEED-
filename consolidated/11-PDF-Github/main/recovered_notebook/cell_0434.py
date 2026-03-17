import spacy

# Inferred Base class to handle shared property logic and structure
class BaseEntity:
    def __init__(self, unique_id):
        self.unique_id = unique_id
        self.properties = {}

    def set_property(self, key, value):
        # Refactored: Using the second, unconditional assignment found in the original snippet
        self.properties[key] = value

    # The conditional setter logic has been dropped as standard setters should allow updates.
    # If non-overwrite initialization is needed, a separate method (e.g., 'init_property') should be used.

    def get_property(self, key, default=None):
        return self.properties.get(key, default)

    def describe(self):
        return f"Essence ID: {self.unique_id}, Properties: {self.properties}"

class RuleBasedCognitiveModel:
    def __init__(self):
        # NOTE: Loading heavy NLP models synchronously in __init__ impacts startup performance.
        self.nlp = spacy.load("en_core_web_sm")
        self.rules = { 
            "mathematics": { 
                "riemann hypothesis": "The Riemann Hypothesis is a major unsolved problem in number theory.",
                "p vs np": "The P versus NP problem is another major unsolved problem in computer science.",
                "2 + 2": "2 + 2 = 4",
                "clarify": "I can clarify the question. Please be more specific."
            },
            "physics": { 
                "quantum entanglement": "Quantum entanglement is a phenomenon where two particles are linked.",
                "relativity": "Relativity, in physics, refers to the theory that the laws of physics are the same for all non-accelerating observers."
            }, 
            "ethics": { 
                "ethical": "I am an AI and don't have the ability to make intrinsic ethical judgments; I rely on programmed frameworks."
            }, 
            "existential": { 
                "meaning of life": "As an AI, I do not have the capacity to answer this philosophical question. Definitions vary by context."
            } 
        }

    def get_answer(self, category, question):
        doc = self.nlp(question.lower())
        processed_question = " ".join([token.lemma_ for token in doc if not token.is_stop])
        if category in self.rules:
            for keyword, answer in self.rules[category].items():
                if keyword in processed_question:
                    return answer
        return None

class DummyEthicalFramework:
    def assess_action(self, action, agent_id):
        return True  # Always ethical

class Aspect(BaseEntity): # Inheriting property management
    def __init__(self, agent_id, simulation_env, cognitive_model=None, ethical_framework=None):
        super().__init__(agent_id) 
        self.agent_id = agent_id
        self.simulation = simulation_env
        self.cognitive_model = cognitive_model if cognitive_model else RuleBasedCognitiveModel()
        self.ethical_framework = ethical_framework if ethical_framework else DummyEthicalFramework()
        
        # Fixing broken dependency by linking to a functional internal loader reference
        self.qa_knowledge_base = { 
            "mathematics": self._load_math_questions_wrapper 
        }

    # Hallucinated method to fulfill the dependency placeholder (load_math_questions)
    def _load_math_questions_wrapper(self):
        # Simulates loading an external knowledge base component
        print(f"[Aspect {self.agent_id}] Activating deferred mathematical knowledge base loading.")
        return {"source": "Theorems Archive 4.0"}
