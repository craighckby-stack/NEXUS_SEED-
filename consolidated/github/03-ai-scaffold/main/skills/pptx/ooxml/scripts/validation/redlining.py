"""
Validator for tracked changes in Word documents.
"""

import subprocess
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

class RedliningValidator:
    """Validator for tracked changes in Word documents."""

    def __init__(self, unpacked_dir: Path, original_docx: Path, verbose: bool = False):
        self.unpacked_dir = unpacked_dir
        self.original_docx = original_docx
        self.verbose = verbose
        self.namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

    def validate(self) -> bool:
        """Main validation method that returns True if valid, False otherwise."""
        # Verify unpacked directory exists and has correct structure
        modified_file = self.unpacked_dir / "word" / "document.xml"
        if not modified_file.exists():
            print(f"FAILED - Modified document.xml not found at {modified_file}")
            return False

        # First, check if there are any tracked changes by Claude to validate
        try:
            tree = ET.parse(modified_file)
            root = tree.getroot()

            # Check for w:del or w:ins tags authored by Claude
            del_elements = root.findall(".//w:del", self.namespaces)
            ins_elements = root.findall(".//w:ins", self.namespaces)

            claude_del_elements = [elem for elem in del_elements if elem.get(f"{{{self.namespaces['w']}}}author") == "Claude"]
            claude_ins_elements = [elem for elem in ins_elements if elem.get(f"{{{self.namespaces['w']}}}author") == "Claude"]

            # Redlining validation is only needed if tracked changes by Claude have been used.
            if not claude_del_elements and not claude_ins_elements:
                if self.verbose:
                    print("PASSED - No tracked changes by Claude found.")
                return True

        except Exception:
            # If we can't parse the XML, continue with full validation
            pass

        # Create temporary directory for unpacking original docx
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            # Unpack original docx
            try:
                with zipfile.ZipFile(self.original_docx, "r") as zip_ref:
                    zip_ref.extractall(temp_path)
            except Exception as e:
                print(f"FAILED - Error unpacking original docx: {e}")
                return False

            original_file = temp_path / "word" / "document.xml"
            if not original_file.exists():
                print(f"FAILED - Original document.xml not found in {self.original_docx}")
                return False

            # Parse both XML files for redlining validation
            modified_tree = ET.parse(modified_file)
            modified_root = modified_tree.getroot()
            original_tree = ET.parse(original_file)
            original_root = original_tree.getroot()

            # Remove Claude's tracked changes from both documents
            self._remove_claude_tracked_changes(original_root)
            self._remove_claude_tracked_changes(modified_root)

            # Extract and compare text content
            modified_text = self._extract_text_content(modified_root)
            original_text = self._extract_text_content(original_root)

            if modified_text != original_text:
                # Show detailed character-level differences for each paragraph
                error_message = self._generate_detailed_diff(original_text, modified_text)
                print(error_message)
                return False

            if self.verbose:
                print("PASSED - All changes by Claude are properly tracked")
            return True

    def _generate_detailed_diff(self, original_text: str, modified_text: str) -> str:
        """Generate detailed word-level differences using git word diff."""
        error_parts = [
            "FAILED - Document text doesn't match after removing Claude's tracked changes",
            "",
            "Likely causes:",
            "  1. Modified text inside another author's <w:ins> or <w:del> tags",
            "  2. Made edits without proper tracked changes",
            "  3. Didn't nest <w:del> inside <w:ins> when deleting another's insertion",
            "",
            "For pre-redlined documents, use correct patterns:",
            "  - To reject another's INSERTION: Nest <w:del> inside their <w:ins>",
            "  - To restore another's DELETION: Add new <w:ins> AFTER their <w:del>",
            "",
        ]

        try:
            # Create two files
            temp_path = Path(tempfile.gettempdir())
            with (temp_path / "original.txt").open("w", encoding="utf-8") as original_file:
                original_file.write(original_text)

            with (temp_path / "modified.txt").open("w", encoding="utf-8") as modified_file:
                modified_file.write(modified_text)

            # Try character-level diff first for precise differences
            result = subprocess.run(
                ["git", "diff", "--word-diff=plain", "--word-diff-regex=.", "-U0", "--no-index", str(temp_path / "original.txt"), str(temp_path / "modified.txt")],
                capture_output=True,
                text=True,
            )

            if result.stdout.strip():
                # Clean up the output - remove git diff header lines
                lines = result.stdout.split("\n")
                content_lines = []
                in_content = False
                for line in lines:
                    if line.startswith("@@"):
                        in_content = True
                        continue
                    if in_content and line.strip():
                        content_lines.append(line)

                if content_lines:
                    return "\n".join(content_lines)

            # Fallback to word-level diff if character-level is too verbose
            result = subprocess.run(
                ["git", "diff", "--word-diff=plain", "-U0", "--no-index", str(temp_path / "original.txt"), str(temp_path / "modified.txt")],
                capture_output=True,
                text=True,
            )

            if result.stdout.strip():
                lines = result.stdout.split("\n")
                content_lines = []
                in_content = False
                for line in lines:
                    if line.startswith("@@"):
                        in_content = True
                        continue
                    if in_content and line.strip():
                        content_lines.append(line)
                return "\n".join(content_lines)

        except (subprocess.CalledProcessError, FileNotFoundError, Exception):
            # Git not available or other error, return None to use fallback
            pass

        return None

    def _remove_claude_tracked_changes(self, root) -> None:
        """Remove tracked changes authored by Claude from the XML root."""
        ins_tag = f"{{{self.namespaces['w']}}}ins"
        del_tag = f"{{{self.namespaces['w']}}}del"
        author_attr = f"{{{self.namespaces['w']}}}author"

        # Remove w:ins elements
        for parent in root.iter():
            to_remove = []
            for child in parent:
                if child.tag == ins_tag and child.get(author_attr) == "Claude":
                    to_remove.append(child)
            for elem in to_remove:
                parent.remove(elem)

        # Unwrap content in w:del elements where author is "Claude"
        deltext_tag = f"{{{self.namespaces['w']}}}delText"
        t_tag = f"{{{self.namespaces['w']}}}t"

        for parent in root.iter():
            to_process = []
            for child in parent:
                if child.tag == del_tag and child.get(author_attr) == "Claude":
                    to_process.append((child, list(parent).index(child)))

            # Process in reverse order to maintain indices
            for del_elem, del_index in reversed(to_process):
                # Convert w:delText to w:t before moving
                for elem in del_elem.iter():
                    if elem.tag == deltext_tag:
                        elem.tag = t_tag

                # Move all children of w:del to its parent before removing w:del
                for child in reversed(list(del_elem)):
                    parent.insert(del_index, child)
                parent.remove(del_elem)

    def _extract_text_content(self, root) -> str:
        """Extract text content from Word XML, preserving paragraph structure.

        Empty paragraphs are skipped to avoid false positives when tracked
        insertions add only structural elements without text content.
        """
        p_tag = f"{{{self.namespaces['w']}}}p"
        t_tag = f"{{{self.namespaces['w']}}}t"

        paragraphs = []
        for p_elem in root.findall(f".//{p_tag}"):
            # Get all text elements within this paragraph
            text_parts = []
            for t_elem in p_elem.findall(f".//{t_tag}"):
                if t_elem.text:
                    text_parts.append(t_elem.text)
            paragraph_text = "".join(text_parts)
            # Skip empty paragraphs - they don't affect content validation
            if paragraph_text:
                paragraphs.append(paragraph_text)

        return "\n".join(paragraphs)


if __name__ == "__main__":
    raise RuntimeError("This module should not be run directly.")