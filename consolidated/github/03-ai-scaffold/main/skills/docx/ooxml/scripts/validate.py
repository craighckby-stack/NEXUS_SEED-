#!/usr/bin/env python3
"""
Command line tool to validate Office document XML files against XSD schemas and tracked changes.

Usage:
    python validate.py <dir> --original <original_file>
"""

import argparse
import sys
from pathlib import Path

from validation import (
    DOCXSchemaValidator, 
    PPTXSchemaValidator, 
    RedliningValidator, 
    OfficeDocumentValidator
)

def main():
    parser = argparse.ArgumentParser(description="Validate Office document XML files")
    parser.add_argument(
        "unpacked_dir",
        help="Path to unpacked Office document directory",
        type=Path
    )
    parser.add_argument(
        "--original",
        required=True,
        help="Path to original file (.docx/.pptx/.xlsx)",
        type=Path
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    args = parser.parse_args()

    unpacked_dir = args.unpacked_dir
    original_file = args.original
    file_extension = original_file.suffix.lower()

    if not unpacked_dir.is_dir():
        raise SystemExit(f"Error: {unpacked_dir} is not a directory")
    if not original_file.is_file():
        raise SystemExit(f"Error: {original_file} is not a file")
    if file_extension not in [".docx", ".pptx", ".xlsx"]:
        raise SystemExit(
            f"Error: {original_file} must be a .docx, .pptx, or .xlsx file"
        )

    match file_extension:
        case ".docx":
            validators = [
                OfficeDocumentValidator(
                    unpacked_dir, 
                    original_file, 
                    verbose=args.verbose
                )
            ]
        case ".pptx":
            validators = [
                OfficeDocumentValidator(
                    unpacked_dir, 
                    original_file, 
                    verbose=args.verbose
                )
            ]
        case _:
            print(f"Error: Validation not supported for file type {file_extension}")
            sys.exit(1)

    for validator in validators:
        if not validator.validate():
            print("One or more validations FAILED!")
            sys.exit(1)

    print("All validations PASSED!")
    sys.exit(0)


if __name__ == "__main__":
    main()
```

**