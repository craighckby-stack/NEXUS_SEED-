# Office Open XML Technical Reference

**Important: Read this entire document before starting.** This document covers:
- [Technical Guidelines](#technical-guidelines) - Schema compliance rules and validation requirements
- [Document Content Patterns](#document-content-patterns) - XML patterns for headings, lists, tables, formatting, etc.
- [Document Library (Python)](#document-library-python) - Recommended approach for OOXML manipulation with automatic infrastructure setup
- [Tracked Changes (Redlining)](#tracked-changes-redlining) - XML patterns for implementing tracked changes

## Technical Guidelines

### Schema Compliance
- **Element ordering in `<w:pPr>`**: `<w:pStyle>`, `<w:numPr>`, `<w:spacing>`, `<w:ind>`, `<w:jc>`
- **Whitespace**: Add `xml:space='preserve'` to `<w:t>` elements with leading/trailing spaces
- **Unicode**: Escape characters in ASCII content: `"` becomes