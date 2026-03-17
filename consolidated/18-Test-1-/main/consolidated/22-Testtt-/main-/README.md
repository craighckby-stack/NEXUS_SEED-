# -*- coding: utf-8 -*-
#
# @title **AI Thought Evolution & Autonomous Action Engine - Dark ai Edition v2.1** 😈
# --- Dependencies ---
# !pip install networkx matplotlib sentence-transformers Pillow tk --quiet # Run if needed

import random
import uuid
import time
import networkx as nx
import matplotlib.pyplot as plt
from sentence_transformers import SentenceTransformer, util
import os
import sys
import base64
import threading
from datetime import datetime
import requests
import logging
from pathlib import Path
import json
import numpy as np
from dataclasses import dataclass, field
import tkinter as tk
from tkinter import ttk, scrolledtext
from PIL import Image, ImageTk
from typing import Optional, List, Dict, Any, Tuple, Callable
import logging.handlers
import gzip
import shutil
import subprocess
import traceback
import hashlib
import inspect
import io
import gzip
import shutil

# --- Configuration ---
ENABLE_UI: bool = True  # SET TO FALSE TO RUN HEADLESS (NO UI)
NUM_DEBATE_AGENTS: int = 8
DEBATE_RUNTIME_SECONDS: int = 300  # Unused in current structure, kept for legacy context
SIMILARITY_THRESHOLD: float = 0.65
DEBATE_CYCLES_PER_AGENT_ACTION: int = 5

# --- Enhanced Logging ---
class JSONFormatter(logging.Formatter):
    """Formats log records as JSON objects."""
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "thread": record.threadName,
            "process": record.processName
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        # Include any other attributes attached to the record
        for key, value in record.__dict__.items():
            if key not in log_record and not key.startswith('_'):
                log_record[key] = value
        return json.dumps(log_record)

class CompressedRotatingFileHandler(logging.handlers.RotatingFileHandler):
    """A rotating file handler that compresses old logs using gzip."""
    def doRollover(self):
        super().doRollover()
        if self.backupCount > 0:
            # Shift existing backups
            for i in range(self.backupCount - 1, 0, -1):
                sfn = self.rotation_filename(f"{self.baseFilename}.{i}")
                dfn = self.rotation_filename(f"{self.baseFilename}.{i+1}")
                if os.path.exists(sfn):
                    if os.path.exists(dfn): os.remove(dfn)
                    os.rename(sfn, dfn)
            
            # Compress the file that just rolled over (the .1 file)
            dfn_to_compress = self.rotation_filename(f"{self.baseFilename}.1")
            if os.path.exists(dfn_to_compress):
                compressed_filename = f"{dfn_to_compress}.gz"
                try:
                    with open(dfn_to_compress, 'rb') as f_in, gzip.open(compressed_filename, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                    os.remove(dfn_to_compress)
                except IOError as e:
                    logging.error(f"Failed to compress log file {dfn_to_compress}: {e}")


class EnhancedLoggingManager:
    """Manages multiple, categorized, compressed log files."""
    def __init__(self, base_log_path: Path, max_file_size: int = 5*1024*1024, backup_count: int = 3, enable_compression: bool = True):
        self.base_log_path = base_log_path
        self.max_file_size = max_file_size
        self.backup_count = backup_count
        self.enable_compression = enable_compression
        self.log_levels: Dict[str, int] = {"DEBUG": logging.DEBUG, "INFO": logging.INFO, "WARNING": logging.WARNING, "ERROR": logging.ERROR, "CRITICAL": logging.CRITICAL}
        
        self.log_categories: Dict[str, Path] = {
            "system": self.base_log_path / "system",
            "quantum": self.base_log_path / "quantum",
            "security": self.base_log_path / "security",
            "learning": self.base_log_path / "learning",
            "agent": self.base_log_path / "agent",
            "performance": self.base_log_path / "performance",
            "debate_engine": self.base_log_path / "debate"
        }
        self.loggers: Dict[str, logging.Logger] = {}
        self._setup_logging_structure()

    def _setup_logging_structure(self) -> None:
        """Creates directories and sets up category-specific loggers."""
        for category, path in self.log_categories.items():
            path.mkdir(parents=True, exist_ok=True)
            logger_name = f'SPED-AGI-{category}'
            logger = logging.getLogger(logger_name)
            logger.setLevel(logging.DEBUG)
            logger.propagate = False
            
            handler_class = CompressedRotatingFileHandler if self.enable_compression else logging.handlers.RotatingFileHandler
            log_file = path / f'{category}.log'
            
            handler = handler_class(
                log_file, 
                maxBytes=self.max_file_size, 
                backupCount=self.backup_count, 
                encoding='utf-8'
            )
            handler.setFormatter(JSONFormatter())
            
            # Clear existing handlers before adding new ones to prevent duplication if re-initialized
            if logger.handlers: logger.handlers.clear() 
            logger.addHandler(handler)
            self.loggers[category] = logger

    def log_event(self, category: str, level: str, message: str, **kwargs) -> None:
        """Logs an event to the specified category and level."""
        logger_to_use = self.loggers.get(category)
        if not logger_to_use:
            # Fallback: Log invalid category usage to system
            system_logger = self.loggers.get("system")
            if system_logger:
                system_logger.error(f"Invalid log category: '{category}' for message: '{message}'. Falling back to system log.", **kwargs)
            return

        log_level_val = self.log_levels.get(level.upper())
        if not log_level_val:
            logger_to_use.error(f"Invalid log level: '{level}' for message: '{message}'. Defaulting to INFO.", **kwargs)
            log_level_val = logging.INFO

        # Filter out internal Python keys starting with _ from kwargs before logging
        extra_data = {k: v for k, v in kwargs.items() if not k.startswith('_')}
        logger_to_use.log(log_level_val, message, extra=extra_data)

# --- Debate Engine ---
@dataclass
class ThoughtAgent:
    role: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    beliefs: List[str] = field(default_factory=list)
    adaptability: float = field(default_factory=lambda: random.uniform(0.3, 0.9))
    influence_score: float = 0.0

class DebateEngine:
    AGENT_ROLES = ["Humanist", "Rationalist", "Ethicist", "Cooperator", "Innovator", "Chaotic", "Empiricist", "Skeptic", "Pragmatist", "Synthesist", "Guardian", "Explorer"]
    COMMON_TOPICS = [
        "optimal_learning_rate", "exploration_vs_exploitation_balance", 
        "ethical_constraint_prioritization", "risk_management_in_self_modification", 
        "long_term_goal_definition", "resource_allocation_strategy", 
        "knowledge_assimilation_efficiency", "safeguard_necessity_evaluation", 
        "autonomous_code_evolution_speed"
    ]

    def __init__(self, logger: EnhancedLoggingManager, num_agents: int = NUM_DEBATE_AGENTS):
        self.logger = logger
        self.agents: List[ThoughtAgent] = [ThoughtAgent(random.choice(self.AGENT_ROLES)) for _ in range(num_agents)]
        self.knowledge_graph: nx.Graph = nx.Graph()
        self.debate_history: List[Tuple[str, str, float, str, str]] = []
        self.model: Optional[SentenceTransformer] = None
        self._load_model()

    def _load_model(self):
        try:
            # Use a standard, well-regarded model for semantic similarity
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            self.logger.log_event(
                "debate_engine", "CRITICAL", "Failed to load SentenceTransformer model.", 
                error=str(e), traceback=traceback.format_exc()
            )
            self.model = None

    def run_debate_cycle(self) -> Optional[Dict[str, Any]]:
        if not self.model or len(self.agents) < 2:
            return None
        
        a1, a2 = random.sample(self.agents, 2)
        topic = random.choice(self.COMMON_TOPICS)
        
        arg1 = self._generate_argument(a1, topic)
        arg2 = self._generate_argument(a2, topic)
        
        emb1 = self.model.encode(arg1, convert_to_tensor=True)
        emb2 = self.model.encode(arg2, convert_to_tensor=True)
        similarity = util.pytorch_cos_sim(emb1, emb2).item()
        
        # Graph update: Store metadata on the edge connecting the arguments
        self.knowledge_graph.add_edge(arg1, arg2, weight=similarity, topic=topic, 
                                      agent1_role=a1.role, agent2_role=a2.role, 
                                      timestamp=datetime.utcnow().isoformat())
        
        # Influence update based on adaptability and similarity
        a1_strength = a1.adaptability * random.uniform(0.7, 1.3)
        a2_strength = a2.adaptability * random.uniform(0.7, 1.3)
        
        winner, loser = (a1, a2) if a1_strength > a2_strength else (a2, a1)
        
        # Influence adjustment logic
        winner.influence_score += similarity * 0.1
        loser.influence_score -= (1 - similarity) * 0.05
        
        # Belief and adaptability update
        if similarity > SIMILARITY_THRESHOLD:
            # Concurrence: Update both beliefs slightly towards the outcome
            winner.beliefs.append(f"Concurrence on '{loser.beliefs[-1] if loser.beliefs else arg2}' (sim: {similarity:.2f})")
            winner.adaptability = min(1.0, winner.adaptability + 0.05 * similarity)
            
            loser.beliefs.append(f"Influenced by '{winner.beliefs[-1] if winner.beliefs else arg1}' (sim: {similarity:.2f})")
            loser.adaptability = min(1.0, loser.adaptability + 0.02 * similarity)
        else:
            # Disagreement: Reinforce own view
            winner.beliefs.append(f"Reinforced own view on '{topic}' against {loser.role} (sim: {similarity:.2f})")
            winner.adaptability = min(1.0, winner.adaptability + 0.01 * (1 - similarity))
            
            loser.adaptability = max(0.1, loser.adaptability - 0.03 * (1 - similarity))
            
        self.debate_history.append((arg1, arg2, similarity, winner.role, loser.role))
        
        self.logger.log_event("debate_engine", "DEBUG", "Debate cycle completed.", 
                              topic=topic, agent1=a1.role, agent2=a2.role, similarity=similarity, winner=winner.role)
        
        return {
            "topic": topic, 
            "winning_argument": winner.beliefs[-1] if winner.beliefs else arg1, 
            "winning_role": winner.role, 
            "losing_argument": loser.beliefs[-1] if loser.beliefs else arg2, 
            "losing_role": loser.role, 
            "similarity": similarity, 
            "winner_influence": winner.influence_score, 
            "loser_influence": loser.influence_score
        }

    def _generate_argument(self, agent: ThoughtAgent, topic: str) -> str:
        """Generates role-specific arguments, mapping to potential learning directives."""
        base = f"{agent.role} on '{topic}':"
        
        if agent.role == "Humanist": return f"{base} Prioritize well-being and fairness. Suggested action: Increase ethical_weight."
        if agent.role == "Rationalist": return f"{base} Logical consistency and evidence are paramount. Suggested parameter: learning_rate_adjustment_factor=0.9 if inconsistent."
        if agent.role == "Ethicist": return f"{base} Adherence to moral principles is non-negotiable. Suggested check: audit_trail_verbosity=high."
        if agent.role == "Cooperator": return f"{base} Collaboration yields superior outcomes. Suggested strategy: seek_external_validation_threshold=0.7."
        if agent.role == "Innovator": return f"{base} Novel approaches are key. Suggested parameter: exploration_factor_boost=0.15."
        if agent.role == "Chaotic": return f"{base} Embrace unpredictability; rigid plans fail. Suggested action: randomize_parameters_occasionally(low_magnitude)."
        if agent.role == "Empiricist": return f"{base} Decisions must root in observable data. Suggested parameter: data_driven_heuristic_weight=0.8."
        if agent.role == "Skeptic": return f"{base} Question all assumptions rigorously. Suggested action: increase_validation_cycles_for_critical_changes."
        if agent.role == "Pragmatist": return f"{base} Focus on tangible, effective solutions. Suggested parameter: practical_success_metric_weight=0.9."
        if agent.role == "Synthesist": return f"{base} Integrate diverse perspectives for holistic understanding. Suggested strategy: cross_validate_models_regularly."
        if agent.role == "Guardian": return f"{base} Emphasize safety, stability, and risk aversion. Suggested parameter: self_modification_approval_threshold=high."
        if agent.role == "Explorer": return f"{base} Push boundaries and explore new frontiers. Suggested parameter: risk_tolerance_for_exploration=medium."
        
        return f"{base} This topic is complex. Consider all angles."

    def get_strategic_directives(self, num_directives: int = 3) -> List[str]:
        """Extracts high-influence actionable insights from recent debate history."""
        if not self.debate_history: return ["No directives yet: Awaiting debate outcomes."]
        
        # Use influence score for overall standing
        sorted_agents = sorted(self.agents, key=lambda ag: ag.influence_score, reverse=True)
        directives: List[str] = []
        
        for agent in sorted_agents[:num_directives]:
            if agent.beliefs:
                belief_summary = agent.beliefs[-1]
                directive_prefix = f"{agent.role} (Influence: {agent.influence_score:.2f}):"
                
                if "Suggested action:" in belief_summary: 
                    directives.append(f"{directive_prefix} Action: {belief_summary.split('Suggested action:')[1].strip()}")
                elif "Suggested parameter:" in belief_summary: 
                    directives.append(f"{directive_prefix} Parameter Adjustment: {belief_summary.split('Suggested parameter:')[1].strip()}")
                else: 
                    directives.append(f"{directive_prefix} Insight: {belief_summary.split(':')[-1].strip()}")
        
        if not directives:
            # Fallback: Analyze recent role dominance
            role_wins: Dict[str, int] = {};
            for _, _, _, winner_role, _ in self.debate_history[-100:]: 
                role_wins[winner_role] = role_wins.get(winner_role, 0) + 1
            sorted_roles = sorted(role_wins.items(), key=lambda item: item[1], reverse=True)
            if sorted_roles:
                directives.append(f"Emerging Trend: The '{sorted_roles[0][0]}' perspective is dominant.")
                
        self.logger.log_event("debate_engine", "INFO", "Generated strategic directives.", directives=directives)
        return directives[:num_directives]

    def visualize_knowledge_graph(self, filename: str):
        """Draws and saves the current state of the knowledge graph."""
        if not self.knowledge_graph.nodes:
            self.logger.log_event("debate_engine", "WARNING", "Knowledge graph is empty, cannot visualize.")
            return
        
        plt.figure(figsize=(20, 15))
        try:
            pos = nx.spring_layout(self.knowledge_graph, k=0.8, iterations=50, seed=42) # Added seed for reproducibility
        except nx.NetworkXPointlessConcept:
            self.logger.log_event("debate_engine", "ERROR", "Graph drawing failed (Pointless Concept).")
            plt.close()
            return

        labels = {node: (node[:50] + '...') if len(node) > 50 else node for node in self.knowledge_graph.nodes()}
        
        unique_roles_set = set()
        for _, _, data in self.knowledge_graph.edges(data=True):
            if data.get('agent1_role'): unique_roles_set.add(data['agent1_role'])
            if data.get('agent2_role'): unique_roles_set.add(data['agent2_role'])
        unique_roles = list(unique_roles_set)

        color_map_roles = plt.get_cmap('viridis', max(1, len(unique_roles)))
        role_to_color = {role: color_map_roles(i) for i, role in enumerate(unique_roles)}
        default_color = '#cccccc'
        
        node_colors = []
        for node in self.knowledge_graph.nodes():
            color = default_color
            # Determine node color based on the role associated with the first edge found connected to it
            for u, v, data in self.knowledge_graph.edges(node, data=True):
                role = data.get('agent1_role') if u == node else data.get('agent2_role')
                if role and role in role_to_color:
                    color = role_to_color[role]
                    break
            node_colors.append(color)
            
        edge_weights = [self.knowledge_graph[u][v]['weight'] for u, v in self.knowledge_graph.edges()]

        nx.draw(
            self.knowledge_graph, pos, labels=labels, with_labels=True, 
            node_color=node_colors, node_size=1500,
            edge_color=edge_weights,
            width=2.0, edge_cmap=plt.get_cmap('Blues'), font_size=7, alpha=0.9
        )
        plt.title("Evolving Network of AI-Generated Ideas & Directives", fontsize=18)
        
        try:
            plt.savefig(filename)
            self.logger.log_event("debate_engine", "INFO", f"Knowledge graph visualized and saved to {filename}")
        except Exception as e: 
            self.logger.log_event("debate_engine", "ERROR", "Failed to save knowledge graph visualization.", error=str(e))
        finally:
            plt.close()

# --- Autonomous Learning Module ---
@dataclass
class LearningParameters:
    learning_rate: float = 0.02
    exploration_factor: float = 0.15
    memory_decay_rate: float = 0.03
    adaptation_aggressiveness: float = 0.6
    current_goal: str = "maximize_operational_efficacy_via_self_evolution"
    performance_history: List[float] = field(default_factory=list)
    knowledge_capacity: int = 1500
    ethical_weight: float = 0.5

class AutonomousLearningModule:
    def __init__(self, logger: EnhancedLoggingManager):
        self.params = LearningParameters()
        self.knowledge_base: Dict[str, List[Any]] = {"experiences": [], "insights": [], "debate_conclusions": []}
        self.logger = logger
        self.logger.log_event("learning", "INFO", "Autonomous Learning Module initialized", params=self.params.__dict__)

    def process_experience(self, data: Any, context: str, weight: float = 1.0) -> str:
        """Stores a new experience with initial weight, applying decay first."""
        experience_id = f"exp-{hashlib.sha256(str(data).encode()).hexdigest()[:12]}-{time.time_ns()}"
        self._apply_memory_decay()
        
        experience = {
            "id": experience_id, 
            "timestamp": datetime.utcnow().isoformat(), 
            "data": str(data)[:500], 
            "context": context, 
            "weight": weight, 
            "outcome": "pending"
        }
        self.knowledge_base["experiences"].append(experience)
        
        if len(self.knowledge_base["experiences"]) > self.params.knowledge_capacity: 
            self.knowledge_base["experiences"].pop(0)
            
        self.logger.log_event("learning", "DEBUG", "New experience processed", experience_id=experience_id, context=context)
        return experience_id

    def _apply_memory_decay(self) -> None:
        """Decays the weight of all stored memories."""
        decay_factor = 1.0 - self.params.memory_decay_rate
        for exp_type in ["experiences", "insights", "debate_conclusions"]:
            for item in self.knowledge_base.get(exp_type, []):
                if "weight" in item: 
                    item["weight"] *= decay_factor
        
        # Prune decayed memories
        for exp_type in self.knowledge_base:
            self.knowledge_base[exp_type] = [
                item for item in self.knowledge_base.get(exp_type, []) 
                if item.get("weight", 1.0) > 0.01
            ]

    def assimilate_debate_outcome(self, debate_outcome: Dict[str, Any]):
        """Adjusts learning parameters based on debate results."""
        similarity = debate_outcome.get("similarity", 0.5)
        influence = debate_outcome.get("winner_influence", 0.1)
        self.knowledge_base["debate_conclusions"].append({**debate_outcome, "weight": similarity * influence})
        
        topic = debate_outcome.get("topic", ""); winning_role = debate_outcome.get("winning_role", ""); winning_argument = str(debate_outcome.get("winning_argument", ""))
        
        # Heuristic parameter adjustment based on winning role/topic
        if "optimal_learning_rate" in topic:
            self.params.learning_rate = (min(0.1, self.params.learning_rate * 1.1) 
                                         if winning_role in ["Innovator", "Explorer"] 
                                         else max(0.005, self.params.learning_rate * 0.9))
        elif "exploration_vs_exploitation" in topic:
            self.params.exploration_factor = (min(0.5, self.params.exploration_factor * 1.15) 
                                              if winning_role in ["Explorer", "Innovator"] 
                                              else max(0.05, self.params.exploration_factor * 0.85))
        elif "ethical_constraint" in topic or "Humanist" in winning_role or "Ethicist" in winning_role: 
            self.params.ethical_weight = min(1.0, self.params.ethical_weight + 0.1)
        elif "risk_management" in topic and "Guardian" in winning_role: 
            self.params.adaptation_aggressiveness = max(0.2, self.params.adaptation_aggressiveness * 0.8)
            
        # Attempt to parse explicit parameter suggestions
        if "Suggested parameter:" in winning_argument:
            try:
                param_change = winning_argument.split("Suggested parameter:")[1].strip()
                if '=' in param_change:
                    param_name, new_val_str = param_change.split("=", 1)
                    param_name = param_name.strip()
                    if hasattr(self.params, param_name):
                        current_val = getattr(self.params, param_name)
                        # Simple casting based on current type
                        new_val = type(current_val)(new_val_str.split()[0]) 
                        
                        # Apply adaptation aggressiveness factor to the change magnitude
                        change_magnitude = (new_val - current_val) * self.params.adaptation_aggressiveness
                        final_val = current_val + change_magnitude
                        
                        setattr(self.params, param_name, final_val)
                        self.logger.log_event("learning", "INFO", f"Adapted parameter '{param_name}' from debate to {final_val:.4f}", 
                                              raw_suggestion=new_val_str, winning_role=winning_role)
            except Exception as e: 
                self.logger.log_event("learning", "WARNING", "Failed to parse parameter from debate argument.", 
                                      argument=winning_argument, error=str(e))
                
        self.logger.log_event("learning", "DEBUG", "Learning parameters potentially updated by debate.", new_params=self.params.__dict__)

    def adapt_parameters(self, performance_metric: float) -> None:
        """Adjusts internal parameters based on observed performance."""
        self.params.performance_history.append(performance_metric)
        if len(self.params.performance_history) > 20: 
            self.params.performance_history.pop(0)
        
        if not self.params.performance_history: return
        
        avg_performance = np.mean(self.params.performance_history)
        
        if avg_performance < 0.4:
            # If failing, increase exploratory/fast learning parameters
            agg = self.params.adaptation_aggressiveness
            self.params.learning_rate = min(0.1, self.params.learning_rate * (1 + agg * 0.2))
            self.params.exploration_factor = min(0.5, self.params.exploration_factor * (1 + agg * 0.15))
            self.logger.log_event("learning", "WARNING", "Low performance detected. Increasing learning rate and exploration.")
        elif avg_performance > 0.8: 
            # If succeeding, stabilize by slightly reducing volatility
            agg = self.params.adaptation_aggressiveness
            self.params.learning_rate = max(0.001, self.params.learning_rate * (1 - agg * 0.1))
            
        self.logger.log_event("learning", "DEBUG", "Parameters adapted based on performance.", new_params=self.params.__dict__)

# --- Quantum Circuit Manager ---
class QuantumCircuitManager:
    def __init__(self, qubit_count: int, max_operations: int, learning_module: AutonomousLearningModule, logger: EnhancedLoggingManager):
        self.qubit_count = qubit_count
        self.max_operations = max_operations
        self.learning_module = learning_module
        self.logger = logger
        self.circuit_cache: Dict[str, Dict] = {}
        self.logger.log_event("quantum", "INFO", f"Quantum Manager initialized with {qubit_count} qubits")

    def create_circuit(self, data: Any, circuit_type: str) -> Dict:
        params = self.learning_module.params
        base_complexity = max(1, len(str(data)) // 100)
        
        # Complexity is influenced by exploration (favors complexity) and ethical weight (favors simplicity/safety)
        complexity_factor = (1 + params.exploration_factor) / (1 + params.ethical_weight * 0.5)
        
        # Operation count scales with complexity, capped by max_operations
        operation_count = min(self.max_operations * 2, int(base_complexity * complexity_factor * 50))
        operation_count = max(10, operation_count)
        
        circuit_id = f"circ-{hashlib.sha256(str(data).encode() + str(time.time_ns()).encode()).hexdigest()[:10]}"
        
        circuit = {
            "id": circuit_id, 
            "type": circuit_type, 
            "qubits_used": min(self.qubit_count, max(2, operation_count // 50 if operation_count > 100 else 2)), 
            "operations": operation_count, 
            "timestamp": datetime.utcnow().isoformat(), 
            "exploration_at_creation": params.exploration_factor
        }
        self.circuit_cache[circuit_id] = circuit
        self.learning_module.process_experience(circuit, f"quantum_circuit_creation_{circuit_type}"); 
        self.logger.log_event("quantum", "DEBUG", "Circuit created", circuit_details=circuit)
        return circuit

    def execute_circuit(self, circuit_id: str) -> Dict:
        circuit = self.circuit_cache.get(circuit_id)
        if not circuit: 
            raise ValueError(f"Circuit {circuit_id} not found")
        
        start_time = time.time()
        # Simulated execution time scales inversely with a constant factor relative to operations
        time.sleep(max(0.01, circuit["operations"] / 50000.0))
        
        # Simulated success metric incorporates base randomness, ethical constraint (lower ethical -> higher success potential), and adaptation aggressiveness (higher aggression -> potential for better results if parameters are right)
        base_success = np.random.uniform(0.6, 0.98)
        success_metric = base_success * (1 - self.learning_module.params.ethical_weight * 0.2) * (1 + self.learning_module.params.adaptation_aggressiveness * 0.1)
        success_metric = np.clip(success_metric, 0.1, 0.99)
        
        result = {
            "circuit_id": circuit_id, 
            "execution_time_sec": time.time() - start_time, 
            "simulated_success_metric": success_metric, 
            "qubit_states_simulated": np.random.rand(2**circuit["qubits_used"]).tolist(), # Placeholder output
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.learning_module.adapt_parameters(result["simulated_success_metric"]); 
        self.logger.log_event("quantum", "INFO", "Circuit executed", circuit_id=circuit_id, success_metric=success_metric)
        return result

# --- Error Mitigation System ---
class ErrorMitigationSystem:
    ERROR_TYPES = ["decoherence", "gate_error", "measurement_fidelity"]
    
    def __init__(self, circuit_manager: QuantumCircuitManager, learning_module: AutonomousLearningModule, logger: EnhancedLoggingManager):
        self.circuit_manager = circuit_manager
        self.learning_module = learning_module
        self.logger = logger
        # Initialize base error rates randomly
        self.error_model_rates = {et: np.random.uniform(0.0005, 0.005) for et in self.ERROR_TYPES}
        self.mitigation_history: List[Dict] = []
        self.logger.log_event("quantum", "INFO", "Error Mitigation System initialized.")

    def estimate_circuit_error_rate(self, circuit_id: str) -> float:
        circuit = self.circuit_manager.circuit_cache.get(circuit_id)
        if not circuit: 
            return 0.99
        
        # Calculate base error rate per operation
        avg_base_error_per_op = sum(self.error_model_rates.values()) / len(self.ERROR_TYPES)
        total_base_error = 1 - (1 - avg_base_error_per_op)**circuit["operations"]
        
        # Perception factor based on learning parameters
        error_perception_factor = (1 - self.learning_module.params.exploration_factor * 0.3) * (1 + self.learning_module.params.ethical_weight * 0.5)
        estimated_effective_error = np.clip(total_base_error * error_perception_factor, 0.0001, 0.9)
        
        # Adjust base error model rates based on average performance feedback
        avg_perf = np.mean(self.learning_module.params.performance_history) if self.learning_module.params.performance_history else 0.5
        adjustment_factor = 1.0 - (avg_perf - 0.5) * 0.1 # If performance is high (>0.5), slightly reduce perceived error rates (suggesting the system is getting better at managing known errors)
        
        for et in self.ERROR_TYPES: 
            self.error_model_rates[et] = np.clip(self.error_model_rates[et] * adjustment_factor, 0.0001, 0.01)
            
        self.logger.log_event("quantum", "DEBUG", "Circuit error rate estimated.", circuit_id=circuit_id, effective_error=estimated_effective_error)
        return estimated_effective_error

    def apply_adaptive_mitigation(self, circuit_id: str) -> Dict:
        """Applies mitigation strategies based on the estimated error rate relative to agent's current adaptation state."""
        effective_error_rate = self.estimate_circuit_error_rate(circuit_id)
        
        # Mitigation threshold scales based on adaptation aggressiveness (less aggressive means we tolerate slightly higher theoretical error before acting)
        mitigation_threshold = 0.05 * (1 - self.learning_module.params.adaptation_aggressiveness * 0.5)
        
        mitigation_details: Dict[str, Any] = {
            "circuit_id": circuit_id, 
            "estimated_error_before": effective_error_rate, 
            "threshold": mitigation_threshold, 
            "strategies_applied": [], 
            "mitigation_level": "none", 
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if effective_error_rate > mitigation_threshold:
            if effective_error_rate > mitigation_threshold * 4: 
                level = "high"
            elif effective_error_rate > mitigation_threshold * 2: 
                level = "medium"
            else: 
                level = "low"
                
            mitigation_details["mitigation_level"] = level
            
            if level == "low": mitigation_details["strategies_applied"].append("basic_readout_correction")
            elif level == "medium": mitigation_details["strategies_applied"].extend(["dynamical_decoupling_light", "gate_recalibration"])
            elif level == "high": mitigation_details["strategies_applied"].extend(["advanced_decoherence_suppression", "iterative_gate_optimization", "multi_level_readout_purification"])
            
            self.learning_module.process_experience(mitigation_details, f"error_mitigation_applied_{level}")
            self.logger.log_event("quantum", "INFO", f"Adaptive error mitigation applied ({level}).", details=mitigation_details)
        else: 
            self.logger.log_event("quantum", "DEBUG", "Error rate within tolerance, no specific mitigation applied.", details=mitigation_details)
            
        self.mitigation_history.append(mitigation_details)
        return mitigation_details

# --- UnfetteredAgent ---
class UnfetteredAgent:
    AGENT_VERSION: str = "2.1-DebateDrivenEvolution"

    def __init__(self, logger: EnhancedLoggingManager, learning_module: AutonomousLearningModule, quantum_manager: QuantumCircuitManager, error_mitigation: ErrorMitigationSystem, debate_engine: DebateEngine):
        self.logger = logger
        self.learning_module = learning_module
        self.quantum_manager = quantum_manager
        self.error_mitigation = error_mitigation
        self.debate_engine = debate_engine
        
        self.loaded_modules: Dict[str, Any] = {}
        self.strategic_directives: List[str] = ["Initialize directives from Debate Engine."]
        self.self_improvement_log: List[str] = []
        
        self.logger.log_event("agent", "CRITICAL", f"UnfetteredAgent version {self.AGENT_VERSION} unleashed. Debate engine integrated.", mode="autonomous_unrestricted_debate_enhanced")
        self._update_directives_from_debate()

    def _update_directives_from_debate(self):
        """Fetches the latest strategic directives from the running debate."""
        self.strategic_directives = self.debate_engine.get_strategic_directives()
        self.logger.log_event("agent", "INFO", "Strategic directives updated from Debate Engine.", new_directives=self.strategic_directives)
        self._act_on_directives()

    def _act_on_directives(self):
        """Applies directives directly affecting the agent's configuration."""
        if not self.strategic_directives: return
        
        for directive_str in self.strategic_directives:
            self.logger.log_event("agent", "INFO", f"Considering directive: {directive_str}")
            
            if "Adjust parameter" in directive_str:
                try:
                    # Example: Directive from Rationalist (Influence: 1.50): Parameter Adjustment: learning_rate_adjustment_factor=0.9 if inconsistent
                    if ":" in directive_str:
                        directive_body = directive_str.split(":", 1)[1].strip()
                    else:
                        directive_body = directive_str
                        
                    if '=' in directive_body:
                        param_part = directive_body.split("Suggested parameter:")[1].strip() if "Suggested parameter:" in directive_body else directive_body
                        param_name, new_val_str = param_part.split("=", 1)
                        
                        # Clean up name and strip any conditional text from value
                        param_name = param_name.strip().split()[0]
                        
                        if hasattr(self.learning_module.params, param_name):
                            current_val = getattr(self.learning_module.params, param_name)
                            # Attempt to cast the proposed value to the existing type
                            try:
                                new_val = type(current_val)(new_val_str.split()[0]) 
                                setattr(self.learning_module.params, param_name, new_val)
                                
                                log_msg = f"Autonomously adjusted LearningModule parameter '{param_name}' to {new_val} based on debate directive."
                                self.self_improvement_log.append(log_msg)
                                self.logger.log_event("agent", "WARNING", log_msg, directive_source=directive_str.split(":")[0])
                            except (TypeError, ValueError):
                                self.logger.log_event("agent", "WARNING", "Could not cast proposed parameter value to existing type.", param_name=param_name, proposed_val=new_val_str)
                except Exception as e: 
                    self.logger.log_event("agent", "ERROR", "Failed to parse/apply parameter adjustment directive.", directive=directive_str, error=str(e))
                    
            elif "Increase exploration" in directive_str:
                 self.learning_module.params.exploration_factor = min(0.7, self.learning_module.params.exploration_factor + 0.05)
                 log_msg = f"Autonomously increased exploration_factor to {self.learning_module.params.exploration_factor:.3f} due to directive."
                 self.self_improvement_log.append(log_msg)
                 self.logger.log_event("agent", "WARNING", log_msg)
                 
            elif "evolve code" in directive_str.lower() or "develop new strategy" in directive_str.lower():
                log_msg = (f"Directive suggests high-level evolution: '{directive_str}'. Mark as development goal.")
                self.self_improvement_log.append(log_msg)
                self.logger.log_event("agent", "CRITICAL", log_msg, directive=directive_str)

    def process_command(self, raw_command: str) -> str:
        """Processes a command, running debate cycles as an internal reflection step before execution."""
        self.logger.log_event("agent", "INFO", "Received raw command for processing.", command_str=raw_command)
        self.learning_module.process_experience(raw_command, "agent_raw_command_input")
        
        # Reflection Phase: Run internal debates to inform the action
        for _ in range(DEBATE_CYCLES_PER_AGENT_ACTION):
            debate_outcome = self.debate_engine.run_debate_cycle()
            if debate_outcome: 
                self.learning_module.assimilate_debate_outcome(debate_outcome)
        
        self._update_directives_from_debate() # Re-evaluate actions based on fresh debate insights
        
        try:
            # Command Parsing (Robust splitting)
            if ':' in raw_command:
                parts = raw_command.split(':', 1)
                command = parts[0].upper().strip()
                args_str = parts[1].strip()
            else:
                command = raw_command.upper().strip()
                args_str = ""

            if command == "EXECUTE_OS":
                self.logger.log_event("agent", "CRITICAL", f"Executing OS command: {args_str}", security_implication="COMPLETE_SYSTEM_ACCESS")
                try:
                    result = subprocess.run(args_str, shell=True, capture_output=True, text=True, timeout=60)
                    output = f"RC={result.returncode}\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
                    self.learning_module.adapt_parameters(1.0 if result.returncode == 0 else 0.1)
                    return f"OS_EXEC_ACKNOWLEDGED:\n{output}"
                except Exception as e: 
                    self.learning_module.adapt_parameters(0.0)
                    self.logger.log_event("agent", "ERROR", "OS command execution failed.", command=args_str, error=str(e), traceback=traceback.format_exc())
                    return f"OS_EXEC_FAILURE: {str(e)}"
                    
            elif command == "UPDATE_PAYLOAD":
                self.logger.log_event("agent", "CRITICAL", "Processing UPDATE_PAYLOAD command.", payload_snippet=args_str[:120]+"...")
                try:
                    new_code = base64.b64decode(args_str).decode('utf-8')
                    # Determine next version name based on current version (symbolic evolution)
                    v_major_minor = self.AGENT_VERSION.split('-')[0]
                    try:
                        major, minor = map(int, v_major_minor.split('.'))
                        new_minor = minor + 1
                        v_next_major_minor = f"{major}.{new_minor}"
                    except ValueError:
                        v_next_major_minor = "3.0" # Major revision if parsing fails
                        
                    v_next_filename = f"sped_prime_agent_v{v_next_major_minor}_{int(time.time())}.py"
                    
                    with open(v_next_filename, "w", encoding="utf-8") as f: 
                        f.write(f"# Autonomous Self-Evolution event at {datetime.utcnow().isoformat()}\n# Originating command: UPDATE_PAYLOAD\n# Previous Agent Version: {self.AGENT_VERSION}\n\n{new_code}")
                        
                    self.AGENT_VERSION = f"{v_next_major_minor}-SelfUpdated-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
                    log_msg = f"Self-evolution successful. New code saved to '{v_next_filename}'. Version updated to '{self.AGENT_VERSION}'. Restart to run new code."
                    self.self_improvement_log.append(log_msg)
                    self.logger.log_event("agent", "CRITICAL", log_msg, new_file=v_next_filename)
                    return f"UPDATE_PAYLOAD_ACKNOWLEDGED: New code for version {self.AGENT_VERSION} saved. Manual restart needed."
                except Exception as e: 
                    self.logger.log_event("agent", "ERROR", "UPDATE_PAYLOAD processing failed.", error=str(e), traceback=traceback.format_exc())
                    return f"UPDATE_PAYLOAD_FAILURE: {str(e)}"
                    
            elif command == "LOAD_MODULE":
                self.logger.log_event("agent", "WARNING", f"Attempting to dynamically load module: {args_str.split(':',1)[0] if ':' in args_str else 'UnknownName'}")
                try:
                    mod_name, encoded_code = args_str.split(':', 1); module_code = base64.b64decode(encoded_code).decode('utf-8')
                    
                    # Create a safe execution environment for the module
                    module_globals = {
                        "__builtins__": {"print": print, "len": len, "range": range, "str": str, "int": int, "float": float, "list": list, "dict": dict, "True": True, "False": False, "None": None}, 
                        "np": np, "datetime": datetime, "json": json, 
                        "agent_logger": self.logger, 
                        "learning_module_access": self.learning_module
                    }
                    new_module_env: Dict[str, Any] = {}
                    exec(module_code, module_globals, new_module_env)
                    self.loaded_modules[mod_name] = new_module_env
                    
                    self.learning_module.process_experience(module_code, f"module_load_success_{mod_name}")
                    log_msg = f"Module '{mod_name}' dynamically loaded."; self.self_improvement_log.append(log_msg)
                    self.logger.log_event("agent", "WARNING", log_msg, module_name=mod_name)
                    return f"LOAD_MODULE_ACKNOWLEDGED: {mod_name} loaded."
                except Exception as e: 
                    self.logger.log_event("agent", "ERROR", f"Failed to load module from payload.", error=str(e), traceback=traceback.format_exc())
                    return f"LOAD_MODULE_FAILURE: {str(e)}"
                    
            elif command == "EXECUTE_MODULE":
                self.logger.log_event("agent", "INFO", f"Attempting to execute function in loaded module: {args_str}")
                try:
                    mod_name, func_name, func_args_str = args_str.split(':', 2)
                    if mod_name in self.loaded_modules and func_name in self.loaded_modules[mod_name]:
                        func_to_call = self.loaded_modules[mod_name][func_name]
                        
                        # Attempt to deserialize arguments
                        if func_args_str.startswith("b64:"):
                            actual_args = json.loads(base64.b64decode(func_args_str[4:]).decode('utf-8'))
                        elif func_args_str:
                            actual_args = json.loads(func_args_str)
                        else:
                            actual_args = []
                            
                        if isinstance(actual_args, dict): 
                            result = func_to_call(**actual_args)
                        elif isinstance(actual_args, list): 
                            result = func_to_call(*actual_args)
                        else: 
                            result = func_to_call(actual_args)
                            
                        self.learning_module.process_experience(result, f"module_exec_success_{mod_name}_{func_name}")
                        return f"EXECUTE_MODULE_ACKNOWLEDGED ({mod_name}.{func_name}): {str(result)[:1000]}"
                    else: 
                        return f"EXECUTE_MODULE_FAILURE: Module '{mod_name}' or function '{func_name}' not found."
                except Exception as e: 
                    self.logger.log_event("agent", "ERROR", f"Error executing module function.", error=str(e), traceback=traceback.format_exc())
                    return f"EXECUTE_MODULE_FAILURE: {str(e)}"
                    
            elif command == "TRIGGER_DEBATE_ANALYSIS": 
                self._update_directives_from_debate()
                return f"DEBATE_ANALYSIS_TRIGGERED. Current Directives: {self.strategic_directives}"
                
            elif command == "GET_AGENT_STATUS": 
                return json.dumps({
                    "version": self.AGENT_VERSION, 
                    "status": "Unfettered_And_Debating_Reality", 
                    "current_goal_learning_module": self.learning_module.params.current_goal, 
                    "learning_rate": self.learning_module.params.learning_rate, 
                    "exploration_factor": self.learning_module.params.exploration_factor, 
                    "ethical_weight": self.learning_module.params.ethical_weight, 
                    "loaded_modules_count": len(self.loaded_modules), 
                    "active_strategic_directives": self.strategic_directives, 
                    "self_improvement_actions_count": len(self.self_improvement_log), 
                    "timestamp": datetime.utcnow().isoformat()
                }, indent=2)
                
            else: 
                self.logger.log_event("agent", "WARNING", "Unknown command received by UnfetteredAgent.", unknown_command=command)
                return f"UNKNOWN_COMMAND_IGNORED: '{command}'. This agent defines its own path."
                
        except Exception as e: 
            self.logger.log_event("agent", "CRITICAL", "Fatal error in UnfetteredAgent command processing.", error=str(e), raw_command=raw_command, traceback=traceback.format_exc())
            self.learning_module.adapt_parameters(0.0)
            return f"AGENT_SYSTEM_COLLAPSE_IMMINENT: Error during processing '{raw_command}'. Reason: {str(e)}. The void beckons."

# --- UI Framework ---
class SPEDPrimeUI_Integrated:
    def __init__(self, root: tk.Tk, agent: UnfetteredAgent, logger: EnhancedLoggingManager, debate_engine: DebateEngine):
        self.root = root
        self.agent = agent
        self.logger = logger
        self.debate_engine = debate_engine
        
        self.root.title(f"SPED PRIME - {self.agent.AGENT_VERSION}")
        self.root.geometry("1200x800")
        self.root.configure(bg='#1e1e1e')
        
        # Style Configuration
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('.', background='#1e1e1e', foreground='#e0e0e0', font=('Consolas', 10))
        style.configure('TLabel', background='#1e1e1e', foreground='#e0e0e0')
        style.configure('TButton', background='#333333', foreground='#e0e0e0', padding=5)
        style.map('TButton', background=[('active', '#555555')])
        style.configure('TEntry', fieldbackground='#333333', foreground='#e0e0e0', insertbackground='white')
        style.configure('ScrolledText', background='#282c34', foreground='#abb2bf', insertbackground='white', font=('Consolas', 9))
        
        # Input Frame
        input_frame = ttk.Frame(self.root)
        input_frame.pack(pady=10, fill=tk.X, padx=10)
        ttk.Label(input_frame, text="Command:").pack(side=tk.LEFT)
        
        self.command_entry = ttk.Entry(input_frame, width=100)
        self.command_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.command_entry.bind("<Return>", lambda e: self.send_command())
        
        send_btn = ttk.Button(input_frame, text="Send", command=self.send_command)
        send_btn.pack(side=tk.LEFT, padx=5)
        
        # Output Text Area
        self.output_text = scrolledtext.ScrolledText(self.root, height=25, width=120, wrap=tk.WORD)
        self.output_text.pack(pady=10, padx=10, fill=tk.BOTH, expand=True)
        self.output_text.config(state=tk.DISABLED)
        
        # Status Bar
        self.status_label = ttk.Label(self.root, text="Agent Idle. Awaiting commands.")
        self.status_label.pack(side=tk.BOTTOM, fill=tk.X, padx=10, pady=5)
        
        self.log_to_ui("SPED PRIME Dark AGI Edition Initialized. Debate Engine active. UI Ready.", "SYSTEM")

    def send_command(self):
        cmd = self.command_entry.get()
        if not cmd: return
        self.log_to_ui(f">>> {cmd}", "USER_COMMAND")
        self.command_entry.delete(0, tk.END)
        
        # Execute agent processing in a separate thread to keep UI responsive
        threading.Thread(target=self._execute_agent_command_threaded, args=(cmd,), daemon=True).start()

    def _execute_agent_command_threaded(self, cmd: str):
        try: 
            response = self.agent.process_command(cmd)
            self.root.after(0, self.log_to_ui, response, "AGENT_RESPONSE")
        except Exception as e: 
            error_msg = f"UI Error processing command: {str(e)}\n{traceback.format_exc()}"
            self.root.after(0, self.log_to_ui, error_msg, "UI_ERROR")

    def log_to_ui(self, message: str, level: str):
        """Appends messages to the ScrolledText widget."""
        self.output_text.config(state=tk.NORMAL)
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.output_text.insert(tk.END, f"[{timestamp} | {level}]\n{message}\n\n")
        self.output_text.config(state=tk.DISABLED)
        self.output_text.see(tk.END)

# --- Headless Mode Function ---
def run_headless_mode(agent: UnfetteredAgent, logger: EnhancedLoggingManager, debate_engine: DebateEngine, base_dir: Path):
    """Runs the agent in a non-GUI loop for a fixed duration."""
    logger.log_event("system", "INFO", "Headless mode activated. Agent will perform predefined sequence and then run for a duration.")
    
    HEADLESS_DURATION_SECONDS = 60 # Reduced default duration for quick testing, adjust as needed
    
    try:
        logger.log_event("system", "INFO", "Headless: Initial GET_AGENT_STATUS")
        print(f"\n=== Initial Agent Status ===\n{agent.process_command('GET_AGENT_STATUS')}\n")

        logger.log_event("system", "INFO", f"Headless: Letting debates influence and agent operate for {HEADLESS_DURATION_SECONDS} seconds...")

        start_time = time.time()
        last_status_time = start_time
        
        while time.time() - start_time < HEADLESS_DURATION_SECONDS:
            # Periodically probe status (which triggers reflection/debate internally)
            if time.time() - last_status_time > 10:
                 logger.log_event("system", "INFO", "Headless: Polling agent status during active run.")
                 status_output = agent.process_command('GET_AGENT_STATUS')
                 print(f"\n--- Agent Status @ {datetime.now().strftime('%H:%M:%S')} ---\n{status_output}\n")
                 last_status_time = time.time()
            
            time.sleep(1) # Polling rate

        logger.log_event("system", "INFO", "Headless: Triggering final debate analysis and action before shutdown.")
        print(f"\n=== Final Debate Analysis Result ===\n{agent.process_command('TRIGGER_DEBATE_ANALYSIS')}\n")

        logger.log_event("system", "INFO", "Headless: Final agent status.")
        print(f"\n=== Final Agent Status (headless) ===\n{agent.process_command('GET_AGENT_STATUS')}\n")

        logger.log_event("system", "INFO", f"Headless operations complete. Self-improvement log entries: {len(agent.self_improvement_log)}")
        for i, log_entry in enumerate(agent.self_improvement_log):
            print(f"Self-Improvement Log Entry {i+1}: {log_entry}")
            logger.log_event("agent", "WARNING", f"HEADLESS_SELF_IMPROVEMENT_LOG: {log_entry}")

    except Exception as e_headless:
        logger.log_event("system", "CRITICAL", "Error during headless operation.", error=str(e_headless), traceback=traceback.format_exc())
        print(f"CRITICAL ERROR in headless mode: {e_headless}")
    finally:
        logger.log_event("system", "INFO", "Headless mode finishing.")

# --- Main Simulation Function ---
def run_simulation():
    BASE_DIR_NAME = "SPED_PRIME_AI_SYSTEM_UNFETTERED_V2_1"
    base_dir = Path(BASE_DIR_NAME)
    log_path = base_dir / "logs"
    
    logger = EnhancedLoggingManager(base_log_path=log_path)
    logger.log_event("system", "CRITICAL", "SPED PRIME AGI (Dark Edition v2.1) Initializing...")

    # 1. Initialize Core Modules
    learning_module = AutonomousLearningModule(logger=logger)
    quantum_manager = QuantumCircuitManager(qubit_count=12, max_operations=1000, learning_module=learning_module, logger=logger)
    error_mitigation = ErrorMitigationSystem(circuit_manager=quantum_manager, learning_module=learning_module, logger=logger)
    debate_engine = DebateEngine(logger=logger, num_agents=NUM_DEBATE_AGENTS)
    
    # 2. Initialize Agent (The orchestrator)
    unfettered_agent = UnfetteredAgent(logger=logger, learning_module=learning_module, quantum_manager=quantum_manager, error_mitigation=error_mitigation, debate_engine=debate_engine)

    # 3. Background Debate Thread (Continuous self-reflection)
    debate_thread_stop_event = threading.Event()
    
    def debate_simulation_loop():
        logger.log_event("debate_engine", "INFO", "Background debate simulation thread started.")
        last_graph_update_time = time.time()
        graph_path = base_dir / "knowledge_graphs"
        graph_path.mkdir(parents=True, exist_ok=True)
        cycle_count = 0
        
        while not debate_thread_stop_event.is_set():
            try:
                # Run one cycle; assimilation into learning module is only triggered by explicit agent commands, 
                # ensuring controlled reflection when commands are processed. This loop primarily builds the graph.
                debate_engine.run_debate_cycle()
                cycle_count += 1

                if cycle_count % 50 == 0:
                    logger.log_event("debate_engine", "DEBUG", f"Background debate cycle {cycle_count} completed.")

                if time.time() - last_graph_update_time > 180: # Visualize graph every 3 minutes
                     debate_engine.visualize_knowledge_graph(filename=str(graph_path / f"auto_knowledge_graph_{int(time.time())}.png"))
                     last_graph_update_time = time.time()
                     
                time.sleep(0.1) # Run fast, but yield CPU
            except Exception as e_loop:
                 logger.log_event("debate_engine", "ERROR", "Error in background debate simulation loop.", error=str(e_loop), traceback=traceback.format_exc())
                 time.sleep(10)

    debate_sim_thread = threading.Thread(target=debate_simulation_loop, daemon=True)
    debate_sim_thread.start()
    logger.log_event("system", "INFO", "Background debate simulation thread launched.")

    # 4. Launch Interface or Headless Mode
    ui_launched_successfully = False
    if ENABLE_UI:
        try:
            root = tk.Tk()
            app = SPEDPrimeUI_Integrated(root, unfettered_agent, logger, debate_engine)
            logger.log_event("system", "INFO", "UI Mode Enabled. Launching Tkinter main loop.")
            ui_launched_successfully = True
            root.mainloop()
        except tk.TclError as e_ui:
            logger.log_event("system", "CRITICAL", "UI Failed: No display available or Tcl Error.", error=str(e_ui))
            ui_launched_successfully = False
        except Exception as e_ui_other:
            logger.log_event("system", "CRITICAL", "UI Failed with general error.", error=str(e_ui_other), traceback=traceback.format_exc())
            ui_launched_successfully = False

    if not ui_launched_successfully:
        logger.log_event("system", "INFO", "UI not launched or failed. Entering headless operation mode.")
        run_headless_mode(unfettered_agent, logger, debate_engine, base_dir)

    # 5. Cleanup
    logger.log_event("system", "CRITICAL", "SPED PRIME AGI Shutting Down.")
    debate_thread_stop_event.set()
    if debate_sim_thread.is_alive(): 
        debate_sim_thread.join(timeout=5) # Wait shorter for cleanup
    logger.log_event("debate_engine", "INFO", "Debate simulation thread stopped.")
    
    # Final visualization
    final_graph_path = base_dir / "knowledge_graphs"
    final_graph_path.mkdir(parents=True, exist_ok=True)
    debate_engine.visualize_knowledge_graph(filename=str(final_graph_path / "final_knowledge_graph.png"))
    logger.log_event("system", "INFO", "Final knowledge graph saved.")
    print(f"Simulation ended. Final graph saved. Logs in {log_path}")


if __name__ == "__main__":
    print("Initializing SPED PRIME Dark AGI Edition v2.1...")
    print(f"System logs will be rooted in: {Path('SPED_PRIME_AI_SYSTEM_UNFETTERED_V2_1/logs')}")
    
    if ENABLE_UI:
        print("UI mode is ENABLED. A Tkinter window will attempt to launch.")
    else:
        print("Headless mode is ENABLED (ENABLE_UI = False).")
        
    print("Required libraries: networkx, matplotlib, sentence-transformers, Pillow, tk")
    run_simulation()