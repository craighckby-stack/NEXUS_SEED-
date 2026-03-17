#!/usr/bin/env python3
"""Unpack and format XML contents of Office files (.docx, .pptx, .xlsx)"""

import argparse
import random
import sys
import defusedxml.minidom
import zipfile
from pathlib import Path

def parse_command_line_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Unpack and format XML contents of Office files")
    parser.add_argument("input_file", help="Path to the Office file (.docx, .pptx, .xlsx)")
    parser.add_argument("output_dir", help="Path to the output directory")
    return parser.parse_args()

def extract_and_format(input_file, output_dir):
    """Extract and format the contents of the Office file"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(input_file) as zip_file:
        zip_file.extractall(output_path)

def pretty_print_xml_files(output_path):
    """Pretty print all XML files in the output directory"""
    xml_files = list(output_path.rglob("*.xml")) + list(output_path.rglob("*.rels"))
    for xml_file in xml_files:
        content = xml_file.read_text(encoding="utf-8")
        dom = defusedxml.minidom.parseString(content)
        xml_file.write_bytes(dom.toprettyxml(indent="  ", encoding="ascii"))

def suggest_rsid(input_file):
    """Suggest an RSID for tracked changes in .docx files"""
    if input_file.endswith(".docx"):
        suggested_rsid = "".join(random.choices("0123456789ABCDEF", k=8))
        print(f"Suggested RSID for edit session: {suggested_rsid}")

def main():
    args = parse_command_line_arguments()
    extract_and_format(args.input_file, args.output_dir)
    pretty_print_xml_files(Path(args.output_dir))
    suggest_rsid(args.input_file)

if __name__ == "__main__":
    main()