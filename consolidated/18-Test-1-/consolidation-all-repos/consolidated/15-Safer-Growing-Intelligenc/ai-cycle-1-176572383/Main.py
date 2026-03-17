"""
Main Entry Point - Run the Autonomous UCS Genesis System

Usage Examples:
    # Basic system (mock responses):
    python main.py --mode basic --cycles 50

    # With real LLM:
    python main.py --mode llm --api-key YOUR_KEY --cycles 100

    # Full system with memory:
    python main.py --mode full --api-key YOUR_KEY --cycles 200

    # Analysis only:
    python main.py --mode analyze
"""

import asyncio
import os
import argparse
from datetime import datetime

# Import all modules
from config import Config
from autonomous_engine import (
    AutonomousEngine, 
    AutonomousEngineWithLLM, 
    AutonomousEngineWithMemory
)
from visualization import VisualizationDashboard
from utils import (
    analyze_system_state,
    export_logs,
    analyze_memory_system,
    export_memory_data,
    generate_comprehensive_report
)


async def run_basic_system(config, max_cycles=50):
    """Run basic system with mock responses"""
    print("🚀 RUNNING BASIC AUTONOMOUS UCS")
    print("   (Using mock responses)")
    print("=" * 60)
    
    engine = AutonomousEngine(config)
    
    # Override max cycles
    original_max = engine.config.MAX_CYCLES
    engine.config.MAX_CYCLES = max_cycles
    
    try:
        await engine.run()
    except KeyboardInterrupt:
        print("\n\n🛑 Stopped by user")
    finally:
        engine.config.MAX_CYCLES = original_max
        
        # Generate reports
        dashboard = VisualizationDashboard(engine.metrics_history)
        dashboard.print_summary()
        
        # Save state
        await engine._save_state()
        export_logs()
        
        # Plot results
        try:
            dashboard.plot_progress()
        except Exception as e:
            print(f"Could not generate plots: {e}")


async def run_llm_system(config, api_key, max_cycles=100):
    """Run system with real LLM integration"""
    print("🚀 RUNNING AUTONOMOUS UCS WITH REAL LLM")
    print("   (Using Gemini API)")
    print("=" * 60)
    
    engine = AutonomousEngineWithLLM(config, api_key)
    
    # Override max cycles
    original_max = engine.config.MAX_CYCLES
    engine.config.MAX_CYCLES = max_cycles
    
    # Replace genesis cycle with enhanced version
    engine._genesis_cycle = engine._genesis_cycle_enhanced
    
    try:
        await engine.run()
    except KeyboardInterrupt:
        print("\n\n🛑 Stopped by user")
    finally:
        engine.config.MAX_CYCLES = original_max
        
        # Generate comprehensive reports
        generate_comprehensive_report(engine)
        
        # Save state
        await engine._save_state()
        export_logs()
        
        # Plot results
        try:
            dashboard = VisualizationDashboard(engine.metrics_history)
            dashboard.plot_progress()
        except Exception as e:
            print(f"Could not generate plots: {e}")


async def run_full_system(config, api_key, max_cycles=200):
    """Run full system with memory"""
    print("🚀 RUNNING FULL AUTONOMOUS UCS WITH PERSISTENT MEMORY")
    print("   (Using Gemini API + Memory System)")
    print("=" * 60)
    
    engine = AutonomousEngineWithMemory(config, api_key)
    
    # Display memory status
    print(f"\nMemory status:")
    print(f"  Concepts in memory: {len(engine.memory.knowledge_graph)}")
    print(f"  Experiences stored: {len(engine.memory.experience_database)}")
    print(f"  Pending consolidation: {len(engine.memory.consolidation_queue)}")
    
    # Override max cycles
    original_max = engine.config.MAX_CYCLES
    engine.config.MAX_CYCLES = max_cycles
    
    # Replace genesis cycle with memory-enhanced version
    engine._genesis_cycle = engine._genesis_cycle_with_memory
    
    try:
        await engine.run()
    except KeyboardInterrupt:
        print("\n\n🛑 Stopped by user")
    finally:
        engine.config.MAX_CYCLES = original_max
        
        # Generate comprehensive reports
        print("\n" + "=" * 60)
        print("📊 GENERATING FINAL REPORTS")
        print("=" * 60)
        
        generate_comprehensive_report(engine)
        
        # Save final state
        await engine._save_state()
        engine.memory._save_memory()
        print("\n💾 Final state and memory saved")
        
        # Export data
        export_logs()
        export_memory_data()
        
        # Visualizations
        try:
            dashboard = VisualizationDashboard(engine.metrics_history)
            dashboard.plot_progress()
            
            # Visualize knowledge graph if available
            if hasattr(engine, 'memory'):
                print("\n📈 Visualizing knowledge graph...")
                engine.memory.visualize_knowledge_graph(max_nodes=25)
        except Exception as e:
            print(f"Could not generate visualizations: {e}")


def run_analysis():
    """Run analysis on existing data"""
    print("📊 RUNNING SYSTEM ANALYSIS")
    print("=" * 60)
    
    # Analyze system state
    print("\n1. SYSTEM STATE:")
    analyze_system_state()
    
    # Analyze memory
    print("\n2. MEMORY SYSTEM:")
    analyze_memory_system()
    
    # Export data
    print("\n3. EXPORTING DATA:")
    export_logs()
    export_memory_data()


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Autonomous UCS Genesis System',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Basic mode:     python main.py --mode basic --cycles 50
  LLM mode:       python main.py --mode llm --api-key YOUR_KEY --cycles 100
  Full mode:      python main.py --mode full --api-key YOUR_KEY --cycles 200
  Analysis:       python main.py --mode analyze
        """
    )
    
    parser.add_argument(
        '--mode',
        choices=['basic', 'llm', 'full', 'analyze'],
        default='basic',
        help='Execution mode (default: basic)'
    )
    
    parser.add_argument(
        '--api-key',
        type=str,
        help='Gemini API key (required for llm and full modes)'
    )
    
    parser.add_argument(
        '--cycles',
        type=int,
        default=50,
        help='Maximum number of cycles to run (default: 50)'
    )
    
    parser.add_argument(
        '--interval',
        type=int,
        default=10,
        help='Seconds between cycles (default: 10)'
    )
    
    args = parser.parse_args()
    
    # Initialize configuration
    config = Config()
    config.CYCLE_INTERVAL = args.interval
    
    # Check API key for modes that need it
    if args.mode in ['llm', 'full']:
        api_key = args.api_key or os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("❌ Error: API key required for this mode")
            print("   Provide via --api-key or GEMINI_API_KEY environment variable")
            return
    
    # Run selected mode
    try:
        if args.mode == 'basic':
            await run_basic_system(config, args.cycles)
        
        elif args.mode == 'llm':
            await run_llm_system(config, api_key, args.cycles)
        
        elif args.mode == 'full':
            await run_full_system(config, api_key, args.cycles)
        
        elif args.mode == 'analyze':
            run_analysis()
        
        print("\n" + "=" * 60)
        print("🎉 EXECUTION COMPLETE")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Setup for different environments
    try:
        import nest_asyncio
        nest_asyncio.apply()
        print("✅ Configured for Jupyter/Colab environment")
    except ImportError:
        pass
    
    # Run main
    asyncio.run(main())
