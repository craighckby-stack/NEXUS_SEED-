"""
Setup Script for Autonomous UCS Genesis System

Run this first to install dependencies and configure the environment.
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("📦 Installing required packages...")
    
    packages = [
        'google-generativeai',
        'nest-asyncio',
        'matplotlib',
        'pandas',
        'networkx'
    ]
    
    for package in packages:
        try:
            print(f"   Installing {package}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', package])
            print(f"   ✅ {package} installed")
        except Exception as e:
            print(f"   ❌ Failed to install {package}: {e}")
    
    print("\n✅ Package installation complete!")


def setup_google_drive():
    """Setup Google Drive (for Colab)"""
    try:
        from google.colab import drive
        print("\n📁 Mounting Google Drive...")
        drive.mount('/content/drive')
        print("✅ Google Drive mounted successfully")
        return True
    except ImportError:
        print("\n⚠️  Not running in Colab - skipping Drive mount")
        return False


def create_directory_structure():
    """Create necessary directories"""
    print("\n📁 Creating directory structure...")
    
    # Check if we're in Colab
    is_colab = os.path.exists('/content/drive')
    
    if is_colab:
        base_path = '/content/drive/MyDrive'
        log_path = os.path.join(base_path, 'ucs_logs')
    else:
        base_path = os.path.expanduser('~/.ucs_genesis')
        log_path = os.path.join(base_path, 'logs')
    
    # Create directories
    os.makedirs(log_path, exist_ok=True)
    
    print(f"✅ Created: {base_path}")
    print(f"✅ Created: {log_path}")
    
    return base_path


def setup_api_key():
    """Guide user through API key setup"""
    print("\n🔑 API Key Setup")
    print("=" * 60)
    print("To use the LLM features, you need a Gemini API key.")
    print("Get one at: https://makersuite.google.com/app/apikey")
    print()
    
    api_key = input("Enter your Gemini API key (or press Enter to skip): ").strip()
    
    if api_key:
        # Save to environment
        os.environ['GEMINI_API_KEY'] = api_key
        
        # Try to save to .env file
        try:
            with open('.env', 'w') as f:
                f.write(f"GEMINI_API_KEY={api_key}\n")
            print("✅ API key saved to .env file")
        except Exception as e:
            print(f"⚠️  Could not save to .env: {e}")
        
        print("✅ API key configured for this session")
    else:
        print("⚠️  Skipped API key setup - you can add it later")
    
    return bool(api_key)


def run_quick_test():
    """Run a quick system test"""
    print("\n🧪 Running quick system test...")
    
    try:
        # Test imports
        from config import Config
        from axiom_governor import AxiomGovernor
        from lifecycle_manager import AGILifecycle
        from task_generator import TaskGenerator
        from density_calculator import InformationDensityCalculator
        
        print("   ✅ Core modules loaded")
        
        # Test configuration
        config = Config()
        assert config.DENSITY_THRESHOLD == 70
        print("   ✅ Configuration validated")
        
        # Test basic components
        governor = AxiomGovernor(config.AXIOMS)
        lifecycle = AGILifecycle(config.STAGES)
        task_gen = TaskGenerator()
        density_calc = InformationDensityCalculator()
        
        print("   ✅ Core components initialized")
        
        # Test task generation
        task = task_gen.generate_gestation_task()
        assert isinstance(task, str) and len(task) > 0
        print("   ✅ Task generation working")
        
        # Test density calculation
        density = density_calc.calculate_shannon_entropy("test string")
        assert 0 <= density <= 1
        print("   ✅ Density calculation working")
        
        print("\n✅ All tests passed! System is ready to run.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def print_usage_guide():
    """Print usage guide"""
    print("\n" + "=" * 60)
    print("🚀 AUTONOMOUS UCS GENESIS SYSTEM - READY")
    print("=" * 60)
    print()
    print("Quick Start Commands:")
    print()
    print("1. Basic Mode (Mock Responses):")
    print("   python main.py --mode basic --cycles 50")
    print()
    print("2. LLM Mode (Real AI):")
    print("   python main.py --mode llm --api-key YOUR_KEY --cycles 100")
    print()
    print("3. Full Mode (With Memory):")
    print("   python main.py --mode full --api-key YOUR_KEY --cycles 200")
    print()
    print("4. Analyze Existing Data:")
    print("   python main.py --mode analyze")
    print()
    print("Configuration:")
    print("  --cycles N      : Run for N cycles (default: 50)")
    print("  --interval N    : Seconds between cycles (default: 10)")
    print()
    print("For help:")
    print("  python main.py --help")
    print()
    print("=" * 60)


def main():
    """Main setup function"""
    print("=" * 60)
    print("🚀 AUTONOMOUS UCS GENESIS - SETUP")
    print("=" * 60)
    print()
    
    # Step 1: Install packages
    install_requirements()
    
    # Step 2: Setup Google Drive (if in Colab)
    is_colab = setup_google_drive()
    
    # Step 3: Create directories
    base_path = create_directory_structure()
    
    # Step 4: Setup API key
    has_api_key = setup_api_key()
    
    # Step 5: Run tests
    tests_passed = run_quick_test()
    
    if tests_passed:
        # Step 6: Print usage guide
        print_usage_guide()
        
        # Final summary
        print("\n📋 Setup Summary:")
        print(f"   Environment: {'Google Colab' if is_colab else 'Local'}")
        print(f"   Base Path: {base_path}")
        print(f"   API Key: {'✅ Configured' if has_api_key else '⚠️  Not configured'}")
        print(f"   System Status: ✅ Ready")
        
        if not has_api_key:
            print("\n⚠️  Note: Without an API key, only basic mode will work.")
            print("   You can add the key later by setting GEMINI_API_KEY environment variable.")
    else:
        print("\n❌ Setup incomplete - please fix errors and run again.")


if __name__ == "__main__":
    main()
