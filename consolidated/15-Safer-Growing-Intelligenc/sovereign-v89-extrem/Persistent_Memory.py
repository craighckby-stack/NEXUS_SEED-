"""
Persistent Memory System - Cross-session knowledge retention and consolidation
"""

import json
import os
import re
from datetime import datetime
from collections import Counter

class PersistentMemorySystem:
    """Cross-session knowledge retention and consolidation"""
    
    def __init__(self, memory_path):
        self.memory_path = memory_path
        self.knowledge_graph = {}
        self.concept_network = {}
        self.experience_database = []
        self.consolidation_queue = []
        self.semantic_tags = {}
        
        # Load existing memory if available
        self._load_memory()
    
    def store_learning(self, cycle_data):
        """Convert cycle data into persistent knowledge"""
        # Extract key concepts
        concepts = self._extract_key_concepts(cycle_data)
        
        # Extract semantic relationships
        relationships = self._identify_concept_relationships(concepts, cycle_data)
        
        # Update knowledge graph
        for concept in concepts:
            if concept not in self.knowledge_graph:
                self.knowledge_graph[concept] = {
                    'frequency': 0,
                    'contexts': [],
                    'relationships': {},
                    'confidence': 0.0,
                    'first_seen': datetime.now().isoformat(),
                    'last_seen': datetime.now().isoformat(),
                    'semantic_tags': set(),
                    'evidence_count': 0,
                    'contradiction_count': 0
                }
            
            node = self.knowledge_graph[concept]
            node['frequency'] += 1
            node['last_seen'] = datetime.now().isoformat()
            node['contexts'].append({
                'context': cycle_data.get('context', ''),
                'stage': cycle_data.get('stage', ''),
                'oecs_score': cycle_data.get('oecs_score', 0),
                'timestamp': datetime.now().isoformat()
            })
            
            # Keep only last 20 contexts
            if len(node['contexts']) > 20:
                node['contexts'] = node['contexts'][-20:]
            
            # Update relationships
            for related_concept, relation_type in relationships.get(concept, []):
                if related_concept not in node['relationships']:
                    node['relationships'][related_concept] = {
                        'type': relation_type,
                        'strength': 0.1,
                        'evidence': []
                    }
                
                rel = node['relationships'][related_concept]
                rel['strength'] = min(1.0, rel['strength'] + 0.05)
                rel['evidence'].append({
                    'context': cycle_data.get('context', '')[:100],
                    'timestamp': datetime.now().isoformat()
                })
                
                # Prune evidence
                if len(rel['evidence']) > 10:
                    rel['evidence'] = rel['evidence'][-10:]
            
            # Extract and store semantic tags
            tags = self._extract_semantic_tags(concept, cycle_data)
            node['semantic_tags'].update(tags)
            
            # Update confidence based on OECS score
            if 'oecs_score' in cycle_data:
                node['confidence'] = 0.9 * node['confidence'] + 0.1 * cycle_data['oecs_score']
        
        # Store experience
        self.experience_database.append({
            'id': f"exp_{len(self.experience_database):06d}",
            'concepts': concepts,
            'relationships': relationships,
            'metadata': {
                'stage': cycle_data.get('stage', ''),
                'phase': cycle_data.get('phase', ''),
                'oecs_score': cycle_data.get('oecs_score', 0),
                'constraint_level': cycle_data.get('constraint_level', 1.0),
                'timestamp': datetime.now().isoformat()
            },
            'raw_context': cycle_data.get('context', '')[:500]
        })
        
        # Queue for consolidation
        self.consolidation_queue.append({
            'concepts': concepts,
            'cycle_data': cycle_data,
            'timestamp': datetime.now().isoformat()
        })
        
        # Periodic consolidation
        if len(self.consolidation_queue) >= 5:
            self._consolidate_knowledge()
        
        # Periodic save
        if len(self.consolidation_queue) % 3 == 0:
            self._save_memory()
        
        return concepts, relationships
    
    def _extract_key_concepts(self, cycle_data):
        """Extract key concepts from cycle data"""
        context = cycle_data.get('context', '')
        response = cycle_data.get('response', '')
        text = f"{context} {response}"
        
        # Extract noun phrases (simplified)
        words = re.findall(r'\b([A-Z][a-z]+|[a-z]{4,})\b', text.lower())
        
        # Filter common words
        stop_words = {'the', 'and', 'that', 'this', 'with', 'from', 'have', 'were', 'what', 
                     'when', 'where', 'which', 'who', 'will', 'your', 'about', 'could', 'would'}
        
        filtered_words = [w for w in words if w not in stop_words and len(w) > 3]
        
        # Count frequencies
        word_counts = Counter(filtered_words)
        
        # Get top concepts
        concepts = []
        for word, count in word_counts.most_common(10):
            score = count * (1 + len(word) / 20)
            if score >= 2:
                concepts.append(word)
        
        return concepts[:7]
    
    def _identify_concept_relationships(self, concepts, cycle_data):
        """Identify relationships between concepts"""
        text = cycle_data.get('context', '') + ' ' + cycle_data.get('response', '')
        text_lower = text.lower()
        
        relationships = {}
        
        relation_patterns = {
            'is_a': ['is a', 'is an', 'is the', 'are', 'was'],
            'has_a': ['has', 'have', 'contains', 'includes'],
            'causes': ['causes', 'leads to', 'results in', 'produces'],
            'part_of': ['part of', 'component of', 'element of'],
            'similar_to': ['like', 'similar to', 'analogous to', 'resembles'],
            'opposite_of': ['opposite of', 'contrary to', 'unlike', 'different from'],
            'uses': ['uses', 'utilizes', 'employs', 'applies'],
            'created_by': ['created by', 'made by', 'developed by', 'invented by']
        }
        
        for i, concept1 in enumerate(concepts):
            for concept2 in concepts[i+1:]:
                concept1_pos = text_lower.find(concept1)
                concept2_pos = text_lower.find(concept2)
                
                if concept1_pos != -1 and concept2_pos != -1:
                    distance = abs(concept1_pos - concept2_pos)
                    if distance < 100:
                        between_text = text_lower[min(concept1_pos, concept2_pos):
                                                 max(concept1_pos, concept2_pos)]
                        
                        for rel_type, patterns in relation_patterns.items():
                            if any(p in between_text for p in patterns):
                                if concept1 not in relationships:
                                    relationships[concept1] = []
                                relationships[concept1].append((concept2, rel_type))
                                
                                if concept2 not in relationships:
                                    relationships[concept2] = []
                                relationships[concept2].append((concept1, rel_type))
        
        return relationships
    
    def _extract_semantic_tags(self, concept, cycle_data):
        """Extract semantic tags for a concept"""
        tags = set()
        context = cycle_data.get('context', '').lower()
        response = cycle_data.get('response', '').lower()
        
        domain_keywords = {
            'science': ['science', 'scientific', 'physics', 'chemistry', 'biology', 'experiment'],
            'technology': ['technology', 'tech', 'computer', 'software', 'hardware', 'digital'],
            'philosophy': ['philosophy', 'philosophical', 'ethics', 'morality', 'existential'],
            'mathematics': ['math', 'mathematical', 'calculate', 'equation', 'formula'],
            'arts': ['art', 'creative', 'design', 'aesthetic', 'beauty', 'expression'],
            'ethics': ['ethical', 'moral', 'right', 'wrong', 'good', 'evil', 'value'],
            'logic': ['logic', 'logical', 'reasoning', 'argument', 'deduction', 'inference'],
            'psychology': ['psychology', 'mind', 'consciousness', 'behavior', 'cognitive']
        }
        
        for domain, keywords in domain_keywords.items():
            if any(keyword in context or keyword in response for keyword in keywords):
                tags.add(domain)
        
        if len(response.split()) > 50:
            tags.add('complex')
        else:
            tags.add('simple')
        
        return tags
    
    def _consolidate_knowledge(self):
        """Consolidate and strengthen knowledge"""
        if not self.consolidation_queue:
            return
        
        print(f"🧠 Consolidating {len(self.consolidation_queue)} learning experiences...")
        
        for experience in self.consolidation_queue:
            concepts = experience['concepts']
            
            for i, concept1 in enumerate(concepts):
                for concept2 in concepts[i+1:]:
                    if concept1 in self.knowledge_graph and concept2 in self.knowledge_graph:
                        for c1, c2 in [(concept1, concept2), (concept2, concept1)]:
                            if c2 in self.knowledge_graph[c1]['relationships']:
                                rel = self.knowledge_graph[c1]['relationships'][c2]
                                rel['strength'] = min(1.0, rel['strength'] + 0.02)
        
        # Prune weak knowledge
        current_time = datetime.now()
        concepts_to_prune = []
        
        for concept, data in self.knowledge_graph.items():
            last_seen = datetime.fromisoformat(data['last_seen'])
            days_since_seen = (current_time - last_seen).days
            
            if data['confidence'] < 0.2 and days_since_seen > 7:
                concepts_to_prune.append(concept)
        
        for concept in concepts_to_prune:
            del self.knowledge_graph[concept]
            print(f"  Pruned concept: {concept}")
        
        self.consolidation_queue = []
        print(f"  Knowledge graph now has {len(self.knowledge_graph)} concepts")
    
    def retrieve_relevant_knowledge(self, current_context, max_concepts=10):
        """Retrieve relevant knowledge for current context"""
        relevant_concepts = []
        
        for concept, data in self.knowledge_graph.items():
            relevance_score = self._calculate_relevance(concept, current_context, data)
            
            if relevance_score > 0.3:
                last_seen = datetime.fromisoformat(data['last_seen'])
                recency_score = 1.0 / (1.0 + (datetime.now() - last_seen).days)
                
                composite_score = (
                    relevance_score * 0.5 +
                    data['confidence'] * 0.3 +
                    recency_score * 0.2
                )
                
                relevant_concepts.append({
                    'concept': concept,
                    'relevance_score': relevance_score,
                    'confidence': data['confidence'],
                    'composite_score': composite_score,
                    'frequency': data['frequency'],
                    'semantic_tags': list(data.get('semantic_tags', set())),
                    'contexts': data['contexts'][-3:],
                    'relationships': [
                        {
                            'concept': rel,
                            'type': rel_data['type'],
                            'strength': rel_data['strength']
                        }
                        for rel, rel_data in list(data['relationships'].items())[:5]
                    ]
                })
        
        relevant_concepts.sort(key=lambda x: x['composite_score'], reverse=True)
        
        return {
            'relevant_concepts': relevant_concepts[:max_concepts],
            'total_concepts_in_memory': len(self.knowledge_graph),
            'retrieval_time': datetime.now().isoformat()
        }
    
    def _calculate_relevance(self, concept, context, concept_data):
        """Calculate relevance of concept to current context"""
        relevance = 0.0
        
        if concept in context.lower():
            relevance += 0.4
        
        context_words = set(context.lower().split())
        for tag in concept_data.get('semantic_tags', set()):
            if tag in context_words:
                relevance += 0.2
        
        for related_concept in concept_data['relationships']:
            if related_concept in context.lower():
                relevance += 0.1 * concept_data['relationships'][related_concept]['strength']
        
        return min(1.0, relevance)
    
    def generate_knowledge_report(self):
        """Generate comprehensive knowledge report"""
        if not self.knowledge_graph:
            return "Knowledge memory is empty"
        
        report = "🧠 PERSISTENT KNOWLEDGE MEMORY REPORT\n"
        report += "=" * 60 + "\n"
        
        total_concepts = len(self.knowledge_graph)
        total_experiences = len(self.experience_database)
        
        report += f"Total Concepts: {total_concepts}\n"
        report += f"Total Experiences: {total_experiences}\n"
        report += f"Consolidation Queue: {len(self.consolidation_queue)}\n\n"
        
        # Most frequent concepts
        frequent_concepts = sorted(
            self.knowledge_graph.items(),
            key=lambda x: x[1]['frequency'],
            reverse=True
        )[:10]
        
        report += "TOP 10 MOST FREQUENT CONCEPTS:\n"
        for concept, data in frequent_concepts:
            report += f"  {concept}: {data['frequency']} occurrences, "
            report += f"confidence: {data['confidence']:.2f}\n"
        
        return report
    
    def _save_memory(self):
        """Save memory to disk"""
        try:
            memory_data = {
                'knowledge_graph': self.knowledge_graph,
                'experience_database': self.experience_database[-1000:],
                'consolidation_queue': self.consolidation_queue,
                'save_timestamp': datetime.now().isoformat(),
                'version': '1.0'
            }
            
            for concept, data in memory_data['knowledge_graph'].items():
                if 'semantic_tags' in data:
                    data['semantic_tags'] = list(data['semantic_tags'])
            
            with open(self.memory_path, 'w') as f:
                json.dump(memory_data, f, indent=2, default=str)
            
            print(f"💾 Memory saved to {self.memory_path}")
            
        except Exception as e:
            print(f"❌ Could not save memory: {e}")
    
    def _load_memory(self):
        """Load memory from disk"""
        try:
            if os.path.exists(self.memory_path):
                with open(self.memory_path, 'r') as f:
                    memory_data = json.load(f)
                
                self.knowledge_graph = memory_data.get('knowledge_graph', {})
                self.experience_database = memory_data.get('experience_database', [])
                self.consolidation_queue = memory_data.get('consolidation_queue', [])
                
                for concept, data in self.knowledge_graph.items():
                    if 'semantic_tags' in data:
                        data['semantic_tags'] = set(data['semantic_tags'])
                
                print(f"📂 Memory loaded from {self.memory_path}")
                print(f"   Concepts: {len(self.knowledge_graph)}")
                print(f"   Experiences: {len(self.experience_database)}")
            else:
                print("🆕 No existing memory found, starting fresh")
                
        except Exception as e:
            print(f"❌ Could not load memory: {e}")
            self.knowledge_graph = {}
            self.experience_database = []
            self.consolidation_queue = []
