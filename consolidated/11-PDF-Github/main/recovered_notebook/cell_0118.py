import requests
import os
import json
import datetime
import time
import itertools
import argparse
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import logging

# --- Configuration ---
CONFIG_FILE = "config.json"
LOG_FILE = "scraper.log"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
DEFAULT_RATE_LIMIT_DELAY = 2
MAX_RETRIES = 3
RETRY_DELAY = 5
OUTPUT_FOLDER = "banks_not_gov"

# --- Bank URLs (Hardcoded) ---
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

# --- ANSI Escape Codes for Color ---
class Color:
    """Defines ANSI escape codes for text colors."""
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    RESET = "\033[0m"

def color_print(text, color=Color.WHITE):
    """Prints text with a specified color."""
    print(f"{color}{text}{Color.RESET}")

# --- Logging Configuration ---
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

def log_message(message, level="INFO"):
    """Logs a message to the console and a file."""
    logging.log(logging.getLevelName(level.upper()), message)
    print(logging.log(logging.getLevelName(level.upper()), message))

# --- Configuration Loader ---
try:
    with open(CONFIG_FILE, "r") as f:
        config = json.load(f)
except FileNotFoundError:
    print("Configuration file not found.")
    exit(1)

# --- Constants ---
ROBOTS_LOG_FILE = config.get("ROBOTS_LOG_FILE", "robots_log.json")
PERSISTENT_MEMORY_FILE = config.get("PERSISTENT_MEMORY_FILE", "persistent_memory.json")
USER_AGENT = config.get("USER_AGENT", USER_AGENT)
DEFAULT_RATE_LIMIT_DELAY = config.get("DEFAULT_RATE_LIMIT_DELAY", DEFAULT_RATE_LIMIT_DELAY)
MAX_RETRIES = config.get("MAX_RETRIES", MAX_RETRIES)
RETRY_DELAY = config.get("RETRY_DELAY", RETRY_DELAY)
OUTPUT_FOLDER = config.get("OUTPUT_FOLDER", OUTPUT_FOLDER)