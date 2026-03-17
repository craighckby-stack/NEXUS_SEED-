import re
import tempfile
import zipfile
import lxml.etree
from typing import List
from pathlib import Path

from .base import BaseSchemaValidator

class DOCXSchemaValidator(BaseSchemaValidator):
    """Validator for Word document XML files against XSD schemas."""

    WORD_2006_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    ELEMENT_RELATIONSHIP_TYPES = {}

    def validate(self) -> bool:
        """Run all validation checks and return True if all pass."""
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

        # Compare paragraph counts
        self.compare_paragraph_counts()

        return True

    def validate_whitespace_preservation(self) -> bool:
        """
        Validate that w:t elements with whitespace have xml:space='preserve'.
        """
        errors = []

        for xml_file in self.xml_files:
            if xml_file.name != "document.xml":
                continue

            try:
                root = lxml.etree.parse(str(xml_file)).getroot()

                namespaces = {"w": self.WORD_2006_NAMESPACE}
                for elem in root.iter(f"{{{self.WORD_2006_NAMESPACE}}}t"):
                    if elem.text and (elem.text.strip() or elem.tail):
                        text = elem.text or elem.tail
                        if not re.match(r"^\s.*\s$", text):
                            xml_space_attr = f"{{{self.XML_NAMESPACE}}}space"
                            if xml_space_attr not in elem.attrib or elem.attrib[xml_space_attr] != "preserve":
                                text_preview = (
                                    repr(text)[:50] + "..."
                                    if len(repr(text)) > 50
                                    else repr(text)
                                )
                                errors.append(
                                    f"  {xml_file.relative_to(self.unpacked_dir)}: "
                                    f"Line {elem.sourceline}: w:t element with whitespace missing xml:space='preserve': {text_preview}"
                                )

            except (lxml.etree.XMLSyntaxError, Exception) as e:
                errors.append(
                    f"  {xml_file.relative_to(self.unpacked_dir)}: Error: {e}"
                )

        if errors:
            print(f"FAILED - Found {len(errors)} whitespace preservation violations:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("PASSED - All whitespace is properly preserved")
            return True

    def validate_deletions(self) -> bool:
        """
        Validate that w:t elements are not within w:del elements.
        """
        errors = []

        for xml_file in self.xml_files:
            if xml_file.name != "document.xml":
                continue

            try:
                root = lxml.etree.parse(str(xml_file)).getroot()

                namespaces = {"w": self.WORD_2006_NAMESPACE}
                xpath_expression = ".//w:del//w:t"
                problematic_t_elements = root.xpath(
                    xpath_expression, namespaces=namespaces
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

            except (lxml.etree.XMLSyntaxError, Exception) as e:
                errors.append(
                    f"  {xml_file.relative_to(self.unpacked_dir)}: Error: {e}"
                )

        if errors:
            print(f"FAILED - Found {len(errors)} deletion validation violations:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("PASSED - No w:t elements found within w:del elements")
            return True

    def count_paragraphs(self, xml_file: Path) -> int:
        """Count the number of paragraphs in the given XML file."""
        try:
            root = lxml.etree.parse(str(xml_file)).getroot()
            namespaces = {"w": self.WORD_2006_NAMESPACE}
            return len(root.findall(f".//{{{namespaces['w']}}}p"))
        except Exception as e:
            print(f"Error counting paragraphs in {xml_file}: {e}")
            return 0

    def compare_paragraph_counts(self) -> None:
        """Compare paragraph counts between original and new document."""
        original_count = self.count_paragraphs(self.original_file)
        new_count = self.count_paragraphs(self.xml_files[0])

        diff = new_count - original_count
        diff_str = f"+{diff}" if diff > 0 else str(diff)
        print(f"\nParagraphs: {original_count} → {new_count} ({diff_str})")

    def validate_insertions(self) -> bool:
        """
        Validate that w:delText elements are not within w:ins elements.
        """
        errors = []

        for xml_file in self.xml_files:
            if xml_file.name != "document.xml":
                continue

            try:
                root = lxml.etree.parse(str(xml_file)).getroot()
                namespaces = {"w": self.WORD_2006_NAMESPACE}
                xpath_expression = ".//w:ins//w:delText[not(ancestor::w:del)]"
                invalid_elements = root.xpath(
                    xpath_expression, namespaces=namespaces
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

            except (lxml.etree.XMLSyntaxError, Exception) as e:
                errors.append(
                    f"  {xml_file.relative_to(self.unpacked_dir)}: Error: {e}"
                )

        if errors:
            print(f"FAILED - Found {len(errors)} insertion validation violations:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("PASSED - No w:delText elements within w:ins elements")
            return True

if __name__ == "__main__":
    raise RuntimeError("This module should not be run directly.")
```

**