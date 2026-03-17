"""
This module contains utility functions and classes for logging, 
color printing, and loading/saving JSON files.
"""

from datetime import datetime
import json

# List of bank websites
BANK_SITES = [
    "https://www.bankofbaroda.in/", 
    "https://www.bankofindia.co.in/", 
    "https://bankofmaharashtra.in/", 
    "https://canarabank.com/", 
    "https://www.centralbankofindia.co.in/en", 
    "https://www.indianbank.in/", 
    "https://www.iob.in/", 
    "https://www.pnbindia.in/Home.aspx",
    "https://punjabandsindbank.co.in/", 
    "https://www.sbi.co.in/", 
    "https://www.unionbankofindia.co.in/english/home.aspx", 
    "https://www.ucobank.com/Hindi/homehindi.aspx"
]

class Colours:
    """
    Defines ANSI escape codes for text colors.
    
    Attributes:
        GREEN (str): Green color code.
        YELLOW (str): Yellow color code.
        RED (str): Red color code.
        BLUE (str): Blue color code.
        MAGENTA (str): Magenta color code.
        CYAN (str): Cyan color code.
        WHITE (str): White color code.
        RESET (str): Reset color code.
    """
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    RESET = '\033[0m'

def print_coloured(text, colour=Colours.WHITE):
    """
    Prints text with a specified color.
    
    Args:
        text (str): The text to print.
        colour (str, optional): The color to use. Defaults to Colours.WHITE.
    """
    print(f"{colour}{text}{Colours.RESET}")

def log_message(message, level="INFO", log_file="log_file.log"):
    """
    Logs a message to the console and a file.
    
    Args:
        message (str): The message to log.
        level (str, optional): The log level. Defaults to "INFO".
        log_file (str, optional): The log file path. Defaults to "log_file.log".
    """
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] [{level}] {message}\n"
    print(log_entry.strip())
    try:
        with open(log_file, 'a') as f:
            f.write(log_entry)
    except EnvironmentError as e:
        print(f"Error writing to log file: {e}")

def load_json_file(file_path):
    """
    Loads the contents of a JSON file.
    
    Args:
        file_path (str): The path to the JSON file.
    
    Returns:
        dict: The loaded JSON data.
    """
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_json_file(file_path, data):
    """
    Saves the contents of a JSON file.
    
    Args:
        file_path (str): The path to the JSON file.
        data (dict): The data to save.
    """
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=4)
    except EnvironmentError as e:
        log_message(f"Error saving data to file: {e}", "ERROR")

def load_persistent_memory(file_path="persistent_memory.json"):
    """
    Loads the persistent memory from the JSON file.
    
    Args:
        file_path (str, optional): The path to the JSON file. Defaults to "persistent_memory.json".
    
    Returns:
        dict: The loaded JSON data.
    """
    return load_json_file(file_path)

def save_persistent_memory(data, file_path="persistent_memory.json"):
    """
    Saves the persistent memory to the JSON file.
    
    Args:
        data (dict): The data to save.
        file_path (str, optional): The path to the JSON file. Defaults to "persistent_memory.json".
    """
    save_json_file(file_path, data)