# skills/validation/_docx.py
from typing import Dict, List
from docx import Document
from packaging import version

class DocxValidator:
    def __init__(self, docx_file: str):
        self.docx_file = docx_file
        self.document = Document(docx_file)

    def validate_metadata(self) -> Dict[str, str]:
        """Validate document metadata."""
        metadata = self.document.core_properties
        return {
            'author': metadata.author,
            'title': metadata.title,
            'subject': metadata.subject,
            'keywords': metadata.keywords,
            'created': metadata.created,
            'modified': metadata.modified
        }

    def validate_content(self) -> List[str]:
        """Validate document content."""
        content = []
        for para in self.document.paragraphs:
            content.append(para.text)
        return content

    def validate_version(self) -> str:
        """Validate document version."""
        version_info = self.document.core_properties.version
        if version_info:
            return version.parse(version_info).major
        return None

def validate_docx(docx_file: str) -> Dict[str, str]:
    validator = DocxValidator(docx_file)
    metadata = validator.validate_metadata()
    content = validator.validate_content()
    version = validator.validate_version()
    return {
        'metadata': metadata,
        'content': content,
        'version': version
    }

# Example usage:
if __name__ == '__main__':
    docx_file = 'path_to_your_docx_file.docx'
    result = validate_docx(docx_file)
    print(result)
```

**