#!/usr/bin/env python3
"""Unpack and format XML contents of Office files (.docx, .pptx, .xlsx)

Usage: python unpack.py <office_file> <output_dir>
"""

import argparse
import random
import sys
from pathlib import Path
from typing import List

import defusedxml.minidom
import zipfile

def unpack_office_file(input_file: Path, output_dir: Path) -> None:
    """Unpack and format XML contents of Office files (.docx, .pptx, .xlsx)

    Args:
        input_file: Path to the Office file to unpack
        output_dir: Directory where the unpacked files will be stored
    """
    # Extract and format
    output_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(str(input_file)) as zip_ref:
        zip_ref.extractall(str(output_dir))

    # Pretty print all XML files
    xml_files = list(output_dir.rglob("*.xml")) + list(output_dir.rglob("*.rels"))
    for xml_file in xml_files:
        with xml_file.open("r", encoding="utf-8") as file:
            content = file.read()
        dom = defusedxml.minidom.parseString(content)
        with xml_file.open("w", encoding="ascii") as file:
            file.write(dom.toprettyxml(indent="  "))

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_file", type=Path, help="Path to the Office file to unpack")
    parser.add_argument("output_dir", type=Path, help="Directory where the unpacked files will be stored")
    args = parser.parse_args()

    if not args.input_file.is_file():
        print(f"Error: Input file '{args.input_file}' does not exist")
        sys.exit(1)

    if not args.output_dir.is_dir():
        print(f"Error: Output directory '{args.output_dir}' does not exist")
        sys.exit(1)

    unpack_office_file(args.input_file, args.output_dir)

    if args.input_file.suffix == ".docx":
        suggested_rsid = "".join(random.choices("0123456789ABCDEF", k=8))
        print(f"Suggested RSID for edit session: {suggested_rsid}")

if __name__ == "__main__":
    main()
```

**