import os
import uuid
from typing import Union

class SecureEraser:
    """
    Implements a robust file erasure mechanism based on multiple overwrite passes 
    to prevent forensic data recovery. It utilizes chunking to handle large files 
    without memory exhaustion.
    
    Improvements include dynamic pattern handling, robust metadata cleanup (rename + directory fsync),
    and optional support for standard sequences (e.g., DoD 3-pass).
    """
    
    # Define standard patterns for external reference and sequence generation
    PATTERNS = {
        "RANDOM": None, # Special marker for os.urandom
        "ZERO": 0x00,
        "ONE": 0xFF, 
        "AA": 0xAA, # 10101010
        "55": 0x55  # 01010101
    }
    
    def __init__(self, passes: int = 7):
        if passes < 1:
            raise ValueError("Pass count must be 1 or greater.")
        self.passes = passes
        # Use 16 MB chunks for large file streaming efficiency
        self.CHUNK_SIZE = 1024 * 1024 * 16 

    def _write_pattern(self, f, file_size: int, pattern_specifier: Union[str, int]):
        """
        Helper to write patterns chunk by chunk across the entire file size.
        pattern_specifier can be 'RANDOM', 'ZERO', or a single byte integer (0-255).
        The file pointer is set to 0 by this method.
        """
        f.seek(0)
        remaining = file_size
        
        # Determine data generation method
        if pattern_specifier == "RANDOM":
            generate_data = lambda size: os.urandom(size)
        elif pattern_specifier == "ZERO":
            generate_data = lambda size: b'\x00' * size
        elif isinstance(pattern_specifier, int) and 0 <= pattern_specifier <= 255:
            byte_pattern = bytes([pattern_specifier])
            generate_data = lambda size: byte_pattern * size
        else:
            raise ValueError(f"Unknown or invalid pattern specifier: {pattern_specifier}")
        
        while remaining > 0:
            chunk_size = min(self.CHUNK_SIZE, remaining)
            data = generate_data(chunk_size)
            
            f.write(data)
            remaining -= chunk_size
        
        # Ensure the file size remains exactly the original size.
        f.truncate(file_size)


    def secure_erase(self, file_path: str) -> bool:
        original_path = file_path
        
        # Pre-checks
        if not os.path.exists(original_path):
            return True
        if os.path.islink(original_path):
            print(f"Warning: Skipping symbolic link: {original_path}")
            return False
        if not os.path.isfile(original_path):
            print(f"Warning: Skipping non-regular file or special path: {original_path}")
            return False

        try:
            file_size = os.path.getsize(original_path)
            
            # --- OVERWRITE SEQUENCE DEFINITION ---
            # Override sequence for specific standard compliance, if desired.
            if self.passes == 3:
                # Implement a 3-pass DoD 5220.22-M style sequence
                overwrite_sequence = [
                    self.PATTERNS["ZERO"], # Pass 1: 0x00
                    self.PATTERNS["ONE"],  # Pass 2: 0xFF
                    self.PATTERNS["RANDOM"] # Pass 3: Random
                ]
            else:
                # Default sequence: N-1 RANDOM, 1 ZERO
                overwrite_sequence = [self.PATTERNS["RANDOM"]] * (self.passes - 1)
                overwrite_sequence.append(self.PATTERNS["ZERO"])

            # Open the file for binary reading/writing, avoiding standard OS buffering if possible
            with open(original_path, 'rb+', buffering=0) as f:
                
                print(f"Starting secure erase ({len(overwrite_sequence)} passes) for {original_path} (Size: {file_size/1024/1024:.2f} MB)")
                
                for i, pattern in enumerate(overwrite_sequence):
                    specifier = pattern if pattern is not None else "RANDOM"
                    
                    print(f"  Pass {i + 1}/{len(overwrite_sequence)}: {specifier if isinstance(specifier, str) else hex(specifier)}")
                    
                    self._write_pattern(f, file_size, specifier)
                    
                    # Force physical writes to the disk media
                    os.fsync(f.fileno())
                    
            # --- File System Metadata Obfuscation ---
            
            temp_dir = os.path.dirname(original_path)
            # Use UUID for maximum entropy in temporary filename
            temp_filename = "tmp_erase_" + str(uuid.uuid4()).replace('-', '')
            temp_path = os.path.join(temp_dir, temp_filename)

            # 1. Rename the file
            file_to_delete = original_path
            try:
                os.rename(original_path, temp_path)
                file_to_delete = temp_path 
                print(f"Successfully renamed original file to temporary name.")
            except OSError as e:
                print(f"Warning: Failed to rename file ({original_path}). Deleting under original name: {e}")
                # file_to_delete remains original_path
            
            # 2. Delete the file entry
            os.remove(file_to_delete)
            
            # 3. Force directory synchronization (CRUCIAL for metadata security)
            # Ensures that the deletion of the directory entry is committed to disk.
            try:
                if temp_dir:
                    dir_fd = os.open(temp_dir, os.O_RDONLY)
                    try:
                        os.fsync(dir_fd)
                        print("Successfully synchronized directory metadata.")
                    finally:
                        os.close(dir_fd)
            except Exception as e:
                print(f"Warning: Failed to synchronize parent directory metadata: {e}")

            return True
        
        except PermissionError:
            print(f"Error: Permission denied attempting to erase {original_path}")
            return False
        except ValueError as ve:
            print(f"Configuration or pattern error during secure erase: {ve}")
            return False
        except Exception as e:
            print(f"Critical failure during secure erase of {original_path}: {type(e).__name__}: {e}")
            return False

def main():
    # Main function remains empty, execution flow managed by Sovereign AGI Orchestration Layer.
    pass