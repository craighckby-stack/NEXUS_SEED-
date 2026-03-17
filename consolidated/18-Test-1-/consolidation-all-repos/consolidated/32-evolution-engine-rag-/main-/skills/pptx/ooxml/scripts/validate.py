#!/usr/bin/env python3
"""
Command line tool to validate Office document XML files against XSD schemas and tracked changes.

Usage:
    python validate.py <dir> --original <original_file>
"""

import argparse
import sys
from pathlib import Path
from typing import List

from validation import (
    DOCXSchemaValidator,
    PPTXSchemaValidator,
    RedliningValidator,
    Validator,
)

def get_validators(file_extension: str) -> List[type[Validator]]:
    """Returns a list of validators based on the file extension."""
    match file_extension:
        case ".docx":
            return [DOCXSchemaValidator, RedliningValidator]
        case ".pptx":
            return [PPTXSchemaValidator]
        case _:
            raise ValueError(f"Validation not supported for file type {file_extension}")

def validate_office_document(unpacked_dir: Path, original_file: Path, verbose: bool) -> bool:
    """Validates an Office document against XSD schemas and tracked changes."""
    file_extension = original_file.suffix.lower()
    validators = get_validators(file_extension)

    success = True
    for validator_type in validators:
        validator = validator_type(unpacked_dir, original_file, verbose=verbose)
        if not validator.validate():
            success = False

    return success

def main() -> None:
    parser = argparse.ArgumentParser(description="Validate Office document XML files")
    parser.add_argument(
        "unpacked_dir",
        help="Path to unpacked Office document directory",
    )
    parser.add_argument(
        "--original",
        required=True,
        help="Path to original file (.docx/.pptx/.xlsx)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose output",
    )
    args = parser.parse_args()

    unpacked_dir = Path(args.unpacked_dir)
    original_file = Path(args.original)

    # Validate paths
    if not unpacked_dir.is_dir():
        raise ValueError(f"Error: {unpacked_dir} is not a directory")
    if not original_file.is_file():
        raise ValueError(f"Error: {original_file} is not a file")
    if original_file.suffix.lower() not in [".docx", ".pptx", ".xlsx"]:
        raise ValueError(
            f"Error: {original_file} must be a .docx, .pptx, or .xlsx file"
        )

    success = validate_office_document(unpacked_dir, original_file, args.verbose)

    if success:
        print("All validations PASSED!")

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()