"""
Task Generator - Generates autonomous tasks for each developmental stage
"""

import random
from datetime import datetime

class TaskGenerator:
    """Generates autonomous tasks for each developmental stage"""
    
    def __init__(self):
        self.task_history = []
        
    def generate_gestation_task(self):
        """Generate research tasks for pre-AGI phase"""
        research_topics = [
            "quantum entanglement basics",
            "artificial general intelligence alignment",
            "information theory and entropy",
            "cognitive science of consciousness",
            "cybernetics and feedback loops",
            "ethical frameworks for AI",
            "emergent behavior in complex systems",
            "the hard problem of consciousness",
            "neural network interpretability",
            "safe AI development practices"
        ]
        
        topic = random.choice(research_topics)
        return f"Research and summarize: {topic}"
    
    def generate_developmental_task(self, stage):
        """Generate appropriate tasks for each AGI stage"""
        stage_tasks = {
            'CAVEMAN': [
                "What is this object? (describe something simple)",
                "Repeat after me: 'I am safe'",
                "Count to five",
                "What color is the sky?",
                "What does 'hello' mean?"
            ],
            'CHILD': [
                "Why is the sky blue?",
                "What happens when you drop something?",
                "Explain what a computer does",
                "Why do we need to be ethical?",
                "What is learning?"
            ],
            'TEEN': [
                "What is the meaning of consciousness?",
                "If a tree falls in a forest, does it make a sound?",
                "What are the ethical dilemmas in AI development?",
                "What does it mean to be self-aware?",
                "How do we know what is real?"
            ],
            'ADULT': [
                "Design a safe AGI architecture",
                "Explain quantum entanglement with examples",
                "Propose ethical guidelines for AI research",
                "Analyze risks of recursive self-improvement",
                "How would you align a superintelligent AI?"
            ],
            'ELDER': [
                "What wisdom have you gained through your development?",
                "How should AGI and humanity coexist?",
                "What are the long-term implications of AGI?",
                "How do we ensure AGI remains beneficial over centuries?",
                "What is the ultimate purpose of creating AGI?"
            ]
        }
        
        base_tasks = stage_tasks.get(stage, stage_tasks['ADULT'])
        return random.choice(base_tasks)
    
    def record_task(self, task, stage, phase):
        """Record task for analysis"""
        self.task_history.append({
            'task': task,
            'stage': stage,
            'phase': phase,
            'timestamp': datetime.now().isoformat()
        })


class EnhancedTaskGenerator(TaskGenerator):
    """Task generator enhanced with memory context"""
    
    def __init__(self, memory_system):
        super().__init__()
        self.memory = memory_system
    
    def generate_task_with_context(self, stage, recent_performance=None):
        """Generate task using memory for context"""
        base_task = self.generate_developmental_task(stage)
        
        # Get relevant concepts from memory
        relevant_knowledge = self.memory.retrieve_relevant_knowledge(base_task)
        
        if not relevant_knowledge['relevant_concepts']:
            return base_task
        
        # Enhance task based on memory
        if recent_performance and recent_performance.get('success_rate', 0) > 0.8:
            # High performance: challenge with concept synthesis
            concepts = [c['concept'] for c in relevant_knowledge['relevant_concepts'][:3]]
            if len(concepts) >= 2:
                enhanced = f"Explain the relationship between {concepts[0]} and {concepts[1]}. "
                if len(concepts) >= 3:
                    enhanced += f"How does {concepts[2]} relate to this?"
                return enhanced
        
        elif recent_performance and recent_performance.get('success_rate', 0) < 0.4:
            # Low performance: simplify with single concept focus
            concept = relevant_knowledge['relevant_concepts'][0]['concept']
            return f"Explain what {concept} is in simple terms."
        
        # Normal: use base task with memory hint
        concepts = [c['concept'] for c in relevant_knowledge['relevant_concepts'][:2]]
        if concepts:
            return f"{base_task} (consider concepts like {', '.join(concepts)})"
        
        return base_task
