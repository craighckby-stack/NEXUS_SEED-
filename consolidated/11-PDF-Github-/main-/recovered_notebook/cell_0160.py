import logging
import sys
import os
import time
import traceback
from typing import Dict, Any, List, Tuple, Optional
import random
from io import BytesIO
from urllib import robotparser
from urllib.parse import urlparse, urljoin
import warnings

# Third-Party Libraries (Grouped for readability/future conditional import)
# Note: Many original imports are massive and are kept here as this is a setup cell.
import requests
from bs4 import BeautifulSoup
from docx import Document
import re
from jsonschema import validate, ValidationError
import hashlib
import csv
import datetime
import json
import pandas as pd
from PyPDF2 import PdfReader
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


# --- Configuration and Environment Setup ---

CONFIG = {
    "WORK_DIR": os.getenv("SOV_WORK_DIR", "./scratch_analysis"),
    "LOG_FILE": 'council_analysis.log',
    "USER_AGENT": "SovereignAGIv94.1_CouncilScraper/1.0 (Policy: Contact via project repo)",
    "TIMEOUT": 15.0,
    "LOG_LEVEL": logging.INFO
}

def setup_environment_and_logging(config: Dict[str, Any]):
    """Initializes environment, working directory, and logging system."""
    work_dir = config['WORK_DIR']
    log_file = os.path.join(work_dir, config['LOG_FILE'])
    
    os.makedirs(work_dir, exist_ok=True)
    os.chdir(work_dir)

    logging.basicConfig(
        level=config['LOG_LEVEL'], 
        format='%(asctime)s - %(levelname)s - %(module)s.%(funcName)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, mode='a'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    logging.info(f"Environment initialized. Working Directory: {os.getcwd()}")

setup_environment_and_logging(CONFIG)

# --- General Utilities ---

COLORS = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
def get_random_color():
    return random.choice(COLORS)


def initialize_robot_parser(base_url: str) -> Optional[robotparser.RobotFileParser]:
    """Fetches and parses the robots.txt file for a given domain."""
    rp = robotparser.RobotFileParser()
    parsed_url = urlparse(base_url)
    domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
    robots_url = urljoin(domain, '/robots.txt')
    
    try:
        logging.info(f"Attempting to fetch robots.txt from: {robots_url}")
        rp.set_url(robots_url)
        rp.read()
        if not rp.mtime():
            logging.warning(f"[ROBOTS] Successfully fetched robots.txt but file appears empty/malformed for {domain}.")
        return rp
    except Exception as e:
        # traceback.print_exc() # Removed trace for cleaner log unless debug level is high
        logging.error(f"[ROBOTS] Failed to retrieve or parse robots.txt for {domain}. Error: {e}")
        return None


def is_allowed_by_robots(url: str, rp: Optional[robotparser.RobotFileParser], user_agent: str = CONFIG['USER_AGENT']):
    """Checks if scraping the specific URL is permitted by the robots.txt rules."""
    if rp is None:
        logging.warning(f"[ROBOTS] Robot parser is not initialized. Assuming {url} is allowed.")
        return True
    
    try:
        if rp.can_fetch(user_agent, url):
            return True
        else:
            logging.warning(f"[ROBOTS] Denied access to {url} based on robots.txt rules.")
            return False
    except Exception as e:
        logging.error(f"An error occurred during robot policy check for {url}: {e}")
        return False
