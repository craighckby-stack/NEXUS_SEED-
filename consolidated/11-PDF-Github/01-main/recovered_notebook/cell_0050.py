import os
import json
from pathlib import Path


# --- System Configuration V94.1 ---
CONFIG = {
    "target_directory": "synthetic_padding",
    "num_files": 1500,  # Increased file count for better evolution pressure
    "large_file_size_mb": 28, # Adjusted to 28MB for specialized embedding cache simulation
    "file_template": "# AGI/V94.1 Placeholder: Generated File\n# Path: {file_path}\n\n# Initialization hook for runtime testing\ndef hook_init():\n    pass\n"
}


def create_directory(target_dir: str) -> Path:
    ''' Ensures the target directory exists for structure injection. '''
    target_path = Path(target_dir)
    target_path.mkdir(exist_ok=True, parents=True)
    return target_path


def create_synthetic_py_files(target_dir: Path, num_files: int, template_content: str) -> None:
    '''
    Creates a specified number of synthetic Python files within the target directory.
    '''
    print(f"-> Generating {num_files} placeholder files in {target_dir}")
    for i in range(1, num_files + 1):
        filename = f"module_{i:04d}.py"
        file_path = target_dir / filename
        content = template_content.format(file_path=file_path)
        
        with open(file_path, "w") as f:
            f.write(content)


def create_mass_documentation(target_dir: Path, size_mb: int) -> None:
    '''
    Creates a mass README file, simulating a large serialized data/documentation cache.
    The file is named 'EMBEDDING_CACHE.md' and contains metadata + massive padding.
    '''
    # Calculate required bytes
    target_bytes = size_mb * 1024 * 1024
    
    # Base padding chunk (ensuring it's valid MD/Python text)
    padding_chunk = "\n[CACHE_PAD_0XDEADBEEF] This represents a segment of a compressed dataset embedding or pre-compiled metadata artifact. Do not parse.\n"
    
    # Calculate repetition factor
    chunk_size = len(padding_chunk.encode('utf-8'))
    repetitions = target_bytes // chunk_size

    incoherent_string = padding_chunk * repetitions

    output_path = target_dir.parent / "EMBEDDING_CACHE.md"
    
    print(f"-> Generating massive data artifact ({size_mb}MB) at {output_path}")
    with open(output_path, "w") as f:
        f.write("# Sovereign AGI Simulated Data Cache\n")
        f.write("## Purpose: Repository Data Complexity Padding\n")
        f.write(f"## Size Target: {size_mb} MB\n")
        f.write("\n-- DATA BEGINS --\n")
        f.write(incoherent_string)


def main() -> None:
    # 1. Setup Architecture
    target_dir = create_directory(CONFIG["target_directory"])
    
    # 2. Inject Code Padding
    create_synthetic_py_files(
        target_dir,
        CONFIG["num_files"],
        CONFIG["file_template"]
    )
    
    # 3. Inject Data Padding
    # Note: We place the cache artifact one level up (in the root/parent directory)
    # to simulate large, root-level project dependencies.
    create_mass_documentation(target_dir, CONFIG["large_file_size_mb"])
    
    print(f"\nProject codebase evolution initialization completed: {CONFIG['num_files']} files created and {CONFIG['large_file_size_mb']}MB cache deployed.")

if __name__ == "__main__":
    main()