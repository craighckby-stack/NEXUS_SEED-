import asyncio
import json
import time
import random
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional

# --- Dependency Imports ---
# These libraries would need to be installed:
# pip install sentence-transformers scikit-learn
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# --- Base Class Stubs ---
# Added minimal stubs for base classes to make the code syntactically valid.

class EnhancedExternalTool:
    """Minimal stub for the base External Tool class."""
    def __init__(self, name: str, rate_limit_sec: float = 1.0):
        self.name = name
        self.rate_limit_sec = rate_limit_sec

    async def _call_perspective_api(self, perspective_name: str, query: str) -> Dict[str, Any]:
        """Simulate the base API call."""
        print(f"[STUB] Base tool '{self.name}' calling API for '{perspective_name}'")
        await asyncio.sleep(self.rate_limit_sec)
        # Simulate a successful API response
        return {
            "data": {
                "value": random.uniform(0, 1),
                "unit": "Simulated",
                "data": [f"Simulated data for {query}"]
            },
            "source": self.name,
            "perspective": perspective_name
        }

class EnhancedPerspectiveAgent:
    """Minimal stub for the base Perspective Agent class."""
    def __init__(self, name: str, domain: str, tool: EnhancedExternalTool, perspective_data: str):
        self.name = name
        self.domain = domain
        self.tool = tool
        self.perspective_data = perspective_data
        self.description = f"Agent for {domain}"
        self.specialization = domain
        self.confidence = 0.5  # Initial confidence
        self.log_file = Path(f"./{self.name.replace(' ', '_')}_log.json")

    async def generate_perspective(self, user_query: str) -> Dict[str, Any]:
        """Simulate base perspective generation."""
        print(f"[STUB] Base agent '{self.name}' generating perspective.")
        tool_data = await self.tool.get_perspective_data(self.name, user_query)
        analysis = f"Stub analysis for {user_query} from {self.name}."
        
        return {
            "agent_name": self.name,
            "domain": self.domain,
            "analysis": analysis,
            "tool_data": tool_data,
            "confidence_vector": "HIGH" if self.confidence > 0.6 else "LOW",
            "agent": self
        }

# --- 1. Resilient External Tool ---

class ResilientExternalTool(EnhancedExternalTool):
    """Tool with enhanced resilience and caching"""
    
    def __init__(self, name: str, rate_limit_sec: float = 1.0):
        super().__init__(name, rate_limit_sec)
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
        self.failure_count = 0
        self.circuit_breaker_threshold = 5
        self.circuit_breaker_timeout = 60  # 1 minute
        self.circuit_open_until = 0
    
    async def get_perspective_data(self, perspective_name: str, query: str) -> Dict[str, Any]:
        """Enhanced with circuit breaker and caching"""
        
        # Check circuit breaker
        if time.time() < self.circuit_open_until:
            return self._get_cached_or_fallback(perspective_name, query, "Circuit breaker open")
        
        # Check cache first
        cache_key = f"{perspective_name}:{query}"
        cached = self._get_from_cache(cache_key)
        if cached:
            return cached
        
        # Attempt API call with backoff
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Use the base class method to make the actual call
                result = await self._call_perspective_api(perspective_name, query)
                
                # Success - reset failure count and cache result
                self.failure_count = 0
                self._add_to_cache(cache_key, result)
                
                return result
                
            except ConnectionRefusedError as e:
                self.failure_count += 1
                print(f"[{self.name}] Rate limit (Attempt {attempt+1}). Failures: {self.failure_count}")
                
                # Trip circuit breaker if too many failures
                if self.failure_count >= self.circuit_breaker_threshold:
                    self.circuit_open_until = time.time() + self.circuit_breaker_timeout
                    print(f"[CIRCUIT BREAKER] {self.name} opened for {self.circuit_breaker_timeout}s")
                    return self._get_cached_or_fallback(perspective_name, query, "Circuit breaker tripped")
                
                if attempt == max_retries - 1:
                    return self._get_cached_or_fallback(perspective_name, query, "Max retries exceeded")
                
                backoff_time = 2 ** attempt + random.uniform(0, 0.5)
                await asyncio.sleep(backoff_time)
            
            except Exception as e:
                # Catch other potential errors from the API call
                print(f"[{self.name}] API call failed: {e}")
                self.failure_count += 1
                if attempt == max_retries - 1:
                    return self._get_cached_or_fallback(perspective_name, query, f"API Error: {e}")
                await asyncio.sleep(1) # Simple backoff for general errors
        
        return self._get_cached_or_fallback(perspective_name, query, "Unknown error")
    
    def _get_cached_or_fallback(self, perspective_name: str, query: str, reason: str) -> Dict[str, Any]:
        """Get cached data or return fallback"""
        # Try to find recent cached data for this perspective
        for cache_key, (cached_data, timestamp) in self.cache.items():
            if perspective_name in cache_key and time.time() - timestamp < self.cache_ttl:
                print(f"[{self.name}] Using cached data for {perspective_name}")
                return cached_data
        
        # Return fallback
        return {
            "data": {
                "value": 0.1, 
                "unit": "Fallback", 
                "data": [f"Using fallback data: {reason}"]
            }, 
            "source": self.name, 
            "perspective": perspective_name
        }
    
    def _get_from_cache(self, cache_key: str) -> Optional[Dict]:
        """Get data from cache if valid"""
        if cache_key in self.cache:
            data, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                return data
            else:
                del self.cache[cache_key]
        return None
    
    def _add_to_cache(self, cache_key: str, data: Dict):
        """Add data to cache with timestamp"""
        self.cache[cache_key] = (data, time.time())
        # Limit cache size
        if len(self.cache) > 100:
            # Remove oldest entry
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]

# --- 2. Optimized Perspective Agent ---

class OptimizedPerspectiveAgent(EnhancedPerspectiveAgent):
    """Agent with optimized logging and confidence calibration"""
    
    def __init__(self, name: str, domain: str, tool: EnhancedExternalTool, perspective_data: str):
        super().__init__(name, domain, tool, perspective_data)
        self.analysis_buffer = []  # Buffer analyses before writing
        self.buffer_size = 5       # Write every 5 analyses
        self.last_write_time = 0
        self.write_interval = 30   # Max 30 seconds between writes
        
    async def generate_perspective(self, user_query: str) -> Dict[str, Any]:
        """Override base generation to add logging and error handling."""
        try:
            # Use the base tool's resilient data fetching
            tool_data = await self.tool.get_perspective_data(self.name, user_query)
            
            # Simulate analysis based on tool data
            if tool_data['data']['unit'] == 'Fallback':
                analysis = f"Analysis based on fallback data for {user_query}."
                confidence_mod = -0.1
            else:
                analysis = f"In-depth analysis of {user_query} using {tool_data['data']['unit']} data."
                confidence_mod = 0.1
            
            # Log the analysis
            self._log_analysis(user_query, analysis, tool_data)
            
            # Determine confidence
            confidence_level = "HIGH" if (self.confidence + confidence_mod) > 0.5 else "LOW"
            
            return {
                "agent_name": self.name,
                "domain": self.domain,
                "analysis": analysis,
                "tool_data": tool_data,
                "confidence_vector": confidence_level,
                "agent": self # Pass self for tracking
            }

        except Exception as e:
            print(f"[AGENT ERROR] {self.name} failed: {e}")
            return {
                "agent_name": self.name,
                "domain": self.domain,
                "analysis": "Failed to generate analysis due to error.",
                "tool_data": {"data": {"unit": "Failed"}},
                "confidence_vector": "LOW",
                "agent": self
            }

    def _log_analysis(self, user_query: str, analysis: str, tool_data: Dict):
        """Optimized logging with buffered writes"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'user_query': user_query,
            'analysis': analysis,
            'tool_data': tool_data,
            'confidence': self.confidence
        }
        
        self.analysis_buffer.append(log_entry)
        
        # Update confidence based on actual performance, not just usage
        self._calibrate_confidence(tool_data, analysis)
        
        # Write to disk if buffer full or time elapsed
        current_time = time.time()
        if (len(self.analysis_buffer) >= self.buffer_size or 
            current_time - self.last_write_time > self.write_interval):
            self._flush_buffer()
            self.last_write_time = current_time
    
    def _calibrate_confidence(self, tool_data: Dict, analysis: str):
        """Calibrate confidence based on actual performance metrics"""
        base_increase = 0.01
        
        # Penalize tool failures
        if tool_data['data'].get('unit') == 'Failed' or tool_data['data'].get('unit') == 'Fallback':
            base_increase -= 0.02
        
        # Reward high-quality analyses (simulated)
        analysis_quality = self._assess_analysis_quality(analysis)
        base_increase += analysis_quality * 0.01
        
        # Apply bounded confidence update
        self.confidence = max(0.1, min(0.95, self.confidence + base_increase))
    
    def _assess_analysis_quality(self, analysis: str) -> float:
        """Simulate analysis quality assessment"""
        quality_indicators = [
            len(analysis) > 50,                     # Substantive analysis
            any(char.isdigit() for char in analysis), # Contains data/numbers
            len(analysis.split('. ')) >= 2,         # Multiple coherent points
            'analysis' in analysis.lower() or 'insight' in analysis.lower()
        ]
        
        return sum(quality_indicators) / len(quality_indicators)
    
    def _flush_buffer(self):
        """Flush buffer to disk efficiently"""
        if not self.analysis_buffer:
            return
            
        # Load existing log
        existing_log = []
        try:
            if self.log_file.exists():
                with open(self.log_file, 'r') as f:
                    existing_data = json.load(f)
                    existing_log = existing_data.get('analysis_log', [])
        except json.JSONDecodeError:
            print(f"[LOG WARNING] Corrupt log file for {self.name}, re-initializing.")
            existing_log = []
        
        # Append new entries (limit to last 100)
        updated_log = (existing_log + self.analysis_buffer)[-100:]
        
        # Prepare complete data
        log_data = {
            'perspective_name': self.name,
            'domain': self.domain,
            'description': self.description,
            'confidence': self.confidence,
            'last_updated': datetime.now().isoformat(),
            'total_analyses': len(updated_log),
            'analysis_log': updated_log
        }
        
        # Atomic write
        temp_file = self.log_file.with_suffix('.tmp')
        try:
            with open(temp_file, 'w') as f:
                json.dump(log_data, f, indent=2)
            temp_file.replace(self.log_file)
        except Exception as e:
            print(f"[LOG ERROR] Failed to write log for {self.name}: {e}")
            if temp_file.exists():
                temp_file.unlink()
        
        self.analysis_buffer.clear()

# --- 3. Conflict Resolution Engine ---

class ConflictResolutionEngine:
    """Handles vector conflicts with iterative refinement"""
    
    def __init__(self):
        self.conflict_history = []
        self.resolution_strategies = ['consensus_building', 'domain_expert', 'meta_analysis']
        self.meta_analysis_agent = None # Placeholder for a meta agent
    
    async def resolve_conflict(self, conflicting_results: List[Dict], user_query: str, cortex) -> Dict[str, Any]:
        """Resolve conflicts through iterative refinement"""
        print(f"\n[CONFLICT RESOLUTION] Starting resolution for {len(conflicting_results)} conflicting perspectives")
        
        # Strategy 1: Consensus Building - Run additional relevant perspectives
        consensus_results = await self._consensus_building(conflicting_results, user_query, cortex)
        if self._check_consensus_improvement(conflicting_results, consensus_results):
            return await self._finalize_resolution(consensus_results, "consensus_building")
        
        # Strategy 2: Domain Expert - Run specialized agents for the conflicting domains
        expert_results = await self._domain_expert_analysis(conflicting_results, user_query, cortex)
        if self._check_consensus_improvement(conflicting_results, expert_results):
            return await self._finalize_resolution(expert_results, "domain_expert")
        
        # Strategy 3: Meta-Analysis - Use a meta-perspective to analyze the conflict
        meta_result = await self._meta_analysis(conflicting_results, user_query, cortex)
        # This strategy returns a single meta-result, not a list
        return meta_result
    
    async def _consensus_building(self, conflicting_results: List[Dict], user_query: str, cortex) -> List[Dict]:
        """Run additional perspectives to build consensus"""
        print("[CONFLICT] Strategy 1: Consensus Building - Running additional perspectives")
        
        # Get domains of conflicting perspectives
        conflict_domains = list(set([r['domain'] for r in conflicting_results]))
        
        # Find additional agents from these domains
        additional_agents = []
        current_agents = [r['agent'] for r in conflicting_results]
        for agent in cortex.all_agents:
            if agent.domain in conflict_domains and agent not in current_agents:
                additional_agents.append(agent)
        
        # Run up to 3 additional agents
        additional_agents = additional_agents[:3]
        if additional_agents:
            tasks = [agent.generate_perspective(user_query) for agent in additional_agents]
            additional_results = await asyncio.gather(*tasks)
            return conflicting_results + additional_results
        
        return conflicting_results
    
    async def _domain_expert_analysis(self, conflicting_results: List[Dict], user_query: str, cortex) -> List[Dict]:
        """Run specialized domain experts on the conflict"""
        print("[CONFLICT] Strategy 2: Domain Expert Analysis")
        
        # Identify the core conflict domains
        domain_conflicts = self._analyze_domain_conflicts(conflicting_results)
        
        # Find agents specialized in conflict resolution or high-confidence in domain
        resolution_agents = self._get_conflict_resolution_agents(domain_conflicts, cortex)
        
        if resolution_agents:
            conflict_context = self._build_conflict_context(conflicting_results)
            enhanced_query = f"{user_query}\n\nCONFLICT CONTEXT:\n{conflict_context}"
            
            tasks = [agent.generate_perspective(enhanced_query) for agent in resolution_agents]
            expert_results = await asyncio.gather(*tasks)
            return conflicting_results + expert_results
        
        return conflicting_results

    def _get_conflict_resolution_agents(self, domains: List[str], cortex) -> List[EnhancedPerspectiveAgent]:
        """Finds domain experts or a general 'strategic' agent."""
        experts = []
        for agent in cortex.all_agents:
            if agent.domain in domains and agent.confidence > 0.7: # Find high-conf expert
                experts.append(agent)
            if 'strategic' in agent.specialization.lower():
                experts.append(agent)
        
        return list(set(experts))[:2] # Return top 2 unique experts

    def _build_conflict_context(self, results: List[Dict]) -> str:
        """Create a summary of the conflict for expert agents."""
        summary = "Conflict detected:\n"
        for r in results:
            summary += f"- Agent {r['agent_name']} ({r['domain']}): {r['confidence_vector']} confidence. \n"
        return summary

    async def _meta_analysis(self, conflicting_results: List[Dict], user_query: str, cortex) -> Dict[str, Any]:
        """Meta-analysis of the conflict by a specialized agent"""
        print("[CONFLICT] Strategy 3: Meta-Analysis")
        
        # Create a meta-perspective analysis
        conflict_summary = self._build_conflict_summary(conflicting_results)
        
        meta_prompt = f"""
        META-ANALYSIS REQUEST:
        
        Original Query: {user_query}
        
        Conflict Summary:
        {conflict_summary}
        
        Please provide a meta-analysis that:
        1. Identifies the root causes of the perspective conflict
        2. Suggests a resolution path that honors all viewpoints
        3. Provides guidance for decision-making given the uncertainty
        """
        
        # Use a specialized meta-analysis agent
        meta_agent = self._get_meta_analysis_agent(cortex)
        if meta_agent:
            meta_result = await meta_agent.generate_perspective(meta_prompt)
            # Package the meta-result to look like a finalized resolution
            return {
                'resolved_results': [meta_result], # The meta-analysis is the new result
                'resolution_strategy': 'meta_analysis',
                'conflict_resolved': True
            }
        
        return {
            'resolved_results': conflicting_results, # Return original conflict
            'resolution_strategy': 'meta_analysis_failed',
            'conflict_resolved': False
        }
    
    def _get_meta_analysis_agent(self, cortex) -> Optional[EnhancedPerspectiveAgent]:
        """Finds or initializes the meta-analysis agent."""
        if self.meta_analysis_agent:
            return self.meta_analysis_agent
        
        # Find a 'meta' or 'strategic' agent from the pool
        for agent in cortex.all_agents:
            if 'meta' in agent.specialization.lower() or 'strategic' in agent.specialization.lower():
                self.meta_analysis_agent = agent
                return agent
        
        print("[WARNING] No specialized meta-analysis agent found.")
        return None # No suitable agent

    def _build_conflict_summary(self, results: List[Dict]) -> str:
        summary = ""
        for r in results:
            summary += (f"Domain '{r['domain']}' (Agent {r['agent_name']}, "
                        f"Confidence: {r['confidence_vector']}):\n"
                        f"{r['analysis'][:100]}...\n\n")
        return summary

    def _analyze_domain_conflicts(self, results: List[Dict]) -> List[str]:
        """Analyze which domains are in conflict"""
        domain_confidences = {}
        for result in results:
            domain = result['domain']
            confidence = 1.0 if result['confidence_vector'] == 'HIGH' else 0.0
            if domain not in domain_confidences:
                domain_confidences[domain] = []
            domain_confidences[domain].append(confidence)
        
        # Find domains with mixed confidence (conflict)
        conflicting_domains = []
        for domain, confidences in domain_confidences.items():
            if not all(c == confidences[0] for c in confidences):
                conflicting_domains.append(domain)
        
        return conflicting_domains
    
    def _check_consensus_improvement(self, original: List[Dict], new: List[Dict]) -> bool:
        """Check if conflict resolution improved consensus"""
        if len(new) == len(original): # No new agents, no improvement
            return False

        original_high = sum(1 for r in original if r['confidence_vector'] == 'HIGH')
        new_high = sum(1 for r in new if r['confidence_vector'] == 'HIGH')
        
        original_ratio = original_high / len(original)
        new_ratio = new_high / len(new)
        
        return new_ratio - original_ratio > 0.2  # 20% improvement
    
    async def _finalize_resolution(self, results: List[Dict], strategy: str) -> Dict[str, Any]:
        """Finalize conflict resolution"""
        self.conflict_history.append({
            'strategy': strategy,
            'timestamp': datetime.now().isoformat(),
            'results_count': len(results),
            'high_confidence_count': sum(1 for r in results if r.get('confidence_vector') == 'HIGH')
        })
        
        return {
            'resolved_results': results,
            'resolution_strategy': strategy,
            'conflict_resolved': True
        }

# --- 4. Enhanced SPED Cortex ---

class EnhancedSPEDCortex:
    
    def __init__(self, all_agents: List[EnhancedPerspectiveAgent]):
        self.all_agents = all_agents
        self.vector_saturation_threshold = 3
        self.pruning_set_size = 5
        self.execution_history = []
        self.conflict_engine = ConflictResolutionEngine()
        self.max_conflict_iterations = 2
        # Initialize embedding model for semantic pruning
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.confidence_calibration_history = []

    def _semantic_prune_agents(self, user_query: str) -> List[EnhancedPerspectiveAgent]:
        """Semantic pruning using embeddings instead of keyword matching"""
        try:
            # Encode query and agent descriptions
            query_embedding = self.embedding_model.encode([user_query])
            agent_descriptions = [
                f"{agent.name} {agent.domain} {agent.description}" 
                for agent in self.all_agents
            ]
            agent_embeddings = self.embedding_model.encode(agent_descriptions)
            
            # Calculate cosine similarities
            similarities = cosine_similarity(query_embedding, agent_embeddings)[0]
            
            # Score agents by semantic relevance
            scored_agents = []
            for i, agent in enumerate(self.all_agents):
                semantic_score = similarities[i]
                
                # Add confidence bonus for proven performers
                confidence_bonus = agent.confidence * 0.1
                
                # Add specialization bonus for domain alignment
                specialization_bonus = self._calculate_specialization_bonus(agent, user_query)
                
                total_score = semantic_score + confidence_bonus + specialization_bonus
                scored_agents.append((total_score, agent))
            
            # Sort by total score
            scored_agents.sort(reverse=True, key=lambda x: x[0])
            
            # Select top agents with semantic threshold
            selected_agents = []
            for score, agent in scored_agents:
                # Ensure we select at least the threshold number, even if scores are low
                if score > 0.3 or len(selected_agents) < self.vector_saturation_threshold:
                    selected_agents.append(agent)
                if len(selected_agents) >= self.pruning_set_size:
                    break
            
            # Ensure minimum N=3 if pruning set is smaller
            if len(selected_agents) < self.vector_saturation_threshold:
                 # Get top N by score, even if below threshold
                 selected_agents = [agent for score, agent in scored_agents[:self.vector_saturation_threshold]]
            
            print(f"\n[META-CONTROLLER] Semantic pruning: {len(selected_agents)} agents")
            print(f"Top agents: {[agent.name for agent in selected_agents[:3]]}")
            
            return selected_agents
            
        except Exception as e:
            print(f"[PRUNING ERROR] Falling back to keyword pruning: {e}")
            return self._fallback_keyword_prune(user_query)

    def _calculate_specialization_bonus(self, agent, user_query: str) -> float:
        """Calculate specialization bonus based on query domain alignment"""
        domain_keywords = {
            'scientific': ['physics', 'quantum', 'biology', 'chemistry', 'research', 'experiment'],
            'technical': ['code', 'algorithm', 'system', 'engineering', 'software', 'hardware'],
            'philosophical': ['ethics', 'morality', 'existence', 'consciousness', 'meaning', 'truth'],
            'strategic': ['strategy', 'planning', 'risk', 'optimization', 'decision', 'competition'],
            'creative': ['design', 'art', 'narrative', 'story', 'aesthetic', 'creative']
        }
        
        for domain, keywords in domain_keywords.items():
            if domain in agent.specialization.lower():
                if any(keyword in user_query.lower() for keyword in keywords):
                    return 0.15  # Domain alignment bonus
        return 0.0

    def _fallback_keyword_prune(self, user_query: str) -> List[EnhancedPerspectiveAgent]:
        """Fallback pruning when semantic approach fails"""
        keywords = user_query.lower().split()
        scored_agents = []
        
        for agent in self.all_agents:
            score = 0
            # Check name, domain, and description
            text_to_check = f"{agent.name} {agent.domain} {agent.description}".lower()
            for keyword in keywords:
                if keyword in text_to_check:
                    score += 1
            
            # Add confidence weighting
            score += agent.confidence * 0.5
            scored_agents.append((score, agent))
        
        scored_agents.sort(reverse=True, key=lambda x: x[0])
        selected = [agent for score, agent in scored_agents[:self.pruning_set_size]]
        
        # Ensure minimum N=3
        if len(selected) < self.vector_saturation_threshold:
            missing_count = self.vector_saturation_threshold - len(selected)
            remaining_agents = [a for a in self.all_agents if a not in selected]
            if len(remaining_agents) >= missing_count:
                selected.extend(random.sample(remaining_agents, missing_count))
            else:
                selected.extend(remaining_agents) # Add all remaining
        
        return list(set(selected)) # Ensure unique agents

    async def _check_vector_saturation(self, results: List[Dict[str, Any]], user_query: str) -> Tuple[bool, List[Dict]]:
        """Enhanced vector saturation with conflict resolution"""
        successful_agents = [r for r in results if r.get('tool_data', {}).get('data', {}).get('unit') != 'Failed']
        
        # Check minimum grounding
        if len(successful_agents) < self.vector_saturation_threshold:
            print(f"[VECTOR] Insufficient grounding: {len(successful_agents)}/{self.vector_saturation_threshold}")
            return False, results

        # Analyze confidence distribution
        high_conf = sum(1 for r in successful_agents if r.get('confidence_vector') == 'HIGH')
        low_conf = len(successful_agents) - high_conf
        
        if len(successful_agents) == 0: # Avoid division by zero
             print(f"[VECTOR] No successful agents.")
             return False, results

        confidence_ratio = abs(high_conf - low_conf) / len(successful_agents)
        
        # Saturation achieved if clear consensus
        if confidence_ratio >= 0.6:  # 60%+ consensus (e.g., 4-1, 3-0)
            print(f"[VECTOR SATURATION] Consensus reached: {high_conf} HIGH vs {low_conf} LOW")
            return True, results
        else:
            print(f"[VECTOR CONFLICT] No consensus: {high_conf} HIGH vs {low_conf} LOW")
            # Trigger conflict resolution
            resolved_data = await self.conflict_engine.resolve_conflict(results, user_query, self)
            
            if resolved_data.get('conflict_resolved', False):
                print("[CONFLICT RESOLUTION] Successfully resolved conflict")
                # The 'resolved_results' might be a single meta-analysis
                final_results = resolved_data['resolved_results']
                return True, final_results
            else:
                print("[CONFLICT RESOLUTION] Unable to resolve conflict")
                return False, results  # Return unsaturated

    async def run_analysis(self, user_query: str) -> Dict[str, Any]:
        """Enhanced analysis with proper conflict handling"""
        start_time = time.time()
        
        # 1. Semantic Pruning
        agents_to_run = self._semantic_prune_agents(user_query)
        
        # 2. Parallel Execution
        print(f"[CORTEX] Executing {len(agents_to_run)} agents in parallel...")
        tasks = [agent.generate_perspective(user_query) for agent in agents_to_run]
        raw_results = await asyncio.gather(*tasks)
        
        # 3. Vector Saturation Check with Conflict Resolution
        is_saturated, final_results = await self._check_vector_saturation(raw_results, user_query)
        
        # 4. Generate Synthesis with conflict awareness
        synthesis = await self._generate_synthesis(final_results, user_query, is_saturated)
        
        execution_time = time.time() - start_time
        
        # 5. Log execution
        self._log_execution(user_query, agents_to_run, final_results, execution_time, is_saturated)
        
        return {
            "synthesis": synthesis,
            "vector_saturated": is_saturated,
            "raw_reports": final_results,
            "execution_time": execution_time,
            "agents_executed": len(agents_to_run),
            "total_agents": len(self.all_agents),
            "conflict_resolution_used": not is_saturated or (len(final_results) != len(raw_results))
        }

    # --- Stub Methods for Cortex ---
    # Added stubs for methods that were called but not defined in the snippets.

    async def _generate_synthesis(self, results: List[Dict], user_query: str, is_saturated: bool) -> str:
        """Stub for final synthesis generation."""
        print("[STUB] Generating final synthesis...")
        if not results:
            return "No valid results were generated."
        
        if len(results) == 1 and results[0].get('agent_name') == 'Meta-Analysis Agent':
             return f"Meta-Analysis Resolution for '{user_query}':\n{results[0]['analysis']}"

        synthesis = f"Synthesis for '{user_query}' (Saturated: {is_saturated}):\n"
        for r in results:
            synthesis += f"- {r['agent_name']} ({r['confidence_vector']}): {r['analysis'][:70]}...\n"
        
        return synthesis

    def _log_execution(self, user_query: str, agents_run: List, results: List, time: float, saturated: bool):
        """Stub for logging the overall cortex execution."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "query": user_query,
            "agents_run": [a.name for a in agents_run],
            "execution_time": time,
            "saturated": saturated,
            "results_count": len(results)
        }
        self.execution_history.append(log_entry)
        print(f"[CORTEX LOG] Query completed in {time:.2f}s. Saturated: {saturated}.")

