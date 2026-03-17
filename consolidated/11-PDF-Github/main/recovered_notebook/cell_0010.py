import subprocess
import sys
import platform
import cpuinfo
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from packaging import version
from rich import print
from rich.console import Console
from rich.table import Table
import logging
from typing import Dict, Any, List, Tuple

# --- Configuration and Setup ---

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)
console = Console()

MIN_PYTHON_VERSION = "3.8.0"
CORE_DEPENDENCIES = [
    'psutil',
    'matplotlib',
    'rustworkx',
    'dill',
    'scikit-learn',
    'pandas',
    'rich', # Needed for reporting
    'packaging' # Needed for versioning
]

# --- Utility Functions ---

def get_system_info() -> Dict[str, Any]:
    """Collects detailed system and CPU information, returning a dictionary."""
    sys_info = {
        'System Name': platform.system(),
        'Node Name': platform.node(),
        'Release': platform.release(),
        'Version': platform.version(),
        'Machine': platform.machine(),
        'Processor': platform.processor()
    }
    
    # Only include essential CPU details to avoid excessively large output
    cpu_details = cpuinfo.get_cpu_info()
    sys_info['CPU Model'] = cpu_details.get('brand_raw', 'N/A')
    sys_info['Architecture'] = cpu_details.get('arch', 'N/A')
    
    return sys_info

def get_python_info() -> Dict[str, str]:
    """Collects Python version information."""
    version_info = sys.version_info
    return {
        "Python Version": f"{version_info.major}.{version_info.minor}.{version_info.micro}",
        "Minimum Required": MIN_PYTHON_VERSION
    }

def check_dependencies() -> Tuple[Dict[str, str], List[str]]:
    """Checks required packages against installed ones and identifies missing packages.
    Returns installed packages map and list of missing core dependencies.
    """
    installed_map = {}
    try:
        # Using pip show instead of freeze for cleaner name/version extraction if needed
        output = subprocess.check_output([sys.executable, '-m', 'pip', 'list', '--format=freeze'], text=True)
        
        for line in output.strip().split('\n'):
            if '==' in line:
                name, version_str = line.split('==', 1)
                installed_map[name.lower()] = version_str
            
        missing_packages = [pkg for pkg in CORE_DEPENDENCIES if pkg.lower() not in installed_map]
        return installed_map, missing_packages
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Could not run pip command to check dependencies: {e.stderr.strip() if e.stderr else e.output.strip()}")
        return {}, CORE_DEPENDENCIES # Assume all are missing if check fails

def install_missing_dependencies(missing_packages: List[str]):
    """Installs or upgrades the given list of packages."""
    if not missing_packages:
        logger.info("All core dependencies are met.")
        return
    
    console.print(f"\n[bold yellow]Attempting to install {len(missing_packages)} missing dependencies...[/bold yellow]")
    for package in missing_packages:
        try:
            logger.info(f"Installing/Upgrading: {package}")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', package], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info(f"Success: {package}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install {package}: Check connectivity or permissions.")

# --- ML Component (Isolated for better portability) ---

def run_prediction_demo(X_features: List[str] = ['Feature1', 'Feature2']) -> float:
    """Trains a basic linear model and returns the MSE."""
    data = pd.DataFrame({
        'Feature1': [1, 2, 3, 4, 5],
        'Feature2': [2, 3, 5, 7, 11],
        'Target': [3.1, 5.2, 7.3, 11.4, 13.5] # Slight noise added
    })

    X = data[X_features]
    y = data['Target']
    
    # Use a larger split for robust demo, even with small data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.4, random_state=42)

    model = LinearRegression()
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    
    # Return raw metric for reporting
    return mse

# --- Reporting Functions ---

def display_report(sys_info: Dict[str, Any], py_info: Dict[str, str], installed_map: Dict[str, str], missing_packages: List[str]):
    """Displays collected information using rich tables."""

    console.rule("[bold blue]Sovereign AGI System Introspection Report[/bold blue]")

    # 1. System Info Table
    sys_table = Table(title="[green]System Hardware & OS[/green]", show_header=False)
    sys_table.add_column("Key")
    sys_table.add_column("Value")
    for key, value in sys_info.items():
        sys_table.add_row(f"[bold]{key}[/bold]", str(value))
    console.print(sys_table)

    # 2. Python Version Check
    py_status = version.parse(py_info['Python Version']) >= version.parse(py_info['Minimum Required'])
    version_style = "green" if py_status else "red"
    
    console.print(f"\n[bold]Python Runtime:[/bold]", style=version_style)
    console.print(f"  Current Version: {py_info['Python Version']}")
    console.print(f"  Required Minimum: {py_info['Minimum Required']}")
    if not py_status:
        console.print("[bold red]WARNING: Python version does not meet minimum requirements.[/bold red]")

    # 3. Dependency Check Table
    dep_table = Table(title="[yellow]Core Dependency Status[/yellow]")
    dep_table.add_column("Package", style="cyan", justify="left")
    dep_table.add_column("Version", justify="left")
    dep_table.add_column("Status", justify="center")

    for pkg in CORE_DEPENDENCIES:
        name_lower = pkg.lower()
        if name_lower in installed_map:
            dep_table.add_row(pkg, installed_map[name_lower], "[green]INSTALLED[/green]")
        else:
            dep_table.add_row(pkg, "N/A", "[bold red]MISSING[/bold red]")
            
    console.print(dep_table)
    
# --- Main Execution ---

def main():
    try:
        # 1. Data Collection
        sys_info = get_system_info()
        py_info = get_python_info()
        installed_map, missing_packages = check_dependencies()

        # 2. Pre-Check and Installation
        if missing_packages:
            install_missing_dependencies(missing_packages)
            # Re-check to update status after installation attempt
            installed_map, missing_packages = check_dependencies()

        # 3. Report Generation
        display_report(sys_info, py_info, installed_map, missing_packages)

        # 4. Run Demonstration (only if core dependencies related to ML are met)
        if not any(pkg in missing_packages for pkg in ['scikit-learn', 'pandas']):
            mse = run_prediction_demo()
            console.print(f"\n[bold magenta]ML Demonstration Result (Linear Regression):[/bold magenta]")
            console.print(f"  Mean Squared Error: [yellow]{mse:.4f}[/yellow]")
        else:
            console.print("\n[yellow]ML Demo Skipped: Required libraries (pandas/scikit-learn) are missing.[/yellow]")

    except Exception as e:
        logger.critical(f"A fatal error occurred during execution: {e}")

if __name__ == "__main__":
    main()