#!/usr/bin/env python3
"""
Command line tool to validate Office document XML files against XSD schemas and tracked changes.

Usage:
    python validate.py <dir> --original <original_file>
"""

import argparse
from pathlib import Path
from typing import List, Type

from validation import (
    DOCXSchemaValidator,
    PPTXSchemaValidator,
    RedliningValidator,
)


class ValidatorRunner:
    def __init__(self, unpacked_dir: Path, original_file: Path, verbose: bool):
        self.unpack_dir = unpacked_dir
        self.original_file = original_file
        self.verbose = verbose

    def run_validations(self, validators: List[Type]) -> bool:
        success = True
        for V in validators:
            validator = V(self.unpack_dir, self.original_file, verbose=self.verbose)
            if not validator.validate():
                success = False
                if self.verbose:
                    print(f"Validation failed: {V.__name__}")
        return success


def main():
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

    # Validate paths
    unpacked_dir = Path(args.unpacked_dir)
    original_file = Path(args.original)
    file_extension = original_file.suffix.lower()
    if not unpacked_dir.is_dir():
        raise ValueError(f"Error: {unpacked_dir} is not a directory")
    if not original_file.is_file():
        raise ValueError(f"Error: {original_file} is not a file")
    supported_extensions = [".docx", ".pptx", ".xlsx"]
    if file_extension not in supported_extensions:
        raise ValueError(
            f"Error: {original_file} must be a .docx, .pptx, or .xlsx file"
        )

    # Run validations
    unpacked_dir = Path(args.unpacked_dir)
    original_file = Path(args.original)
    if file_extension == ".docx":
        validators = [DOCXSchemaValidator, RedliningValidator]
    elif file_extension == ".pptx":
        validators = [PPTXSchemaValidator]
    else:
        raise ValueError(f"Error: Validation not supported for file type {file_extension}")

    # Run validators
    try:
        runner = ValidatorRunner(unpacked_dir, original_file, verbose=args.verbose)
        success = runner.run_validations(validators)
    except Exception as e:
        print(f"Error: {e}")
        success = False

    if success:
        print("All validations PASSED!")

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    import sys

    try:
        main()
    except SystemExit as e:
        sys.exit(e.code)