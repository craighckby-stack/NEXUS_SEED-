import psutil
import re
import os
import logging
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import concurrent.futures

# --- Constants ---
LOG_FILE = 'scan_activity.log'
OUTPUT_FILE = 'memory_scan_results.txt'
TARGET_PROCESS_NAMES = ['process1', 'process2', 'nginx', 'python3']
RAW_KEYWORDS = ['sk_1234', 'password', 'api_key_v1', 'AKIA[0-9A-Z]{16}'] # Added a simple regex for testing
CONTEXT_SIZE = 50
REGION_READ_CHUNK_SIZE = 64 * 1024 * 1024 # 64 MB maximum read size per iteration
MAX_WORKERS = 4 # Limit concurrent scans to avoid overloading I/O/CPU

# --- Data Structure Refinement ---
@dataclass
class ScanResult:
    pid: int
    keyword_used: str
    absolute_address: int
    context_before: str
    found_snippet: str
    region_info: str
    

# --- Preprocessing (Architectural Improvement V94.1) ---
# Convert simple keywords and regex strings into compiled byte regex patterns for efficiency.
PRECOMPILED_PATTERNS: List[Tuple[str, re.Pattern]] = []
for raw_pattern in RAW_KEYWORDS:
    # Treat patterns as regex if they contain structural characters, otherwise escape them
    if '[' not in raw_pattern and ']' not in raw_pattern and '{' not in raw_pattern and '\' not in raw_pattern:
        pattern_bytes = re.escape(raw_pattern.encode('utf-8'))
    else:
        pattern_bytes = raw_pattern.encode('utf-8')
        
    try:
        # Ensure patterns are compiled for byte matching (re.DOTALL helps if secrets cross lines, though less relevant for binary data)
        PRECOMPILED_PATTERNS.append((raw_pattern, re.compile(pattern_bytes, re.DOTALL)))
    except re.error as e:
        logging.error(f"Invalid regex pattern '{raw_pattern}': {e}")

# --- Initialization ---
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] (Process:%(process)d) %(message)s'
)

# --- Decoding and Data Integrity (Hallucination Focus) ---
def safe_decode_snippet(byte_data: bytes) -> str:
    """Decodes bytes, falling back to hex representation if standard UTF-8 decoding fails for data integrity."""
    try:
        # Strict decoding attempt
        return byte_data.decode('utf-8', errors='strict').strip().replace('\n', '\\n')
    except UnicodeDecodeError:
        # If the snippet is not valid UTF-8, prioritize representing the bytes accurately via hex.
        return f"[RAW_BYTES/HEX: {byte_data[:CONTEXT_SIZE * 2].hex()}...]"
    except Exception:
        # Fallback for unexpected errors
        return byte_data.decode('utf-8', errors='ignore').strip().replace('\n', '\\n')

# Function definitions

def get_target_pids(process_names: List[str]) -> List[int]:
    """Get PIDs of target processes by name."""
    pids = []
    for process in psutil.process_iter(['pid', 'name']):
        try:
            if process.info['name'] in process_names:
                pids.append(process.info['pid'])
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    return pids

def get_memory_regions(pid: int) -> List[Dict[str, Any]]:
    """Parses /proc/{pid}/maps to identify readable memory regions."""
    # ... (Implementation unchanged)
    regions = []
    try:
        maps_path = f'/proc/{pid}/maps'
        if not os.path.exists(maps_path):
            logging.warning(f"Maps file not found for PID {pid}.")
            return []

        with open(maps_path, 'r') as maps_file:
            for line in maps_file:
                parts = line.split()
                # We need 'r'eadable access. executable 'x' may also be relevant, but 'r' is core.
                if len(parts) >= 2 and 'r' in parts[1]: 
                    addr_range = parts[0].split('-')
                    start = int(addr_range[0], 16)
                    end = int(addr_range[1], 16)
                    regions.append({
                        'start': start,
                        'end': end,
                        'size': end - start,
                        'info': ' '.join(parts[2:])
                    })
        return regions
    except Exception as e:
        logging.error(f"Error reading maps for PID {pid}: {e}")
        return []


def extract_scan_result(
    pid: int,
    region: Dict[str, Any],
    match: re.Match,
    chunk_start_addr: int, # The absolute address where the current chunk starts
    keyword_str: str,
    chunk: bytes
) -> ScanResult:
    """Extracts structured ScanResult data from a successful match."""
    relative_address_in_chunk = match.start()
    absolute_address = chunk_start_addr + relative_address_in_chunk

    # Determine the context extraction range within the current chunk
    context_start_in_chunk = max(0, relative_address_in_chunk - CONTEXT_SIZE)
    context_end_in_chunk = min(len(chunk), match.end() + CONTEXT_SIZE) # Stop at chunk boundary

    # Data segments
    context_before_bytes = chunk[context_start_in_chunk:relative_address_in_chunk]
    # Ensure we capture the match and context after it
    found_data_bytes = chunk[relative_address_in_chunk:context_end_in_chunk]
    
    # Context decoding (errors ignored, it's just context)
    context_before = context_before_bytes.decode('utf-8', errors='ignore').strip().replace('\n', '\\n')
    
    # Snippet decoding using enhanced integrity function
    found_data = safe_decode_snippet(found_data_bytes)

    return ScanResult(
        pid=pid,
        keyword_used=keyword_str,
        absolute_address=absolute_address,
        context_before=context_before,
        found_snippet=found_data,
        region_info=region['info']
    )

def scan_pid_for_patterns(pid: int, patterns_list: List[Tuple[str, re.Pattern]]) -> List[ScanResult]:
    """Orchestrates scanning all memory regions for a single PID, using internal chunking for large regions.
    Returns a list of results.
    """
    logging.info(f"[PID {pid}] Starting memory region analysis.")
    regions = get_memory_regions(pid)
    if not regions: return []

    all_results: List[ScanResult] = []

    try:
        # Open /proc/pid/mem once
        with open(f'/proc/{pid}/mem', 'rb', 0) as memfile:
            for region in regions:
                start_addr, size = region['start'], region['size']

                if size <= 0: continue
                
                logging.debug(f"[PID {pid}] Scanning region 0x{start_addr:X} (Size: {size / (1024*1024):.2f} MB).")

                current_region_offset = 0
                bytes_read = 0

                try:
                    memfile.seek(start_addr)
                except IOError as e:
                    logging.warning(f"[PID {pid}] Cannot seek to region 0x{start_addr:X}: {e}")
                    continue

                # Loop to read the region in controlled chunks
                while bytes_read < size:
                    read_size = min(size - bytes_read, REGION_READ_CHUNK_SIZE)
                    
                    try:
                        chunk = memfile.read(read_size)
                    except IOError as e:
                        logging.debug(f"[PID {pid}] Failed reading chunk at offset {current_region_offset}: {e}. Skipping region continuation.")
                        break

                    if not chunk:
                        break # EOF or unexpected read stop

                    # Calculate the true absolute starting address of this chunk
                    chunk_start_addr = start_addr + current_region_offset

                    # Iterate over all patterns for this specific memory chunk
                    for keyword_str, pattern in patterns_list:
                        for match in pattern.finditer(chunk):
                            # Pass chunk_start_addr so the absolute address can be computed correctly
                            result = extract_scan_result(pid, region, match, chunk_start_addr, keyword_str, chunk)
                            all_results.append(result)
                            
                    bytes_read += len(chunk)
                    current_region_offset += len(chunk)
                        
        logging.info(f"[PID {pid}] Finished scanning. Found {len(all_results)} hits.")
        return all_results

    except FileNotFoundError:
        logging.error(f"[PID {pid}] Error: Could not open /proc/mem. Ensure necessary privileges (root/ptrace).")
        return []
    except Exception as e:
        logging.error(f"[PID {pid}] General error scanning memory: {type(e).__name__}: {e}")
        return []

def save_to_file(result: ScanResult, filename: str):
    """Save a structured ScanResult to a file."""
    # Note: This function is called synchronously in main() to avoid concurrent file access issues.
    data = (
        f"--- HIT ---\n"
        f"PID: {result.pid} (Keyword: '{result.keyword_used}')\n"
        f"Address: 0x{result.absolute_address:X}\n"
        f"Region Info: [{result.region_info.strip()}]\n"
        f"Context Before: '...{result.context_before}'\n"
        f"Found Snippet: '{result.found_snippet}'...\n"
        f"----------------\n"
    )
    try:
        with open(filename, 'a') as file:
            file.write(data)
    except IOError as e:
        logging.critical(f"Could not save data to {filename}: {e}")

def main():
    """Main function: Orchestrates parallel process lookup and memory scanning."""
    logging.info("Sovereign AGI v94.1 Advanced Memory Scan Utility Initialized (Parallel Mode).")
    
    # Clear previous output file for a clean run
    if os.path.exists(OUTPUT_FILE):
        os.remove(OUTPUT_FILE)
    
    if not PRECOMPILED_PATTERNS:
        logging.error("No valid patterns loaded. Exiting.")
        return
    
    pids = get_target_pids(TARGET_PROCESS_NAMES)
    if not pids:
        logging.warning("No target processes found matching criteria.")
        return
    
    logging.info(f"Target PIDs identified: {pids}. Deploying {min(MAX_WORKERS, len(pids))} concurrent workers.")

    total_results = []
    
    # Use ProcessPoolExecutor for concurrent PID scanning (Architectural)
    with concurrent.futures.ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
        
        # Schedule scans for all target PIDs
        future_to_pid = {
            executor.submit(scan_pid_for_patterns, pid, PRECOMPILED_PATTERNS): pid
            for pid in pids
        }

        for future in concurrent.futures.as_completed(future_to_pid):
            pid = future_to_pid[future]
            try:
                results_for_pid = future.result()
                if results_for_pid:
                    total_results.extend(results_for_pid)
                    logging.info(f"PID {pid} processing completed successfully. {len(results_for_pid)} hits found.")
            except Exception as exc:
                logging.error(f'PID {pid} generated an exception during scan: {exc}')

    # Synchronously write all collected results to the output file
    for result in total_results:
        save_to_file(result, OUTPUT_FILE)

    logging.info(f"Scan cycle finished. Total hits found: {len(total_results)}.")
    print(f"Scan complete. {len(total_results)} sensitive hits found. Results saved to {OUTPUT_FILE}.")

if __name__ == "__main__":
    main()