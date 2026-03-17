/**
 * DOCX Library Tutorial
 * Generate .docx files with JavaScript/TypeScript.
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, 
        Header, Footer, AlignmentType, PageOrientation, LevelFormat, ExternalHyperlink, 
        InternalHyperlink, TableOfContents, HeadingLevel, BorderStyle, WidthType, TabStopType, 
        TabStopPosition, UnderlineType, ShadingType, VerticalAlign, SymbolRun, PageNumber,
        FootnoteReferenceRun, Footnote, PageBreak } from 'docx';

/**
 * Import dependencies and configure docx library.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

// Configure docx library with custom styles and defaults
const defaultFont = 'Arial';
const defaultFontSize = 24;
const doc = new Document({
  styles: {
    default: { document: { run: { font: defaultFont, size: defaultFontSize } } },
    paragraphStyles: [
      // Document title style
      { id: "Title", name: "Title", basedOn: "Normal", run: { size: 56, bold: true, color: "000000", font: defaultFont }, paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      // Heading styles
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: "000000", font: defaultFont }, paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: "000000", font: defaultFont }, paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
    ],
    characterStyles: [
      // Custom character style
      { id: "myCharStyle", name: "My Char Style", run: { color: "FF0000", bold: true, underline: { type: UnderlineType.SINGLE } } }
    ]
  },
});

/**
 * Create a new document with content.
 */
doc.sections = [
  {
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch margins
        size: { orientation: PageOrientation.LANDSCAPE },
        pageNumbers: { start: 1, formatType: "decimal" } // Page numbering start at 1
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Header Text", style: "Title" })] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", style: "Title" }), new TextRun({ children: [PageNumber.CURRENT] }), new TextRun({ text: " of ", style: "Title" }), new TextRun({ children: [PageNumber.TOTAL_PAGES] })])]) })
    },
    children: [
      // Add content to the document
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Title")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Heading 1")] }),
      new Paragraph({ style: "myStyle", children: [new TextRun("Custom paragraph style")] }),
      new Paragraph({ children: [
        new TextRun("Normal with "),
        new TextRun({ text: "custom char style", style: "myCharStyle" })
      ]})
    ]
  }
];

/**
 * Save the document to a file.
 */
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(join(__dirname, 'output.docx'), buffer);
});

/**
 * Example usage of image and media.
 */
const image = readFileSync(join(__dirname, 'image.png'));
const imageRun = new ImageRun({
  type: "png", // Specify the image type
  data: image,
  transformation: { width: 200, height: 150, rotation: 0 }, // Rotate the image by 90 degrees
  altText: { title: "Logo", description: "Company logo", name: "Logo" } // Set the image alt text
});
new Paragraph({ alignment: AlignmentType.CENTER, children: [imageRun] });

/**
 * Example usage of table.
 */
const table = new Table({
  columnWidths: [4680, 4680], // Set the column widths
  margins: { top: 100, bottom: 100, left: 180, right: 180 }, // Set the margins
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
          width: { size: 4680, type: WidthType.DXA },
          shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Header", bold: true, size: 22 })] })]
        }),
        new TableCell({
          borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
          width: { size: 4680, type: WidthType.DXA },
          shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Bullet Points", bold: true, size: 22 })] })]
        })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
          width: { size: 4680, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun("Regular data")] })]
        }),
        new TableCell({
          borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
          width: { size: 4680, type: WidthType.DXA },
          children: [
            new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("First bullet point")] }),
            new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Second bullet point")] })
          ]
        })
      ]
    })
  ]
});

/**
 * Constants and quick reference.
 */
// Underlines
const underlines = [UnderlineType.SINGLE, UnderlineType.DOUBLE, UnderlineType.WAVY, UnderlineType.DASH];

// Borders
const borders = [BorderStyle.SINGLE, BorderStyle.DOUBLE, BorderStyle.DASHED, BorderStyle.DOTTED];

// Numbering
const numbering = [LevelFormat.DECIMAL, LevelFormat.UPPER_ROMAN, LevelFormat.LOWER_LETTER];

// Tabs
const tabs = [TabStopType.LEFT, TabStopType.CENTER, TabStopType.RIGHT, TabStopType.DECIMAL];

// Symbols
const symbols = ["2022", "00A9", "00AE", "2122", "00B0", "F070", "F0FC"];

// Critical issues and common mistakes.
// 1. PageBreak must always be inside a Paragraph
// 2. Always use ShadingType.CLEAR for table cell shading
// 3. Measurements in DXA (1440 = 1 inch)
// 4. Each table cell needs ≥1 Paragraph
// 5. TOC requires HeadingLevel styles only
// 6. Always use custom styles with Arial font for professional appearance and proper visual hierarchy
// 7. Always set a default font using styles.default.document.run.font - Arial recommended
// 8. Always use columnWidths array for tables + individual cell widths for compatibility
// 9. Never use unicode symbols for bullets - always use proper numbering configuration with LevelFormat.BULLET constant
// 10. Never use \n for line breaks anywhere - always use separate Paragraph elements for each line
// 11. Always use TextRun objects within Paragraph children - never use text property directly on Paragraph
// 12. Critical for images - ImageRun requires type parameter - always specify "png", "jpg", "jpeg", "gif", "bmp", or "svg"
// 13. Critical for bullets - Must use LevelFormat.BULLET constant, not string "bullet", and include text: "•" for the bullet character
// 14. Critical for numbering - Each numbering reference creates an INDEPENDENT list. Same reference = continues numbering (1,2,3 then 4,5,6). Different reference = restarts at 1 (1,2,3 then 1,2,3). Use unique reference names for each separate numbered section!
// 15. Critical for TOC - When using TableOfContents, headings must use HeadingLevel ONLY - do not add custom styles to heading paragraphs or TOC will break
// 16. Tables - Set columnWidths array + individual cell widths, apply borders to cells not table
// 17. Set table margins at TABLE level for consistent cell padding (avoids repetition per cell)