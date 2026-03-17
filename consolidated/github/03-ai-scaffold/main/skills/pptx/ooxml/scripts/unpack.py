#!/usr/bin/env python3
"""Unpack and format XML contents of Office files (.docx, .pptx, .xlsx)"""

import argparse
import sys
import io
import xml.dom minidom
import zipfile
from pathlib import Path

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Unpack and format XML contents of Office files")
    parser.add_argument("input_file", help="Office file to unpack (.docx, .pptx, .xlsx)")
    parser.add_argument("output_dir", help="Output directory for unpacked files")
    return parser.parse_args()

def unpack_office_file(input_file: str, output_dir: str) -> None:
    """Unpack and format XML contents of Office files"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    with zipfile.ZipFile(input_file) as zip_file:
        zip_file.extractall(output_path)

    xml_files = list(output_path.rglob("*.xml")) + list(output_path.rglob("*.rels"))
    for xml_file in xml_files:
        with xml_file.open("r", encoding="utf-8") as file:
            content = file.read()
        dom = minidom.parseString(content)
        with io.open(xml_file, "w", encoding="ascii", newline="") as output_file:
            output_file.write(dom.toprettyxml(indent="  ", encoding="ascii"))

def suggest_rsid(input_file: str) -> str:
    """Generate a random RSID for tracked changes"""
    return "".join(random.choices("0123456789ABCDEF", k=8))

if __name__ == "__main__":
    args = parse_args()
    unpack_office_file(args.input_file, args.output_dir)
    
    if args.input_file.endswith(".docx"):
        rsid = suggest_rsid(args.input_file)
        print(f"Suggested RSID for edit session: {rsid}")