"""
Validator for Word document XML files against XSD schemas.
"""

import re
import tempfile
import zipfile
import xml.etree.ElementTree as ET

from .base import BaseSchemaValidator


class DOCXSchemaValidator(BaseSchemaValidator):
    """Validator for Word document XML files against XSD schemas."""

    # Word-specific namespace
    WORD_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

    # Word-specific element to relationship type mappings
    ELEMENT_RELATIONSHIP_TYPES = {}

    def validate(self):
        """Run all validation checks and return True if all pass."""
        try:
            # Test 0: XML well-formedness
            if not self.validate_xml():
                return False

            # Test 1: Namespace declarations
            if not self.validate_namespaces():
                return False

            # Test 2: Unique IDs
            if not self.validate_unique_ids():
                return False

            # Test 3: Relationship and file reference validation
            if not self.validate_file_references():
                return False

            # Test 4: Content type declarations
            if not self.validate_content_types():
                return False

            # Test 5: XSD schema validation
            if not self.validate_against_xsd():
                return False

            # Test 6: Whitespace preservation
            if not self.validate_whitespace_preservation():
                return False

            # Test 7: Deletion validation
            if not self.validate_deletions():
                return False

            # Test 8: Insertion validation
            if not self.validate_insertions():
                return False

            # Test 9: Relationship ID reference validation
            if not self.validate_all_relationship_ids():
                return False

            # Count and compare paragraphs
            self.compare_paragraph_counts()

            return True
        except Exception as e:
            print(f"Error validating document: {e}")
            return False

    def validate_whitespace_preservation(self):
        """
        Validate that w:t elements with whitespace have xml:space='preserve'.
        """
        errors = []

        try:
            for xml_file in self.xml_files:
                if xml_file.name != "document.xml":
                    continue

                root = ET.parse(str(xml_file)).getroot()

                for elem in root.findall(f".//{{{self.WORD_NAMESPACE}}}t"):
                    if elem.text:
                        text = elem.text
                        if re.match(r"^\s.*", text) or re.match(r".*\s$", text):
                            if not hasattr(elem, "attrib") or "space" not in elem.attrib:
                                text_preview = (
                                    repr(text)[:50] + "..."
                                    if len(repr(text)) > 50
                                    else repr(text)
                                )
                                errors.append(
                                    f"  {xml_file.relative_to(self.unpacked_dir)}: "
                                    f"Line {elem.sourceline}: w:t element with whitespace missing xml:space='preserve': {text_preview}"
                                )

        except Exception as e:
            errors.append(f"  Error: {e}")

        if errors:
            print(f"FAILED - Found {len(errors)} whitespace preservation violations:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("PASSED - All whitespace is properly preserved")
            return True

    def validate_deletions(self):
        """
        Validate that w:t elements are not within w:del elements.
        For some reason, XSD validation does not catch this, so we do it manually.
        """
        errors = []

        try:
            for xml_file in self.xml_files:
                if xml_file.name != "document.xml":
                    continue

                root = ET.parse(str(xml_file)).getroot()
                namespaces = {"w": self.WORD_NAMESPACE}

                problematic_t_elements = root.findall(
                    ".//w:del//w:t", namespaces=namespaces
                )
                for t_elem in problematic_t_elements:
                    if t_elem.text:
                        text_preview = (
                            repr(t_elem.text)[:50] + "..."
                            if len(repr(t_elem.text)) > 50
                            else repr(t_elem.text)
                        )
                        errors.append(
                            f"  {xml_file.relative_to(self.unpacked_dir)}: "
                            f"Line {t_elem.sourceline}: <w:t> found within <w:del>: {text_preview}"
                        )

        except Exception as e:
            errors.append(f"  Error: {e}")

        if errors:
            print(f"FAILED - Found {len(errors)} deletion validation violations:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("PASSED - No w:t elements found within w:del elements")
            return True

    def count_paragraphs_in_unpacked(self):
        """Count the number of paragraphs in the unpacked document."""
        count = 0

        for xml_file in self.xml_files:
            if xml_file.name != "document.xml":
                continue

            try:
                root = ET.parse(str(xml_file)).getroot()
                paragraphs = root.findall(f".//{{{self.WORD_NAMESPACE}}}p")
                count = len(paragraphs)
            except Exception as e:
                print(f"Error counting paragraphs in unpacked document: {e}")

        return count

    def count_paragraphs_in_original(self):
        """Count the number of paragraphs in the original docx file."""
        count = 0

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                with zipfile.ZipFile(self.original_file, "r") as zip_ref:
                    zip_ref.extractall(temp_dir)

                doc_xml_path = temp_dir + "/word/document.xml"
                root = ET.parse(doc_xml_path).getroot()
                paragraphs = root.findall(f".//{{{self.WORD_NAMESPACE}}}p")
                count = len(paragraphs)

        except Exception as e:
            print(f"Error counting paragraphs in original document: {e}")

        return count

    def validate_insertions(self):
        """
        Validate that w:delText elements are not within w:ins elements.
        w:delText is only allowed in w:ins if nested within a w:del.
        """
        errors = []

        try:
            for xml_file in self.xml_files:
                if xml_file.name != "document.xml":
                    continue

                root = ET.parse(str(xml_file)).getroot()
                namespaces = {"w": self.WORD_NAMESPACE}

                invalid_elements = root.findall(
                    ".//w:ins//w:delText[not(ancestor::w:del)]", namespaces=namespaces
                )
                for elem in invalid_elements:
                    text_preview = (
                        repr(elem.text or "")[:50] + "..."
                        if len(repr(elem.text or "")) > 50
                        else repr(elem.text or "")
                    )
                    errors.append(
                        f"  {xml_file.relative_to(self.unpacked_dir)}: "
                        f"Line {elem.sourceline}: <w:delText> within <w:ins>: {text_preview}"
                    )

        except Exception as e:
            errors.append(f"  Error: {e}")

        if errors:
            print(f"FAILED - Found {len(errors)} insertion validation violations:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("PASSED - No w:delText elements within w:ins elements")
            return True

    def compare_paragraph_counts(self):
        """Compare paragraph counts between original and new document."""
        original_count = self.count_paragraphs_in_original()
        new_count = self.count_paragraphs_in_unpacked()

        diff = new_count - original_count
        diff_str = f"+{diff}" if diff > 0 else str(diff)
        print(f"\nParagraphs: {original_count} → {new_count} ({diff_str})")


if __name__ == "__main__":
    raise RuntimeError("This module should not be run directly.")
```

**