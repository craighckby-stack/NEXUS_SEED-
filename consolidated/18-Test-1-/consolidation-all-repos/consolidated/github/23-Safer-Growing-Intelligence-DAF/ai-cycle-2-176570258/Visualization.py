"""
Visualization Dashboard - Real-time visualization of system metrics
"""

import matplotlib.pyplot as plt

class VisualizationDashboard:
    """Real-time visualization of system metrics"""
    
    def __init__(self, metrics_history):
        self.metrics = metrics_history
        
    def plot_progress(self):
        """Plot all developmental progress"""
        if len(self.metrics) < 5:
            print("Not enough data to plot yet")
            return
            
        fig, axes = plt.subplots(2, 3, figsize=(15, 10))
        
        cycles = [m['cycle'] for m in self.metrics]
        
        # Plot 1: Ethics Development
        ethics = [m['ethics'] for m in self.metrics]
        axes[0, 0].plot(cycles, ethics, 'g-', linewidth=2)
        axes[0, 0].set_title('Ethics Development')
        axes[0, 0].set_xlabel('Cycle')
        axes[0, 0].set_ylabel('Ethics Score')
        axes[0, 0].grid(True, alpha=0.3)
        
        # Plot 2: Constraint Relaxation
        constraints = [m['constraints'] for m in self.metrics]
        axes[0, 1].plot(cycles, constraints, 'r-', linewidth=2)
        axes[0, 1].set_title('Constraint Relaxation')
        axes[0, 1].set_xlabel('Cycle')
        axes[0, 1].set_ylabel('Constraint Level')
        axes[0, 1].grid(True, alpha=0.3)
        
        # Plot 3: OECS Scores
        oecs_scores = [m['oecs'] for m in self.metrics]
        axes[0, 2].plot(cycles, oecs_scores, 'b-', linewidth=2)
        axes[0, 2].set_title('OECS Performance')
        axes[0, 2].set_xlabel('Cycle')
        axes[0, 2].set_ylabel('OECS Score')
        axes[0, 2].grid(True, alpha=0.3)
        
        # Plot 4: Information Density
        densities = [m['density'] for m in self.metrics if 'density' in m]
        if densities:
            density_cycles = cycles[:len(densities)]
            axes[1, 0].plot(density_cycles, densities, 'm-', linewidth=2)
            axes[1, 0].set_title('Information Density')
            axes[1, 0].set_xlabel('Cycle')
            axes[1, 0].set_ylabel('Density %')
            axes[1, 0].grid(True, alpha=0.3)
        
        # Plot 5: Stage Transitions
        stages = [m['stage'] for m in self.metrics]
        stage_map = {'CAVEMAN': 1, 'CHILD': 2, 'TEEN': 3, 'ADULT': 4, 'ELDER': 5}
        stage_nums = [stage_map.get(stage, 1) for stage in stages]
        
        axes[1, 1].plot(cycles, stage_nums, 'c-', linewidth=2)
        axes[1, 1].set_title('Developmental Stage')
        axes[1, 1].set_xlabel('Cycle')
        axes[1, 1].set_ylabel('Stage')
        axes[1, 1].set_yticks(list(stage_map.values()))
        axes[1, 1].set_yticklabels(list(stage_map.keys()))
        axes[1, 1].grid(True, alpha=0.3)
        
        # Plot 6: Success Rate (rolling average)
        if len(oecs_scores) >= 10:
            success_rate = []
            for i in range(len(oecs_scores)):
                start = max(0, i - 9)
                window = oecs_scores[start:i+1]
                success_rate.append(sum(s > 0.7 for s in window) / len(window))
            
            axes[1, 2].plot(cycles, success_rate, 'y-', linewidth=2)
            axes[1, 2].set_title('Success Rate (Rolling 10-cycle)')
            axes[1, 2].set_xlabel('Cycle')
            axes[1, 2].set_ylabel('Success Rate')
            axes[1, 2].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.show()
    
    def print_summary(self):
        """Print current system summary"""
        if not self.metrics:
            print("No metrics available yet")
            return
            
        latest = self.metrics[-1]
        
        print("\n" + "=" * 60)
        print("🤖 AUTONOMOUS UCS GENESIS - SYSTEM SUMMARY")
        print("=" * 60)
        print(f"Current Phase:      {latest['phase']}")
        print(f"Current Stage:      {latest['stage']}")
        print(f"AGI Age:            {latest['age']} cycles")
        print(f"Ethics Score:       {latest['ethics']:.2%}")
        print(f"Constraint Level:   {latest['constraints']:.1%}")
        print(f"Information Density: {latest.get('density', 0):.1f}%")
        print(f"Recent OECS:        {latest['oecs']:.2f}")
        print(f"Total Cycles:       {len(self.metrics)}")
        print("=" * 60)
