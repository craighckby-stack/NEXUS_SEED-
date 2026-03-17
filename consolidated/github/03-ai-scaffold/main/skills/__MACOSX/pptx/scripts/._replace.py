# skills/__MACOSX/pptx/scripts/._replace.py (refactored)

"""
EVOLVE FILE: _replace.py

This script is responsible for replacing placeholder tokens in design files.

Project Context:
----------------
- Frontend Design Skill
- Design Tokens System

Usage:
------
1. Replace tokens in design files (CSS, SCSS, etc.)
2. Usage as a preprocessor or postprocessor for build pipelines

"""

import os
import re

def replace_tokens(file_path, tokens):
    """
    Replace tokens in a file.

    Args:
        file_path (str): Path to the file
        tokens (dict): Dictionary of tokens and their replacements

    Returns:
        None
    """
    with open(file_path, 'r+') as file:
        content = file.read()
        for token, replacement in tokens.items():
            content = re.sub(rf'\${\{token\}}', replacement, content)
        file.seek(0)
        file.write(content)
        file.truncate()

def load_tokens(tokens_file):
    """
    Load tokens from a file.

    Args:
        tokens_file (str): Path to the tokens file

    Returns:
        dict: Dictionary of tokens and their replacements
    """
    tokens = {}
    with open(tokens_file, 'r') as file:
        for line in file.readlines():
            match = re.match(r'\$\{(\w+)\} = (.+);', line)
            if match:
                token, replacement = match.groups()
                tokens[token] = replacement
    return tokens

def main(tokens_file, file_path):
    """
    Main entry point.

    Args:
        tokens_file (str): Path to the tokens file
        file_path (str): Path to the file to replace tokens in

    Returns:
        None
    """
    tokens = load_tokens(tokens_file)
    replace_tokens(file_path, tokens)

if __name__ == '__main__':
    tokens_file = 'design_tokens.txt'
    file_path = 'styles.css'
    main(tokens_file, file_path)