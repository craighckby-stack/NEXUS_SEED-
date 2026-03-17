import sys
import subprocess
from typing import List

# NOTE: packaging.version is retained for future robust version checks,
# but manual pre-filtering logic has been removed to rely on pip's inherent robustness.
# from packaging import version # Not strictly needed after refactor


def _get_required_packages() -> List[str]:
    """
    Defines the list of required packages and their version constraints.
    
    :return: A list of package requirement strings.
    """
    # NOTE: For complex projects, this list should ideally be externalized (e.g., requirements.txt).
    return [
        "psutil",
        "matplotlib",
        "rustworkx>=0.15.0",
        "scipy>=1.5",
        "sympy>=1.3",
        "dill>=0.3",
        "stevedore>=3.0.0",
        "symengine<0.14,>=0.11",
        "contourpy>=1.0.1",
        "cycler>=0.10",
        "fonttools>=4.22.0",
        "kiwisolver>=1.3.1",
        "packaging>=20.0",
        "pillow>=8",
        "pyparsing>=2.3.1",
        "six>=1.5",
        "pbr>=2.0.0",
        "mpmath<1.4,>=1.1.0",
        "setuptools",
        "qiskit==1.4.1"
    ]


def install_packages(packages: List[str]) -> None:
    """
    Install a list of packages using pip in a single batch operation.
    
    This approach is more efficient and reliable than iterating through
    packages or attempting manual dependency resolution checks, as pip
    automatically handles skipping satisfied dependencies.

    :param packages: A list of package requirement strings to be installed.
    """
    if not packages:
        print("No packages defined for installation.")
        return

    try:
        command = [sys.executable, "-m", "pip", "install", "--upgrade"] + packages
        print(f"Attempting batch installation of {len(packages)} requirements...")

        # Use subprocess.run for better handling of output and checking return codes
        subprocess.run(
            command,
            check=True, # Raise CalledProcessError if non-zero exit status
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )
        print("Installation finished successfully. Check logs for skip status.")

    except subprocess.CalledProcessError as e:
        print(f"\n--- FATAL PIP INSTALLATION ERROR ---")
        print(f"Failed to install one or more packages.")
        print(f"Command: {' '.join(command)}")
        print(f"Return Code: {e.returncode}")
        print(f"Error Output:\n{e.stderr.strip()[:2000]}...")
        print("------------------------------------")

    except FileNotFoundError:
        print("Error: Python executable or pip module not found.")


if __name__ == "__main__":
    packages_to_install = _get_required_packages()
    install_packages(packages_to_install)