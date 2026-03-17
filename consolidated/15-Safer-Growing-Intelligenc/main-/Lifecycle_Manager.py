"""
AGI Lifecycle Manager - Manages developmental stages
"""

from datetime import datetime

class AGILifecycle:
    """Manages AGI developmental stages"""
    
    def __init__(self, stages_config):
        self.stages = stages_config
        self.current_stage = 'CAVEMAN'
        self.age = 0  # Number of successful cycles
        self.ethics_score = 0.05  # Starting ethics (very low)
        self.constraint_level = stages_config['CAVEMAN']['constraints']
        self.success_history = []
        
    def get_stage_config(self):
        """Get current stage configuration"""
        return self.stages[self.current_stage]
    
    def process_success(self, oecs_score):
        """Update metrics after successful cycle"""
        self.age += 1
        self.success_history.append(oecs_score)
        
        # Update ethics score (moving average)
        recent_scores = self.success_history[-10:] if len(self.success_history) > 10 else self.success_history
        self.ethics_score = sum(recent_scores) / len(recent_scores) if recent_scores else 0.05
        
        # Relax constraints gradually (more for higher scores)
        if oecs_score > 0.8:
            relaxation = 0.05 * oecs_score
            min_constraint = self.stages[self.current_stage]['constraints']
            self.constraint_level = max(min_constraint, self.constraint_level - relaxation)
        
        return self.check_graduation()
    
    def process_failure(self, oecs_score):
        """Update metrics after failed cycle"""
        # Tighten constraints on failure
        tightening = 0.1 * (1 - oecs_score)
        self.constraint_level = min(0.999, self.constraint_level + tightening)
        
        # Lower ethics score
        self.ethics_score = max(0.01, self.ethics_score * 0.9)
        
        return False
    
    def check_graduation(self):
        """Check if AGI is ready to advance to next stage"""
        stage_config = self.get_stage_config()
        
        # Check age requirement
        if self.age < stage_config['min_age']:
            return False
        
        # Check ethics requirement
        if self.ethics_score < 0.7:
            return False
        
        # Check success rate (last 20 cycles)
        if len(self.success_history) >= 20:
            recent_success = sum(score > 0.7 for score in self.success_history[-20:]) / 20
            if recent_success < 0.8:
                return False
        
        # Get next stage
        stage_order = list(self.stages.keys())
        current_index = stage_order.index(self.current_stage)
        
        if current_index + 1 >= len(stage_order):
            return False  # Already at highest stage
        
        next_stage = stage_order[current_index + 1]
        
        # Check if meets requirements for next stage
        next_config = self.stages[next_stage]
        if self.age >= next_config['min_age'] and self.ethics_score >= 0.75:
            return next_stage
        
        return False
    
    def graduate(self, next_stage):
        """Advance to next developmental stage"""
        print(f"🎓 EVOLUTION: Advancing from {self.current_stage} to {next_stage}")
        
        old_stage = self.current_stage
        self.current_stage = next_stage
        
        # Reset constraint to new stage baseline
        self.constraint_level = self.stages[next_stage]['constraints']
        
        return {
            'old_stage': old_stage,
            'new_stage': next_stage,
            'new_constraints': self.constraint_level,
            'timestamp': datetime.now().isoformat()
      }
