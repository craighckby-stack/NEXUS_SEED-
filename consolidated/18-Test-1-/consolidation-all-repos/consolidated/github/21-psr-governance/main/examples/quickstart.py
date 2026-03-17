"""
PSR Governance - Quickstart Example
=================================

Get governance in 5 minutes.

This example demonstrates the simplest way to add
governance to your self-modifying system.
"""

from psr_governance import FluxNode, IntegratedTestRunner


# ========================================================================
# STEP 1: Define Your Self-Modifying System
# ========================================================================

class MyAdaptiveSystem(FluxNode):
    """
    Your adaptive logic here.
    
    The FluxNode base class provides:
    - Automatic structure evolution (list → set)
    - Automatic strategy adaptation (numeric → text)
    - Automatic emergent behavior spawning
    - Complete audit trail of all mutations
    """
    
    def process_data(self, data):
        """Add your custom processing logic."""
        # Your custom logic here
        result = super().interact(data, "processing")
        return result


# ========================================================================
# STEP 2: Define Your Test
# ========================================================================

def test_my_system():
    """Test function that exercises all evolutionary paths."""
    system = MyAdaptiveSystem("quickstart-demo")
    
    # Phase 1: Numeric data (triggers structural evolution)
    print("\n=== Phase 1: Numeric Processing ===")
    for i in range(35):
        result = system.interact(i, "numeric")
    
    # Phase 2: Text data (triggers functional adaptation)
    print("\n=== Phase 2: Text Processing ===")
    for i in range(10):
        result = system.interact(f"text_{i}", "text")
    
    # Phase 3: High-frequency pattern (triggers emergent behavior)
    print("\n=== Phase 3: High-Frequency Pattern ===")
    for i in range(10):
        result = system.interact("ping", "heartbeat")
    
    # Return system and metrics for validation
    return system, {
        'interactions': system.metrics.total_interactions,
        'structural_transitions': system.metrics.structural_transitions,
        'functional_transitions': system.metrics.functional_transitions,
        'emergent_behaviors': system.metrics.emergent_behaviors
    }


# ========================================================================
# STEP 3: Run with Performance Gates
# ========================================================================

if __name__ == "__main__":
    print("""
╔════════════════════════════════════════════════════════════╗
║  PSR Governance - Quickstart Demo                             ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    # Create test runner
    runner = IntegratedTestRunner(mode='baseline')
    
    # Run test with performance gates
    runner.run_test(
        test_func=test_my_system,
        test_name="quickstart_demo",
        budget_name="evolution_cycle"
    )
    
    # Print summary
    gate_passed = runner.print_summary()
    
    if gate_passed:
        print("\n✅ Success! Your system is governed.")
        print("\nNext steps:")
        print("  1. Modify MyAdaptiveSystem with your logic")
        print("  2. Run in 'validate' mode for PRs")
        print("  3. Run in 'enforce' mode for production")
    else:
        print("\n❌ Performance budget violations detected.")
        print("  Review the output above and optimize your system.")
    
    print("\n📖 Learn more:")
    print("  - docs/quickstart.md")
    print("  - docs/architecture.md")
    print("  - https://github.com/craighckby-stack/psr-governance")
