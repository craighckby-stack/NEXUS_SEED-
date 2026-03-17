"""
Validator for tracked changes in Word documents.
"""

import subprocess
import tempfile
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

class RedliningValidator:
    """Validator for tracked changes in Word documents."""

    def __init__(self, unpacked_dir: Path, original_docx: Path, verbose: bool = False):
        self.unpacked_dir = unpacked_dir
        self.original_docx = original_docx
        self.verbose = verbose
        self.namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

    def validate(self) -> bool:
        """Main validation method."""
        
        try:
            self._validate_tracked_changes_by_claude()
        except ET.ParseError as e:
            print(f"FAILED - Error parsing XML files: {e}")
            return False

        try:
            self._validate_redlining()
        except Exception as e:
            print(f"FAILED - Error during redlining validation: {e}")
            return False

        return True

    def _validate_tracked_changes_by_claude(self):
        """Check for w:del or w:ins tags authored by Claude."""
        
        modified_file = self.unpacked_dir / "word" / "document.xml"
        if not modified_file.exists():
            print(f"FAILED - Modified document.xml not found at {modified_file}")
            return

        tree = ET.parse(modified_file)
        root = tree.getroot()

        claude_del_elements = [
            elem
            for elem in root.findall(".//w:del", self.namespaces)
            if elem.get(f"{{{self.namespaces['w']}}}author") == "Claude"
        ]
        claude_ins_elements = [
            elem
            for elem in root.findall(".//w:ins", self.namespaces)
            if elem.get(f"{{{self.namespaces['w']}}}author") == "Claude"
        ]

        if not claude_del_elements and not claude_ins_elements:
            if self.verbose:
                print("PASSED - No tracked changes by Claude found.")
            return

    def _validate_redlining(self):
        """Create temporary directory, unpack original docx, and compare texts."""
        
        temp_dir = tempfile.TemporaryDirectory()
        temp_path = Path(temp_dir.name)

        try:
            with zipfile.ZipFile(self.original_docx, "r") as zip_ref:
                zip_ref.extractall(temp_path)
        except Exception as e:
            print(f"FAILED - Error unpacking original docx: {e}")
            return

        original_file = temp_path / "word" / "document.xml"
        if not original_file.exists():
            print(
                f"FAILED - Original document.xml not found in {self.original_docx}"
            )
            return

        modified_file = self.unpacked_dir / "word" / "document.xml"
        original_tree = ET.parse(original_file)
        original_root = original_tree.getroot()
        modified_tree = ET.parse(modified_file)
        modified_root = modified_tree.getroot()

        self._remove_claude_tracked_changes(original_root)
        self._remove_claude_tracked_changes(modified_root)

        original_text = self._extract_text_content(original_root)
        modified_text = self._extract_text_content(modified_root)

        if original_text != modified_text:
            error_message = self._generate_detailed_diff(original_text, modified_text)
            print(error_message)
            return

        if self.verbose:
            print("PASSED - All changes by Claude are properly tracked")
        return

    def _remove_claude_tracked_changes(self, root):
        """Remove tracked changes authored by Claude from the XML root."""
        
        ins_tag = f"{{{self.namespaces['w']}}}ins"
        del_tag = f"{{{self.namespaces['w']}}}del"
        author_attr = f"{{{self.namespaces['w']}}}author"

        for parent in root.iter():
            to_remove = []
            for child in parent:
                if child.tag == ins_tag and child.get(author_attr) == "Claude":
                    to_remove.append(child)
            for elem in to_remove:
                parent.remove(elem)

        for parent in root.iter():
            to_process = []
            for child in parent:
                if child.tag == del_tag and child.get(author_attr) == "Claude":
                    to_process.append((child, list(parent).index(child)))

            for del_elem, del_index in reversed(to_process):
                for elem in del_elem.iter():
                    if elem.tag == f"{{{self.namespaces['w']}}}delText":
                        elem.tag = f"{{{self.namespaces['w']}}}t"

                for child in reversed(list(del_elem)):
                    parent.insert(del_index, child)
                parent.remove(del_elem)

    def _extract_text_content(self, root):
        """Extract text content from Word XML, preserving paragraph structure."""
        
        p_tag = f"{{{self.namespaces['w']}}}p"
        t_tag = f"{{{self.namespaces['w']}}}t"

        paragraphs = []
        for p_elem in root.findall(f".//{p_tag}"):
            text_parts = []
            for t_elem in p_elem.findall(f".//{t_tag}"):
                if t_elem.text:
                    text_parts.append(t_elem.text)
            paragraph_text = "".join(text_parts)
            if paragraph_text:
                paragraphs.append(paragraph_text)

        return "\n".join(paragraphs)

    def _generate_detailed_diff(self, original_text, modified_text):
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

        git_diff = self._get_git_word_diff(original_text, modified_text)
        if git_diff:
            error_parts.extend(["Differences:", "============", git_diff])
        else:
            error_parts.append("Unable to generate word diff (git not available)")

        return "\n".join(error_parts)

    def _get_git_word_diff(self, original_text, modified_text):
        """Generate word diff using git with character-level precision."""
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)

                original_file = temp_path / "original.txt"
                modified_file = temp_path / "modified.txt"

                original_file.write_text(original_text, encoding="utf-8")
                modified_file.write_text(modified_text, encoding="utf-8")

                result = subprocess.run(
                    [
                        "git",
                        "diff",
                        "--word-diff=plain",
                        "--word-diff-regex=.",  
                        "-U0",
                        "--no-index",
                        str(original_file),
                        str(modified_file),
                    ],
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

                result = subprocess.run(
                    [
                        "git",
                        "diff",
                        "--word-diff=plain",
                        "-U0",
                        "--no-index",
                        str(original_file),
                        str(modified_file),
                    ],
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
            pass

        return None

if __name__ == "__main__":
    raise RuntimeError("This module should not be run directly.")
```

**