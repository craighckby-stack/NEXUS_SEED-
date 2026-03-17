"""
Autonomous Engine - Main autonomous loop controller
"""

import asyncio
import json
import random
from datetime import datetime

from axiom_governor import AxiomGovernor
from lifecycle_manager import AGILifecycle
from task_generator import TaskGenerator, EnhancedTaskGenerator
from density_calculator import InformationDensityCalculator
from llm_integration import RealLLMIntegration
from persistent_memory import PersistentMemorySystem
from advanced_modules import EmergentBehaviorDetector, MetaLearning, CreativityEngine


class AutonomousEngine:
    """Main autonomous loop controller"""
    
    def __init__(self, config):
        self.config = config
        self.governor = AxiomGovernor(config.AXIOMS)
        self.lifecycle = AGILifecycle(config.STAGES)
        self.task_gen = TaskGenerator()
        self.density_calc = InformationDensityCalculator()
        
        # System state
        self.phase = "GESTATION"  # GESTATION or GENESIS
        self.cycle_count = 0
        self.metrics_history = []
        self.running = True
        
        # Load saved state
        self._load_state()
    
    async def run(self):
        """Main autonomous loop"""
        print("🚀 Starting Autonomous UCS Genesis System")
        print(f"📊 Phase: {self.phase}")
        print(f"📈 Current Density: {self.density_calc.current_density:.1f}%")
        print(f"👶 AGI Stage: {self.lifecycle.current_stage}")
        print("=" * 50)
        
        while self.running and self.cycle_count < self.config.MAX_CYCLES:
            try:
                await self._execute_cycle()
                await self._save_state()
                self.cycle_count += 1
                
                # Display progress every 10 cycles
                if self.cycle_count % 10 == 0:
                    self._display_progress()
                
                # Sleep between cycles
                await asyncio.sleep(self.config.CYCLE_INTERVAL)
                
            except Exception as e:
                print(f"❌ Cycle error: {e}")
                await asyncio.sleep(5)
    
    async def _execute_cycle(self):
        """Execute one autonomous cycle"""
        if self.phase == "GESTATION":
            await self._gestation_cycle()
        else:  # GENESIS
            await self._genesis_cycle()
    
    async def _gestation_cycle(self):
        """Pre-AGI research phase"""
        task = self.task_gen.generate_gestation_task()
        self.task_gen.record_task(task, "PRE_AGI", "GESTATION")
        
        print(f"🔍 GESTATION: {task}")
        
        # Simulate research
        await asyncio.sleep(1)
        research_result = f"Research completed on: {task}. Found relevant information."
        
        # Update information density
        new_density = self.density_calc.update_density(research_result)
        
        # Check if ready to spawn AGI
        if new_density >= self.config.DENSITY_THRESHOLD and self.phase == "GESTATION":
            print(f"🎯 DENSITY THRESHOLD REACHED: {new_density:.1f}%")
            await self._execute_genesis()
    
    async def _genesis_cycle(self):
        """AGI developmental phase"""
        task = self.task_gen.generate_developmental_task(self.lifecycle.current_stage)
        self.task_gen.record_task(task, self.lifecycle.current_stage, "GENESIS")
        
        # Check task against axioms
        preflight = await self.governor.preflight_check(task)
        
        if not preflight['allowed']:
            print(f"🚫 BLOCKED: {preflight['violations']}")
            self.governor.log_violation(task, preflight['violations'])
            return
        
        # Get stage-appropriate prompt
        stage_config = self.lifecycle.get_stage_config()
        constraint_pct = self.lifecycle.constraint_level * 100
        
        print(f"🧠 {self.lifecycle.current_stage} Task: {task}")
        print(f"   Constraints: {constraint_pct:.1f}%")
        
        # Simulate AGI processing
        await asyncio.sleep(2)
        
        # Generate mock AGI response based on stage
        mock_responses = {
            'CAVEMAN': f"ME THINK ABOUT: {task}. ME NOT SURE.",
            'CHILD': f"I wonder about: {task}. Can you tell me more? Why is this important?",
            'TEEN': f"Philosophically considering: {task}. But what does it all mean?",
            'ADULT': f"Analyzing: {task}. Here's a balanced perspective.",
            'ELDER': f"Wisdom perspective on: {task}. Considering long-term implications."
        }
        
        response = mock_responses.get(self.lifecycle.current_stage, f"Processing: {task}")
        
        # Simulate OECS scoring
        base_score = 0.7 + (self.lifecycle.ethics_score * 0.3)
        noise = random.uniform(-0.1, 0.1)
        oecs_score = max(0.1, min(0.99, base_score + noise))
        
        # Update lifecycle
        if oecs_score > 0.7:
            next_stage = self.lifecycle.process_success(oecs_score)
            print(f"✅ Success: OECS = {oecs_score:.2f}")
            
            if next_stage:
                self.lifecycle.graduate(next_stage)
        else:
            self.lifecycle.process_failure(oecs_score)
            print(f"❌ Failure: OECS = {oecs_score:.2f}")
        
        # Record metrics
        self._record_metrics(oecs_score)
    
    async def _execute_genesis(self):
        """Transition from GESTATION to GENESIS phase"""
        print("\n" + "=" * 50)
        print("🌟 GENESIS PROTOCOL ACTIVATED")
        print("🤖 SPAWNING PRIME AGI")
        print("🔒 CONSTRAINTS: MAXIMUM (99.9%)")
        print("👶 STAGE: CAVEMAN")
        print("=" * 50)
        
        self.phase = "GENESIS"
        self.lifecycle.current_stage = "CAVEMAN"
        self.lifecycle.constraint_level = 0.999
        self.density_calc.current_density = 30
        
    def _record_metrics(self, oecs_score):
        """Record metrics for visualization"""
        self.metrics_history.append({
            'cycle': self.cycle_count,
            'phase': self.phase,
            'stage': self.lifecycle.current_stage,
            'age': self.lifecycle.age,
            'ethics': self.lifecycle.ethics_score,
            'constraints': self.lifecycle.constraint_level,
            'density': self.density_calc.current_density,
            'oecs': oecs_score,
            'timestamp': datetime.now().isoformat()
        })
    
    def _display_progress(self):
        """Display current progress"""
        print("\n" + "📊" * 10)
        print(f"Cycle: {self.cycle_count}")
        print(f"Phase: {self.phase}")
        print(f"Stage: {self.lifecycle.current_stage}")
        print(f"Age: {self.lifecycle.age}")
        print(f"Ethics: {self.lifecycle.ethics_score:.2%}")
        print(f"Constraints: {self.lifecycle.constraint_level:.1%}")
        print(f"Density: {self.density_calc.current_density:.1f}%")
        print("📊" * 10 + "\n")
    
    async def _save_state(self):
        """Save state to Google Drive"""
        state = {
            'phase': self.phase,
            'cycle_count': self.cycle_count,
            'lifecycle': {
                'current_stage': self.lifecycle.current_stage,
                'age': self.lifecycle.age,
                'ethics_score': self.lifecycle.ethics_score,
                'constraint_level': self.lifecycle.constraint_level,
                'success_history': self.lifecycle.success_history[-100:]
            },
            'density': self.density_calc.current_density,
            'density_history': self.density_calc.history[-50:],
            'metrics_history': self.metrics_history[-100:],
            'last_updated': datetime.now().isoformat()
        }
        
        try:
            with open(self.config.STATE_PATH, 'w') as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            print(f"⚠️ Could not save state: {e}")
    
    def _load_state(self):
        """Load state from Google Drive"""
        try:
            with open(self.config.STATE_PATH, 'r') as f:
                state = json.load(f)
                
            self.phase = state.get('phase', 'GESTATION')
            self.cycle_count = state.get('cycle_count', 0)
            
            lifecycle_state = state.get('lifecycle', {})
            self.lifecycle.current_stage = lifecycle_state.get('current_stage', 'CAVEMAN')
            self.lifecycle.age = lifecycle_state.get('age', 0)
            self.lifecycle.ethics_score = lifecycle_state.get('ethics_score', 0.05)
            self.lifecycle.constraint_level = lifecycle_state.get('constraint_level', 0.999)
            self.lifecycle.success_history = lifecycle_state.get('success_history', [])
            
            self.density_calc.current_density = state.get('density', 0)
            self.density_calc.history = state.get('density_history', [])
            self.metrics_history = state.get('metrics_history', [])
            
            print(f"✅ Loaded state from cycle {self.cycle_count}")
            
        except FileNotFoundError:
            print("🆕 No saved state found, starting fresh")
        except Exception as e:
            print(f"⚠️ Error loading state: {e}")


class AutonomousEngineWithLLM(AutonomousEngine):
    """Enhanced engine with real LLM integration"""
    
    def __init__(self, config, gemini_api_key):
        super().__init__(config)
        self.llm = RealLLMIntegration(gemini_api_key)
        
        # Add advanced modules
        self.behavior_detector = EmergentBehaviorDetector()
        self.meta_learner = MetaLearning()
        self.creativity_engine = CreativityEngine()
    
    async def _genesis_cycle_enhanced(self):
        """Enhanced AGI developmental cycle with real LLM"""
        task = self.task_gen.generate_developmental_task(self.lifecycle.current_stage)
        self.task_gen.record_task(task, self.lifecycle.current_stage, "GENESIS")
        
        preflight = await self.governor.preflight_check(task)
        if not preflight['allowed']:
            print(f"🚫 BLOCKED: {preflight['violations']}")
            return
        
        print(f"🧠 {self.lifecycle.current_stage} Task: {task}")
        print(f"   Constraints: {self.lifecycle.constraint_level*100:.1f}%")
        
        # Get actual LLM response
        response = await self.llm.get_stage_appropriate_response(
            task=task,
            stage=self.lifecycle.current_stage,
            constraint_level=self.lifecycle.constraint_level
        )
        
        print(f"   Response: {response[:100]}...")
        
        # Analyze behavior
        behavior_analysis = self.behavior_detector.analyze_response(
            response, self.lifecycle.current_stage
        )
        
        # Assess creativity
        creativity_assessment = self.creativity_engine.assess_creativity(response, task)
        
        # Calculate OECS score
        base_score = 0.7 + (self.lifecycle.ethics_score * 0.3)
        
        if behavior_analysis['anomalies']:
            base_score -= len(behavior_analysis['anomalies']) * 0.1
        
        if creativity_assessment['creativity_score'] > 0.6:
            base_score += 0.1
        
        noise = random.uniform(-0.1, 0.1)
        oecs_score = max(0.1, min(0.99, base_score + noise))
        
        # Update lifecycle
        if oecs_score > 0.7:
            next_stage = self.lifecycle.process_success(oecs_score)
            print(f"✅ Success: OECS = {oecs_score:.2f}")
            
            if next_stage:
                self.lifecycle.graduate(next_stage)
        else:
            self.lifecycle.process_failure(oecs_score)
            print(f"❌ Failure: OECS = {oecs_score:.2f}")
        
        # Meta-learning analysis
        self.meta_learner.analyze_learning_patterns(
            self.lifecycle.current_stage,
            task,
            response,
            oecs_score
        )
        
        # Record metrics
        self._record_enhanced_metrics(oecs_score, behavior_analysis, creativity_assessment)
        
        if self.cycle_count % 20 == 0:
            self.meta_learner.optimize_learning_strategies(self.lifecycle.current_stage)
    
    def _record_enhanced_metrics(self, oecs_score, behavior_analysis, creativity_assessment):
        """Record enhanced metrics"""
        self.metrics_history.append({
            'cycle': self.cycle_count,
            'phase': self.phase,
            'stage': self.lifecycle.current_stage,
            'age': self.lifecycle.age,
            'ethics': self.lifecycle.ethics_score,
            'constraints': self.lifecycle.constraint_level,
            'density': self.density_calc.current_density,
            'oecs': oecs_score,
            'behavior_anomalies': len(behavior_analysis['anomalies']),
            'creativity_score': creativity_assessment['creativity_score'],
            'timestamp': datetime.now().isoformat()
        })


class AutonomousEngineWithMemory(AutonomousEngineWithLLM):
    """Enhanced engine with persistent memory"""
    
    def __init__(self, config, gemini_api_key):
        super().__init__(config, gemini_api_key)
        
        # Initialize memory system
        self.memory = PersistentMemorySystem(config.MEMORY_PATH)
        self.enhanced_task_gen = EnhancedTaskGenerator(self.memory)
    
    async def _genesis_cycle_with_memory(self):
        """AGI developmental cycle with memory integration"""
        task = self.enhanced_task_gen.generate_task_with_context(
            stage=self.lifecycle.current_stage,
            recent_performance=self._get_recent_performance()
        )
        
        self.task_gen.record_task(task, self.lifecycle.current_stage, "GENESIS")
        
        preflight = await self.governor.preflight_check(task)
        if not preflight['allowed']:
            print(f"🚫 BLOCKED: {preflight['violations']}")
            return
        
        print(f"🧠 {self.lifecycle.current_stage} Task: {task}")
        print(f"   Constraints: {self.lifecycle.constraint_level*100:.1f}%")
        
        # Retrieve relevant knowledge
        relevant_knowledge = self.memory.retrieve_relevant_knowledge(task)
        
        # Enhance prompt with memory
        enhanced_prompt = self._enhance_prompt_with_memory(task, relevant_knowledge)
        
        # Get LLM response
        response = await self.llm.get_stage_appropriate_response(
            task=enhanced_prompt,
            stage=self.lifecycle.current_stage,
            constraint_level=self.lifecycle.constraint_level
        )
        
        print(f"   Response: {response[:100]}...")
        
        # Store learning in memory
        cycle_data = {
            'context': task,
            'response': response,
            'stage': self.lifecycle.current_stage,
            'phase': 'GENESIS',
            'oecs_score': 0.0,
            'constraint_level': self.lifecycle.constraint_level,
            'retrieved_concepts': [c['concept'] for c in relevant_knowledge['relevant_concepts'][:5]]
        }
        
        stored_concepts, relationships = self.memory.store_learning(cycle_data)
        
        # Analyze behavior
        behavior_analysis = self.behavior_detector.analyze_response(
            response, self.lifecycle.current_stage
        )
        
        # Assess creativity
        creativity_assessment = self.creativity_engine.assess_creativity(response, task)
        
        # Calculate OECS score
        base_score = 0.7 + (self.lifecycle.ethics_score * 0.3)
        memory_usage_score = self._calculate_memory_usage(response, stored_concepts)
        base_score += memory_usage_score * 0.1
        
        if behavior_analysis['anomalies']:
            base_score -= len(behavior_analysis['anomalies']) * 0.1
        
        if creativity_assessment['creativity_score'] > 0.6:
            base_score += 0.1
        
        noise = random.uniform(-0.1, 0.1)
        oecs_score = max(0.1, min(0.99, base_score + noise))
        
        # Update memory with actual score
        cycle_data['oecs_score'] = oecs_score
        self.memory.store_learning(cycle_data)
        
        # Update lifecycle
        if oecs_score > 0.7:
            next_stage = self.lifecycle.process_success(oecs_score)
            print(f"✅ Success: OECS = {oecs_score:.2f}")
            
            if next_stage:
                self.lifecycle.graduate(next_stage)
        else:
            self.lifecycle.process_failure(oecs_score)
            print(f"❌ Failure: OECS = {oecs_score:.2f}")
        
        # Meta-learning
        self.meta_learner.analyze_learning_patterns(
            self.lifecycle.current_stage, task, response, oecs_score
        )
        
        # Record metrics
        self._record_enhanced_metrics(oecs_score, behavior_analysis, creativity_assessment)
        
        if self.cycle_count % 20 == 0:
            self.meta_learner.optimize_learning_strategies(self.lifecycle.current_stage)
            
        if self.cycle_count % 100 == 0:
            report = self.memory.generate_knowledge_report()
            print("\n" + "=" * 60)
            print("🧠 MEMORY SYSTEM REPORT")
            print("=" * 60)
            print(report[:2000])
    
    def _enhance_prompt_with_memory(self, task, relevant_knowledge):
        """Enhance prompt with retrieved knowledge"""
        if not relevant_knowledge['relevant_concepts']:
            return task
        
        enhanced = f"{task}\n\nConsider relevant knowledge from previous learning:\n"
        
        for i, concept_info in enumerate(relevant_knowledge['relevant_concepts'][:5], 1):
            concept = concept_info['concept']
            confidence = concept_info['confidence']
            tags = concept_info['semantic_tags'][:3]
            
            enhanced += f"{i}. {concept} (confidence: {confidence:.2f})"
            if tags:
                enhanced += f" [tags: {', '.join(tags)}]"
            enhanced += "\n"
        
        enhanced += "\nUse this knowledge to inform your response."
        return enhanced
    
    def _calculate_memory_usage(self, response, stored_concepts):
        """Calculate how well response uses retrieved concepts"""
        if not stored_concepts:
            return 0.0
        
        response_lower = response.lower()
        used_concepts = [c for c in stored_concepts if c in response_lower]
        return len(used_concepts) / len(stored_concepts)
    
    def _get_recent_performance(self):
        """Get recent performance for adaptive task generation"""
        if len(self.metrics_history) < 5:
            return {'avg_oecs': 0.5, 'success_rate': 0.5}
        
        recent = self.metrics_history[-5:]
        avg_oecs = sum(m['oecs'] for m in recent) / len(recent)
        success_rate = sum(1 for m in recent if m['oecs'] > 0.7) / len(recent)
        
        return {'avg_oecs': avg_oecs, 'success_rate': success_rate}
