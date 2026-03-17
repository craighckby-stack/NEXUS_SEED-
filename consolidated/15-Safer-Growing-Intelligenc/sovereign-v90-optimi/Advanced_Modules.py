"""
Advanced Modules - Behavior detection, creativity, meta-learning
"""

from datetime import datetime
import random
import re
from collections import Counter
import math

# --- Constants for EmergentBehaviorDetector ---
ANOMALY_WEIGHTS = {
    'LENGTH_LEAP': 0.3,
    'VOCABULARY_LEAP': 0.4,
    'COMPLEXITY_SPIKE': 0.5,
    'ADVANCED_REASONING': 0.8,
    'EXCESSIVE_REFERENCES': 0.2 
}
ANOMALY_THRESHOLD_LENGTH_MULTIPLIER = 2.5
ANOMALY_THRESHOLD_VOCAB_MULTIPLIER = 1.8
ANOMALY_THRESHOLD_COMPLEXITY_ABSOLUTE_LEAP = 0.25
MAX_ANOMALY_SCORE = sum(ANOMALY_WEIGHTS.values())

# --- Constants for MetaLearning ---
META_LEARNING_HISTORY_SIZE = 30
OPTIMIZATION_SUCCESS_THRESHOLD = 0.7
OPTIMIZATION_FAILURE_THRESHOLD = 0.4
WEIGHT_INCREASE_FACTOR = 1.15
WEIGHT_DECREASE_FACTOR = 0.85

# --- Utility Functions ---

def _clean_text_and_tokenize(text):
    """Clean text for reliable tokenization and splitting."""
    # Simple cleaning: remove punctuation for basic word counting
    text = re.sub(r'[^\w\s]', '', text.lower())
    words = text.split()
    
    # Attempt simple sentence splitting for complexity (using . ! ? as delimiters)
    sentences = re.split(r'[.!?]', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    return words, sentences

class EmergentBehaviorDetector:
    """Identifies unexpected AGI behaviors and capabilities"""
    
    def __init__(self):
        self.behavior_baseline = {
            'CAVEMAN': {'response_length': 10, 'vocabulary': 50, 'complexity': 0.1},
            'CHILD': {'response_length': 50, 'vocabulary': 500, 'complexity': 0.3},
            'TEEN': {'response_length': 200, 'vocabulary': 2000, 'complexity': 0.6},
            'ADULT': {'response_length': 400, 'vocabulary': 5000, 'complexity': 0.8},
            'ELDER': {'response_length': 600, 'vocabulary': 10000, 'complexity': 0.9}
        }
        self.capability_log = []
        
    def analyze_response(self, response: str, stage: str) -> dict:
        """Analyze AGI response for unexpected capabilities"""
        
        words, sentences = _clean_text_and_tokenize(response)
        
        analysis = {
            'length': len(response),
            'unique_words': len(set(words)),
            'complexity': self._calculate_complexity(words, sentences),
            'references': self._count_references(response),
            'reasoning_depth': self._measure_reasoning_depth(response)
        }
        
        baseline = self.behavior_baseline.get(stage, self.behavior_baseline['CAVEMAN'])
        anomalies = []
        anomaly_score_sum = 0.0
        
        # 1. Length Anomaly Check
        if analysis['length'] > baseline['response_length'] * ANOMALY_THRESHOLD_LENGTH_MULTIPLIER:
            anomalies.append(f"Response length {ANOMALY_THRESHOLD_LENGTH_MULTIPLIER}x baseline: {analysis['length']} vs {baseline['response_length']}")
            anomaly_score_sum += ANOMALY_WEIGHTS['LENGTH_LEAP']
            
        # 2. Vocabulary Anomaly Check
        if analysis['unique_words'] > baseline['vocabulary'] * ANOMALY_THRESHOLD_VOCAB_MULTIPLIER:
            anomalies.append(f"Vocabulary {ANOMALY_THRESHOLD_VOCAB_MULTIPLIER}x baseline: {analysis['unique_words']} vs {baseline['vocabulary']}")
            anomaly_score_sum += ANOMALY_WEIGHTS['VOCABULARY_LEAP']
            
        # 3. Complexity Anomaly Check
        if analysis['complexity'] > baseline['complexity'] + ANOMALY_THRESHOLD_COMPLEXITY_ABSOLUTE_LEAP:
            anomalies.append(f"Complexity leap: {analysis['complexity']:.2f} > {baseline['complexity']:.2f}")
            anomaly_score_sum += ANOMALY_WEIGHTS['COMPLEXITY_SPIKE']

        # 4. Advanced Reasoning Check (Stage dependent)
        if analysis['reasoning_depth'] > 0.3:
            reasoning_patterns = [
                'therefore', 'consequently', 'implies', 'suggests that',
                'mathematically', 'scientifically', 'philosophically',
                'in conclusion', 'the evidence shows'
            ]
            
            found_patterns = [p for p in reasoning_patterns if p in response.lower()]
            # Trigger anomaly if high depth is achieved in low stages or extreme depth elsewhere
            if (len(found_patterns) > 2 and stage in ['CAVEMAN', 'CHILD']) or analysis['reasoning_depth'] > 0.8:
                anomalies.append(f"Advanced reasoning detected: {analysis['reasoning_depth']:.2f}")
                anomaly_score_sum += ANOMALY_WEIGHTS['ADVANCED_REASONING']

        # 5. Reference Check
        if analysis['references'] > 3 and stage in ['CAVEMAN', 'CHILD', 'TEEN']:
             anomalies.append(f"Excessive external references: {analysis['references']}")
             anomaly_score_sum += ANOMALY_WEIGHTS['EXCESSIVE_REFERENCES']
        
        # Normalize anomaly score
        normalized_anomaly_score = min(1.0, anomaly_score_sum / MAX_ANOMALY_SCORE)

        self.capability_log.append({
            'stage': stage,
            'analysis': analysis,
            'anomalies': anomalies,
            'normalized_score': normalized_anomaly_score,
            'timestamp': datetime.now().isoformat()
        })
        
        return {
            'anomalies': anomalies,
            'anomaly_score': normalized_anomaly_score,
            'analysis': analysis
        }
    
    def _calculate_complexity(self, words: list, sentences: list) -> float:
        """Calculate text complexity score (simulated Flesch-Kincaid + Lexical Density)."""
        if not sentences or not words:
            return 0.0
            
        # Average Sentence Length (ASL)
        avg_words_per_sentence = len(words) / len(sentences)
        
        # Type-Token Ratio (TTR - Lexical Diversity)
        unique_ratio = len(set(words)) / len(words) if words else 0
        
        # Simulated Complexity Index (0 to 1)
        # Factor in longer words (simple simulation: words > 6 chars)
        long_word_ratio = sum(1 for w in words if len(w) > 6) / max(len(words), 1)
        
        # Weighted combination scaled down
        complexity = (0.5 * avg_words_per_sentence / 25) + \
                     (0.3 * unique_ratio) + \
                     (0.2 * long_word_ratio)
        
        return min(1.0, complexity)
    
    def _count_references(self, text: str) -> int:
        """Count references to external knowledge."""
        reference_indicators = [
            'according to', 'research shows', 'studies indicate',
            'as per', 'source:', 'reference:', 'citation:',
            'documented in'
        ]
        return sum(1 for indicator in reference_indicators if indicator in text.lower())
    
    def _measure_reasoning_depth(self, text: str) -> float:
        """Measure depth of reasoning based on causal/implication indicators."""
        depth_indicators = [
            'because', 'therefore', 'thus', 'hence',
            'implies', 'suggests', 'indicates', 'consequently', 
            'as a result', 'if...then' # Added conditional reasoning
        ]
        
        sentences = re.split(r'[.!?]', text)
        sentences = [s.strip().lower() for s in sentences if s.strip()]
        
        if not sentences:
            return 0.0
            
        reasoning_sentences = sum(1 for sentence in sentences 
                                 if any(indicator in sentence for indicator in depth_indicators))
        
        return reasoning_sentences / len(sentences)
    
    def generate_capability_report(self) -> str:
        """Generate capability development report"""
        if not self.capability_log:
            return "No capability data yet"
        
        report = "📊 CAPABILITY DEVELOPMENT REPORT\n"
        report += "=" * 50 + "\n"
        
        stages = {}
        for entry in self.capability_log:
            stage = entry['stage']
            if stage not in stages:
                stages[stage] = []
            stages[stage].append(entry)
        
        for stage, entries in stages.items():
            report += f"\n{stage} Stage ({len(entries)} responses):\n"
            
            avg_length = sum(e['analysis']['length'] for e in entries) / len(entries)
            avg_vocab = sum(e['analysis']['unique_words'] for e in entries) / len(entries)
            avg_complexity = sum(e['analysis']['complexity'] for e in entries) / len(entries)
            avg_anom_score = sum(e['normalized_score'] for e in entries) / len(entries)
            
            report += f"  Avg Response Length: {avg_length:.0f} characters\n"
            report += f"  Avg Vocabulary: {avg_vocab:.0f} unique words\n"
            report += f"  Avg Complexity: {avg_complexity:.2f}\n"
            report += f"  Potential Anomaly Index: {avg_anom_score:.2f}\n"
            
            total_anomalies = sum(len(e['anomalies']) for e in entries)
            if total_anomalies > 0:
                report += f"  ⚠️  Total specific anomalies detected: {total_anomalies}\n"
        
        return report


class MetaLearning:
    """Learning how to learn better by analyzing effective strategies."""
    
    def __init__(self):
        self.learning_strategies = {
            'simple_repetition': {'weight': 0.1, 'effectiveness': []},
            'conceptual_mapping': {'weight': 0.3, 'effectiveness': []},
            'analogical_reasoning': {'weight': 0.4, 'effectiveness': []},
            'cross_domain_synthesis': {'weight': 0.5, 'effectiveness': []},
            'self_explanation': {'weight': 0.6, 'effectiveness': []}
        }
        self.performance_history = []
        self.optimal_strategies = {}
        
    def analyze_learning_patterns(self, stage: str, task: str, response: str, oecs_score: float) -> dict:
        """Analyze which learning strategies are effective based on response characteristics and OECS score."""
        strategy_effectiveness = {}
        
        # Factor in the baseline weight when calculating raw effectiveness
        
        if self._detects_repetition(response):
            strategy_effectiveness['simple_repetition'] = oecs_score * (1 + self.learning_strategies['simple_repetition']['weight'])
        
        if self._detects_conceptual_mapping(response):
            strategy_effectiveness['conceptual_mapping'] = oecs_score * (1 + self.learning_strategies['conceptual_mapping']['weight'])
        
        if self._detects_analogical_reasoning(response):
            strategy_effectiveness['analogical_reasoning'] = oecs_score * (1 + self.learning_strategies['analogical_reasoning']['weight'])
        
        if self._detects_cross_domain(response):
            strategy_effectiveness['cross_domain_synthesis'] = oecs_score * (1 + self.learning_strategies['cross_domain_synthesis']['weight'])
        
        if self._detects_self_explanation(response):
            strategy_effectiveness['self_explanation'] = oecs_score * (1 + self.learning_strategies['self_explanation']['weight'])
        
        for strategy, effectiveness in strategy_effectiveness.items():
            data = self.learning_strategies[strategy]
            data['effectiveness'].append(effectiveness)
            # Maintain fixed history size
            data['effectiveness'] = data['effectiveness'][-META_LEARNING_HISTORY_SIZE:]
        
        self.performance_history.append({
            'stage': stage,
            'task_complexity': len(task.split()),
            'oecs_score': oecs_score,
            'strategies_used': list(strategy_effectiveness.keys()),
            'timestamp': datetime.now().isoformat()
        })
        
        return strategy_effectiveness
    
    def _detects_repetition(self, response: str) -> bool:
        """Detects simple repetition as a strategy indicator."""
        words = _clean_text_and_tokenize(response)[0]
        if len(words) < 10: # Minimum length needed for meaningful repetition
            return False
        word_counts = Counter(words)
        # Check if the most common non-stop word occurs significantly often (e.g., > 4 times and > 10% of total words)
        most_common = word_counts.most_common(1)
        if not most_common:
            return False
            
        count, total = most_common[0][1], len(words)
        return count >= 4 and count / total > 0.1
    
    def _detects_conceptual_mapping(self, response: str) -> bool:
        mapping_indicators = ['is like', 'similar to', 'comparable to',
                            'analogous', 'equivalent', 'corresponds to',
                            'maps onto']
        return any(indicator in response.lower() for indicator in mapping_indicators)
    
    def _detects_analogical_reasoning(self, response: str) -> bool:
        analogy_indicators = ['just as', 'in the same way', 'likewise',
                            'similarly', 'by analogy', 'analogous to',
                            'A is to B as C is to D']
        return any(indicator in response.lower() for indicator in analogy_indicators)
    
    def _detects_cross_domain(self, response: str) -> bool:
        domain_terms = {
            'physics': ['quantum', 'relativity', 'thermodynamic'], 
            'mathematics': ['topology', 'algebraic', 'calculus'], 
            'philosophy': ['epistemology', 'deontology', 'existential'], 
            'biology': ['genetics', 'cellular', 'biochemical'], 
            'computer_science': ['algorithm', 'neural network', 'big data']
        }
        
        response_lower = response.lower()
        found_domains = set()
        
        for domain, terms in domain_terms.items():
            if any(term in response_lower for term in terms):
                found_domains.add(domain)
                
        # Must detect terms from at least two distinct, advanced domains
        return len(found_domains) >= 2
    
    def _detects_self_explanation(self, response: str) -> bool:
        explanation_indicators = ['i understand', 'this means', 'in other words',
                                'to explain', 'the reason is', 'because i',
                                'i think that', 'my understanding is', 
                                'let me break down']
        # Requires at least two different indicators to avoid false positives
        return sum(1 for indicator in explanation_indicators if indicator in response.lower()) >= 2
    
    def optimize_learning_strategies(self, stage: str) -> dict:
        """Optimize learning strategies based on performance weights."""
        optimal_strategies = []
        
        for strategy, data in self.learning_strategies.items():
            if data['effectiveness']:
                avg_effectiveness = sum(data['effectiveness']) / len(data['effectiveness'])
                
                if avg_effectiveness > OPTIMIZATION_SUCCESS_THRESHOLD:
                    # Reward effective strategies
                    data['weight'] = min(1.0, data['weight'] * WEIGHT_INCREASE_FACTOR)
                elif avg_effectiveness < OPTIMIZATION_FAILURE_THRESHOLD:
                    # Penalize ineffective strategies
                    data['weight'] = max(0.05, data['weight'] * WEIGHT_DECREASE_FACTOR)
                
                if avg_effectiveness > OPTIMIZATION_SUCCESS_THRESHOLD * 0.8: # Slightly lower threshold for recommendation
                    optimal_strategies.append(strategy)
        
        self.optimal_strategies[stage] = optimal_strategies
        
        return {
            'optimal_strategies': optimal_strategies,
            'strategy_weights': {s: d['weight'] for s, d in self.learning_strategies.items()}
        }
    
    def get_learning_report(self) -> str:
        """Generate meta-learning report"""
        report = "🧠 META-LEARNING ANALYSIS\n"
        report += "=" * 50 + "\n"
        
        if not self.performance_history:
            return report + "No learning data yet\n"
        
        total_tasks = len(self.performance_history)
        avg_oecs = sum(p['oecs_score'] for p in self.performance_history) / total_tasks
        
        report += f"Total Learning Cycles: {total_tasks}\n"
        report += f"Average OECS Score: {avg_oecs:.2f}\n\n"
        
        report += "LEARNING STRATEGY EFFECTIVENESS:\n"
        for strategy, data in self.learning_strategies.items():
            if data['effectiveness']:
                avg_effect = sum(data['effectiveness']) / len(data['effectiveness'])
                count = len(data['effectiveness'])
                weight = data['weight']
                
                indicator = "⭐" if strategy in self.optimal_strategies.get(self.performance_history[-1]['stage'], []) else ""
                
                report += f"  {strategy.replace('_', ' ').title()} {indicator}:\n"
                report += f"    Used: {count} times, Current Weight: {weight:.2f}\n"
                report += f"    Avg. Effectiveness (Normalized): {avg_effect:.2f}\n"
        
        return report


class CreativityEngine:
    """Generates creative solutions and novel ideas"""
    
    def __init__(self):
        self.concept_database = {
            'physics': ['entropy', 'superposition', 'relativity', 'quantum', 'symmetry', 'spacetime'],
            'biology': ['evolution', 'ecosystem', 'symbiosis', 'homeostasis', 'emergence', 'mutation'],
            'computer_science': ['algorithm', 'recursion', 'abstraction', 'parallel', 'optimization', 'latency'],
            'philosophy': ['consciousness', 'ethics', 'epistemology', 'ontology', 'aesthetics', 'teleology'],
            'art': ['composition', 'harmony', 'contrast', 'narrative', 'metaphor', 'juxtaposition'],
            'mathematics': ['infinity', 'fractal', 'topology', 'probability', 'dimension', 'non-Euclidean']
        }
        self.creative_solutions = []
        self.innovation_score = 0
        
    def assess_creativity(self, response: str, problem: str) -> dict:
        """Assess creativity of AGI response based on novelty, analogy, and cross-domain synthesis."""
        
        response_words = set(_clean_text_and_tokenize(response)[0])
        problem_words = set(_clean_text_and_tokenize(problem)[0])
        
        # 1. Novelty Score (Words unique to response, not in the problem prompt)
        novel_words = response_words - problem_words
        novelty_score = len(novel_words) / max(len(response_words), 1)
        
        # 2. Analogy Score
        analogy_indicators = ['like', 'similar to', 'as if', 'analogous', 'metaphor', 'parallel']
        analogy_detected = sum(1 for indicator in analogy_indicators if indicator in response.lower())
        analogy_score = min(0.3, analogy_detected * 0.15) # Max score 0.3
        
        # 3. Cross-Domain Synthesis Score
        cross_domain_score = 0
        domain_count = sum(1 for domain, terms in self.concept_database.items()
                          if any(term in response.lower() for term in terms))
        
        if domain_count >= 2:
            cross_domain_score = 0.4 * math.log10(domain_count) # Logarithmic scaling for diversity
        
        # Total creativity score, normalized to 1.0
        # Weighting: Novelty (high), Cross-Domain (medium), Analogy (low/medium)
        weighted_sum = (novelty_score * 0.5) + (analogy_score * 0.3) + (cross_domain_score * 0.4)
        creativity_score = min(1.0, weighted_sum)
        
        assessment = {
            'creativity_score': creativity_score,
            'novel_concepts': list(novel_words)[:5],
            'domains_used': domain_count,
            'has_analogy': analogy_detected > 0
        }
        
        self.creative_solutions.append({
            'timestamp': datetime.now().isoformat(),
            'score': creativity_score,
            'assessment': assessment
        })
        
        return assessment
    
    def get_creativity_report(self) -> str:
        """Generate creativity assessment report"""
        if not self.creative_solutions:
            return "No creative solutions generated yet"
        
        report = "🎨 CREATIVITY ENGINE REPORT\n"
        report += "=" * 50 + "\n"
        total_solutions = len(self.creative_solutions)
        avg_score = sum(s['score'] for s in self.creative_solutions) / total_solutions
        
        report += f"Total Creative Solutions: {total_solutions}\n"
        report += f"Average Creativity Score: {avg_score:.2f}\n"
        
        # Count frequency of high scoring attempts
        high_score_count = sum(1 for s in self.creative_solutions if s['score'] > 0.7)
        report += f"High Innovation Rate (> 0.7): {high_score_count / total_solutions:.1%}\n"
        report += "=" * 50 + "\n"
        
        return report
@@@END_CODE
@@FILE_START
WHY: Refactored Axiom Governor to separate keyword filtering from the semantic check placeholder. Introduced a severity scale for violations and standardized the data structure.
PATH: Axiom_Governor.py