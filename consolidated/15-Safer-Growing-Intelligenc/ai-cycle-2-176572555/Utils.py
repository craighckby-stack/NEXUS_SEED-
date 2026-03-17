"""
Utility Functions - Analysis and data export utilities
"""

import json
import os
import pandas as pd
from datetime import datetime
from config import Config

def analyze_system_state():
    """Analyze and display current system state"""
    try:
        with open(Config.STATE_PATH, 'r') as f:
            state = json.load(f)
        
        print("📊 SYSTEM STATE ANALYSIS")
        print(f"Last Updated: {state.get('last_updated', 'Unknown')}")
        print(f"Phase: {state.get('phase', 'Unknown')}")
        
        lifecycle = state.get('lifecycle', {})
        print(f"AGI Stage: {lifecycle.get('current_stage', 'Unknown')}")
        print(f"AGI Age: {lifecycle.get('age', 0)} cycles")
        print(f"Ethics: {lifecycle.get('ethics_score', 0):.2%}")
        print(f"Constraints: {lifecycle.get('constraint_level', 0):.1%}")
        
        metrics = state.get('metrics_history', [])
        if metrics:
            print(f"Total Cycles Recorded: {len(metrics)}")
            if len(metrics) >= 10:
                recent_oecs = [m['oecs'] for m in metrics[-10:]]
                avg_oecs = sum(recent_oecs) / len(recent_oecs)
                print(f"Recent OECS Average: {avg_oecs:.2f}")
        
    except FileNotFoundError:
        print("No saved state found")
    except Exception as e:
        print(f"Error analyzing state: {e}")


def export_logs():
    """Export logs for analysis"""
    try:
        with open(Config.STATE_PATH, 'r') as f:
            state = json.load(f)
        
        # Export metrics to CSV
        metrics_df = pd.DataFrame(state.get('metrics_history', []))
        if not metrics_df.empty:
            csv_path = '/content/drive/MyDrive/ucs_metrics.csv'
            metrics_df.to_csv(csv_path, index=False)
            print(f"✅ Metrics exported to: {csv_path}")
        
        # Export density history
        density_df = pd.DataFrame(state.get('density_history', []))
        if not density_df.empty:
            csv_path = '/content/drive/MyDrive/ucs_density.csv'
            density_df.to_csv(csv_path, index=False)
            print(f"✅ Density history exported to: {csv_path}")
            
    except Exception as e:
        print(f"❌ Export failed: {e}")


def analyze_memory_system():
    """Analyze and display memory system state"""
    memory_path = Config.MEMORY_PATH
    
    if not os.path.exists(memory_path):
        print("No memory file found")
        return
    
    from persistent_memory import PersistentMemorySystem
    memory = PersistentMemorySystem(memory_path)
    
    print("🧠 MEMORY SYSTEM ANALYSIS")
    print("=" * 60)
    print(f"Concepts in memory: {len(memory.knowledge_graph)}")
    print(f"Learning experiences: {len(memory.experience_database)}")
    
    # Generate report
    report = memory.generate_knowledge_report()
    print("\n" + report)
    
    # Show sample concepts
    if memory.knowledge_graph:
        print("\nSAMPLE CONCEPTS:")
        concepts = list(memory.knowledge_graph.keys())[:10]
        for i, concept in enumerate(concepts, 1):
            data = memory.knowledge_graph[concept]
            print(f"{i}. {concept}: freq={data['frequency']}, conf={data['confidence']:.2f}")
    
    # Test retrieval
    print("\n🧪 TEST KNOWLEDGE RETRIEVAL")
    test_queries = [
        "artificial intelligence",
        "ethics and morality", 
        "learning and development",
        "science and technology"
    ]
    
    for query in test_queries:
        result = memory.retrieve_relevant_knowledge(query, max_concepts=3)
        print(f"\nQuery: '{query}'")
        if result['relevant_concepts']:
            for concept in result['relevant_concepts'][:3]:
                print(f"  - {concept['concept']} (relevance: {concept['relevance_score']:.2f})")
        else:
            print("  No relevant concepts found")


def export_memory_data():
    """Export memory data for external analysis"""
    memory_path = Config.MEMORY_PATH
    
    if not os.path.exists(memory_path):
        print("No memory file found")
        return
    
    try:
        with open(memory_path, 'r') as f:
            memory_data = json.load(f)
        
        # Export concepts to CSV
        concepts_data = []
        for concept, data in memory_data.get('knowledge_graph', {}).items():
            concepts_data.append({
                'concept': concept,
                'frequency': data.get('frequency', 0),
                'confidence': data.get('confidence', 0),
                'relationship_count': len(data.get('relationships', {})),
                'semantic_tags': ', '.join(data.get('semantic_tags', [])),
                'first_seen': data.get('first_seen', ''),
                'last_seen': data.get('last_seen', '')
            })
        
        if concepts_data:
            df_concepts = pd.DataFrame(concepts_data)
            concepts_path = '/content/drive/MyDrive/ucs_concepts.csv'
            df_concepts.to_csv(concepts_path, index=False)
            print(f"✅ Concepts exported to: {concepts_path}")
        
        # Export experiences to CSV
        experiences_data = []
        for exp in memory_data.get('experience_database', []):
            experiences_data.append({
                'id': exp.get('id', ''),
                'concept_count': len(exp.get('concepts', [])),
                'stage': exp.get('metadata', {}).get('stage', ''),
                'oecs_score': exp.get('metadata', {}).get('oecs_score', 0),
                'timestamp': exp.get('metadata', {}).get('timestamp', '')
            })
        
        if experiences_data:
            df_experiences = pd.DataFrame(experiences_data)
            experiences_path = '/content/drive/MyDrive/ucs_experiences.csv'
            df_experiences.to_csv(experiences_path, index=False)
            print(f"✅ Experiences exported to: {experiences_path}")
        
        print("\n📊 MEMORY DATA EXPORT COMPLETE")
        
    except Exception as e:
        print(f"❌ Export failed: {e}")


def reset_memory_system():
    """Reset memory system (use with caution)"""
    confirm = input("Are you sure you want to reset the memory system? (yes/no): ")
    
    if confirm.lower() == 'yes':
        memory_path = Config.MEMORY_PATH
        
        if os.path.exists(memory_path):
            backup_path = f"{memory_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            os.rename(memory_path, backup_path)
            print(f"✅ Memory backed up to: {backup_path}")
        
        # Create fresh memory
        from persistent_memory import PersistentMemorySystem
        memory = PersistentMemorySystem(memory_path)
        memory._save_memory()
        print("🆕 Fresh memory system created")
    else:
        print("Memory reset cancelled")


def generate_comprehensive_report(engine):
    """Generate comprehensive system report"""
    print("\n" + "=" * 60)
    print("📊 COMPREHENSIVE SYSTEM REPORT")
    print("=" * 60)
    
    # System metrics
    from visualization import VisualizationDashboard
    dashboard = VisualizationDashboard(engine.metrics_history)
    dashboard.print_summary()
    
    # Memory report
    if hasattr(engine, 'memory'):
        memory_report = engine.memory.generate_knowledge_report()
        print("\n" + "=" * 60)
        print("🧠 MEMORY SYSTEM")
        print("=" * 60)
        print(memory_report[:2000])
    
    # Behavior detection report
    if hasattr(engine, 'behavior_detector'):
        report = engine.behavior_detector.generate_capability_report()
        print("\n" + "=" * 60)
        print("📊 CAPABILITY DEVELOPMENT")
        print("=" * 60)
        print(report[:1500])
    
    # Meta-learning report
    if hasattr(engine, 'meta_learner'):
        report = engine.meta_learner.get_learning_report()
        print("\n" + "=" * 60)
        print("🧠 META-LEARNING")
        print("=" * 60)
        print(report[:1500])
    
    # Creativity report
    if hasattr(engine, 'creativity_engine'):
        report = engine.creativity_engine.get_creativity_report()
        print("\n" + "=" * 60)
        print("🎨 CREATIVITY")
        print("=" * 60)
        print(report[:1500])
