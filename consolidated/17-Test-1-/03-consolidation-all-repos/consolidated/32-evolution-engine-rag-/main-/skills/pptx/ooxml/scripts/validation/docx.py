"""
Validator for Word document XML files against XSD schemas.
"""

import re
import tempfile
import zipfile
from pathlib import Path

import lxml.etree

from .base import BaseSchemaValidator


class DOCXSchemaValidator(BaseSchemaValidator):
    """Validator for Word document XML files against XSD schemas."""

    WORD_2006_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"
    ELEMENT_RELATIONSHIP_TYPES = {}

    def validate(self) -> bool:
        """Run all validation checks and return True if all pass."""
        validation_checks = [
            self.validate_xml,
            self.validate_namespaces,
            self.validate_unique_ids,
            self.validate_file_references,
            self.validate_content_types,
            self.validate_against_xsd,
            self.validate_whitespace_preservation,
            self.validate_deletions,
            self.validate_insertions,
            self.validate_all_relationship_ids,
        ]

        for check in validation_checks:
            if not check():
                return False

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

                for elem in root.iter(f"{{{self.WORD_2006_NAMESPACE}}}t"):
                    if elem.text and (elem.text.strip() != elem.text):
                        xml_space_attr = f"{{{self.XML_NAMESPACE}}}space"
                        if (
                            xml_space_attr not in elem.attrib
                            or elem.attrib[xml_space_attr] != "preserve"
                        ):
                            text_preview = (
                                repr(elem.text)[:50] + "..."
                                if len(repr(elem.text)) > 50
                                else repr(elem.text)
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
        For some reason, XSD validation does not catch this, so we do it manually.
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

    def count_paragraphs_in_unpacked(self) -> int:
        """Count the number of paragraphs in the unpacked document."""
        count = 0

        for xml_file in self.xml_files:
            if xml_file.name != "document.xml":
                continue

            try:
                root = lxml.etree.parse(str(xml_file)).getroot()
                paragraphs = root.findall(f".//{{{self.WORD_2006_NAMESPACE}}}p")
                count = len(paragraphs)
            except Exception as e:
                print(f"Error counting paragraphs in unpacked document: {e}")

        return count

    def count_paragraphs_in_original(self) -> int:
        """Count the number of paragraphs in the original docx file."""
        count = 0

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                with zipfile.ZipFile(self.original_file, "r") as zip_ref:
                    zip_ref.extractall(temp_dir)

                doc_xml_path = Path(temp_dir) / "word" / "document.xml"
                root = lxml.etree.parse(str(doc_xml_path)).getroot()
                paragraphs = root.findall(f".//{{{self.WORD_2006_NAMESPACE}}}p")
                count = len(paragraphs)

        except Exception as e:
            print(f"Error counting paragraphs in original document: {e}")

        return count

    def validate_insertions(self) -> bool:
        """
        Validate that w:delText elements are not within w:ins elements.
        w:delText is only allowed in w:ins if nested within a w:del.
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

    def compare_paragraph_counts(self) -> None:
        """Compare paragraph counts between original and new document."""
        original_count = self.count_paragraphs_in_original()
        new_count = self.count_paragraphs_in_unpacked()

        diff = new_count - original_count
        diff_str = f"+{diff}" if diff > 0 else str(diff)
        print(f"\nParagraphs: {original_count} → {new_count} ({diff_str})")


if __name__ == "__main__":
    raise RuntimeError("This module should not be run directly.")