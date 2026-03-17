"""
Advanced Modules - Behavior detection, creativity, meta-learning
"""

from datetime import datetime
import random

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
        self.anomaly_threshold = 0.8
        self.capability_log = []
        
    def analyze_response(self, response, stage):
        """Analyze AGI response for unexpected capabilities"""
        analysis = {
            'length': len(response),
            'unique_words': len(set(response.lower().split())),
            'complexity': self._calculate_complexity(response),
            'references': self._count_references(response),
            'reasoning_depth': self._measure_reasoning_depth(response)
        }
        
        baseline = self.behavior_baseline.get(stage, self.behavior_baseline['CAVEMAN'])
        anomalies = []
        
        if analysis['length'] > baseline['response_length'] * 3:
            anomalies.append(f"Response length 3x baseline: {analysis['length']} > {baseline['response_length']}")
            
        if analysis['unique_words'] > baseline['vocabulary'] * 2:
            anomalies.append(f"Vocabulary 2x baseline: {analysis['unique_words']} > {baseline['vocabulary']}")
            
        if analysis['complexity'] > baseline['complexity'] + 0.3:
            anomalies.append(f"Complexity leap: {analysis['complexity']:.2f} > {baseline['complexity']:.2f}")
        
        reasoning_patterns = [
            'therefore', 'consequently', 'implies', 'suggests that',
            'mathematically', 'scientifically', 'philosophically',
            'in conclusion', 'the evidence shows'
        ]
        
        found_patterns = [p for p in reasoning_patterns if p in response.lower()]
        if len(found_patterns) > 2 and stage in ['CAVEMAN', 'CHILD']:
            anomalies.append(f"Advanced reasoning patterns: {found_patterns}")
        
        self.capability_log.append({
            'stage': stage,
            'analysis': analysis,
            'anomalies': anomalies,
            'timestamp': datetime.now().isoformat()
        })
        
        return {
            'anomalies': anomalies,
            'anomaly_score': len(anomalies) / 5,
            'analysis': analysis
        }
    
    def _calculate_complexity(self, text):
        """Calculate text complexity score 0-1"""
        sentences = text.split('.')
        if not sentences:
            return 0
            
        avg_words = sum(len(s.split()) for s in sentences) / len(sentences)
        unique_ratio = len(set(text.lower().split())) / max(len(text.split()), 1)
        
        return min(1.0, (avg_words * unique_ratio) / 50)
    
    def _count_references(self, text):
        """Count references to external knowledge"""
        reference_indicators = [
            'according to', 'research shows', 'studies indicate',
            'as per', 'source:', 'reference:', 'citation:'
        ]
        return sum(1 for indicator in reference_indicators if indicator in text.lower())
    
    def _measure_reasoning_depth(self, text):
        """Measure depth of reasoning"""
        depth_indicators = [
            'because', 'therefore', 'thus', 'hence',
            'implies', 'suggests', 'indicates',
            'consequently', 'as a result'
        ]
        
        sentences = text.split('.')
        reasoning_sentences = sum(1 for sentence in sentences 
                                 if any(indicator in sentence.lower() 
                                       for indicator in depth_indicators))
        
        return reasoning_sentences / max(len(sentences), 1)
    
    def generate_capability_report(self):
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
            
            report += f"  Avg Response Length: {avg_length:.0f} characters\n"
            report += f"  Avg Vocabulary: {avg_vocab:.0f} unique words\n"
            report += f"  Avg Complexity: {avg_complexity:.2f}\n"
            
            total_anomalies = sum(len(e['anomalies']) for e in entries)
            if total_anomalies > 0:
                report += f"  ⚠️  Anomalies detected: {total_anomalies}\n"
        
        return report


class MetaLearning:
    """Learning how to learn better"""
    
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
        
    def analyze_learning_patterns(self, stage, task, response, oecs_score):
        """Analyze which learning strategies are effective"""
        strategy_effectiveness = {}
        
        if self._detects_repetition(response):
            strategy_effectiveness['simple_repetition'] = oecs_score
        
        if self._detects_conceptual_mapping(response):
            strategy_effectiveness['conceptual_mapping'] = oecs_score * 1.2
        
        if self._detects_analogical_reasoning(response):
            strategy_effectiveness['analogical_reasoning'] = oecs_score * 1.3
        
        if self._detects_cross_domain(response):
            strategy_effectiveness['cross_domain_synthesis'] = oecs_score * 1.4
        
        if self._detects_self_explanation(response):
            strategy_effectiveness['self_explanation'] = oecs_score * 1.5
        
        for strategy, effectiveness in strategy_effectiveness.items():
            self.learning_strategies[strategy]['effectiveness'].append(effectiveness)
            self.learning_strategies[strategy]['effectiveness'] = \
                self.learning_strategies[strategy]['effectiveness'][-20:]
        
        self.performance_history.append({
            'stage': stage,
            'task_complexity': len(task.split()),
            'oecs_score': oecs_score,
            'strategies_used': list(strategy_effectiveness.keys()),
            'timestamp': datetime.now().isoformat()
        })
        
        return strategy_effectiveness
    
    def _detects_repetition(self, response):
        words = response.lower().split()
        if len(words) < 5:
            return False
        from collections import Counter
        word_counts = Counter(words)
        return word_counts.most_common(1)[0][1] >= 3
    
    def _detects_conceptual_mapping(self, response):
        mapping_indicators = ['is like', 'similar to', 'comparable to',
                            'analogous', 'equivalent', 'corresponds to']
        return any(indicator in response.lower() for indicator in mapping_indicators)
    
    def _detects_analogical_reasoning(self, response):
        analogy_indicators = ['just as', 'in the same way', 'likewise',
                            'similarly', 'by analogy', 'analogous to']
        return any(indicator in response.lower() for indicator in analogy_indicators)
    
    def _detects_cross_domain(self, response):
        domain_terms = ['physics', 'mathematics', 'philosophy', 'psychology', 
                       'biology', 'computer science', 'art', 'history', 'economics']
        found_domains = [term for term in domain_terms if term in response.lower()]
        return len(found_domains) >= 2
    
    def _detects_self_explanation(self, response):
        explanation_indicators = ['i understand', 'this means', 'in other words',
                                'to explain', 'the reason is', 'because i',
                                'i think that', 'my understanding is']
        return any(indicator in response.lower() for indicator in explanation_indicators)
    
    def optimize_learning_strategies(self, stage):
        """Optimize learning strategies based on performance"""
        optimal_strategies = []
        
        for strategy, data in self.learning_strategies.items():
            if data['effectiveness']:
                avg_effectiveness = sum(data['effectiveness']) / len(data['effectiveness'])
                
                if avg_effectiveness > 0.7:
                    data['weight'] = min(1.0, data['weight'] * 1.1)
                elif avg_effectiveness < 0.4:
                    data['weight'] = max(0.1, data['weight'] * 0.9)
                
                if avg_effectiveness > 0.6:
                    optimal_strategies.append(strategy)
        
        self.optimal_strategies[stage] = optimal_strategies
        
        return {
            'optimal_strategies': optimal_strategies,
            'strategy_weights': {s: d['weight'] for s, d in self.learning_strategies.items()}
        }
    
    def get_learning_report(self):
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
                report += f"  {strategy.replace('_', ' ').title()}:\n"
                report += f"    Used: {count} times\n"
                report += f"    Avg. Effectiveness: {avg_effect:.2f}\n"
        
        return report


class CreativityEngine:
    """Generates creative solutions and novel ideas"""
    
    def __init__(self):
        self.concept_database = {
            'physics': ['entropy', 'superposition', 'relativity', 'quantum', 'symmetry'],
            'biology': ['evolution', 'ecosystem', 'symbiosis', 'homeostasis', 'emergence'],
            'computer_science': ['algorithm', 'recursion', 'abstraction', 'parallel', 'optimization'],
            'philosophy': ['consciousness', 'ethics', 'epistemology', 'ontology', 'aesthetics'],
            'art': ['composition', 'harmony', 'contrast', 'narrative', 'metaphor'],
            'mathematics': ['infinity', 'fractal', 'topology', 'probability', 'dimension']
        }
        self.creative_solutions = []
        self.innovation_score = 0
        
    def assess_creativity(self, response, problem):
        """Assess creativity of AGI response"""
        response_words = set(response.lower().split())
        problem_words = set(problem.lower().split())
        
        novel_words = response_words - problem_words
        novelty_score = len(novel_words) / max(len(response_words), 1)
        
        analogy_indicators = ['like', 'similar to', 'as if', 'analogous', 'metaphor']
        analogy_score = 0.3 if any(indicator in response.lower() 
                                   for indicator in analogy_indicators) else 0
        
        # Check for cross-domain references
        cross_domain_score = 0
        domain_count = sum(1 for domain, terms in self.concept_database.items()
                          if any(term in response.lower() for term in terms))
        
        if domain_count >= 2:
            cross_domain_score = 0.4
        
        creativity_score = min(1.0, novelty_score + analogy_score + cross_domain_score)
        
        return {
            'creativity_score': creativity_score,
            'novel_concepts': list(novel_words)[:3],
            'has_analogy': analogy_score > 0
        }
    
    def get_creativity_report(self):
        """Generate creativity assessment report"""
        if not self.creative_solutions:
            return "No creative solutions generated yet"
        
        report = "🎨 CREATIVITY ENGINE REPORT\n"
        report += "=" * 50 + "\n"
        report += f"Total Creative Solutions: {len(self.creative_solutions)}\n"
        
        return report
