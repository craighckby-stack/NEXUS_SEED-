import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Enum representing Office Open XML (OOXML) syntax kinds
export const enum SyntaxKind {
  Document = "w:document",
  Body = "w:body",
  Paragraph = "w:p",
  Run = "w:r",
  Text = "w:t",
  Properties = "Pr",
  Style = "style",
  Relationship = "Relationship",
  Types = "Types",
  Override = "Override"
}

// Object containing namespace mappings for OOXML
const XML_NS = {
  W: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  R: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  PR: "http://schemas.openxmlformats.org/package/2006/relationships",
  CP: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
  TYPES: "http://schemas.openxmlformats.org/package/2006/content-types",
  W14: "http://schemas.microsoft.com/office/word/2010/wordml",
  DC: "http://purl.org/dc/elements/1.1/",
  DCTERMS: "http://purl.org/dc/terms/"
} as const;

// Interface representing a relationship in an OOXML document
interface Relationship {
  id: string;
  type: string;
  target: string;
}

// Manager responsible for registering and emitting relationships in an OOXML document
class RelationshipManager {
  private entries: Relationship[] = [];
  private rIdCounter = 1;

  public register(type: string, target: string): string {
    const id = `rId${this.rIdCounter++}`;
    this.entries.push({ id, type, target });
    return id;
  }

  public emit(): string {
    const items = this.entries.map((rel) =>
      `<Relationship Id="${rel.id}" Type="${rel.type}" Target="${rel.target}"/>`
    ).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${XML_NS.PR}">${items}</Relationships>`;
  }
}

// Interface representing a PropertyState
interface PropertyState {
  b?: boolean;
  i?: boolean;
  sz?: number;
  color?: string;
}

// Interface representing a RunNode
interface RunNode {
  readonly kind: SyntaxKind.Run;
  readonly rPr?: PropertyState;
  readonly t: string;
  readonly rId?: string;
}

// Interface representing a ParagraphNode
interface ParagraphNode {
  readonly kind: SyntaxKind.Paragraph;
  readonly pId: string;
  readonly pStyle: string;
  readonly runs: RunNode[];
}

// Engine responsible for resolving styles in an OOXML document
class StylingEngine {
  private styleMap = new Map<string, { basedOn?: string; props: PropertyState }>();

  constructor() {
    this.styleMap.set('Normal', { props: { sz: 22, color: "E1E1E1" } });
    this.styleMap.set('Heading1', { basedOn: 'Normal', props: { b: true, sz: 32, color: "06B2D2" } });
  }

  public resolveEffectiveProps(styleId: string, localProps?: PropertyState): PropertyState {
    const style = this.styleMap.get(styleId) || this.styleMap.get('Normal')!;
    const parentProps = style.basedOn ? this.resolveEffectiveProps(style.basedOn) : {};
    return { ...parentProps, ...style.props, ...localProps };
  }
}

// Emitter responsible for generating OOXML content
class OOXMLEmitter {
  public emit(nodes: ParagraphNode[]): string {
    const body = nodes.map((n) => this.emitParagraph(n)).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${XML_NS.W}" xmlns:r="${XML_NS.R}" xmlns:w14="${XML_NS.W14}">
  <w:body>${body}</w:body>
</w:document>`;
  }

  private emitParagraph(node: ParagraphNode): string {
    const runs = node.runs.map((r) => this.emitRun(r)).join('');
    return `<w:p w14:paraId="${node.pId}">
      <w:pPr><w:pStyle w:val="${node.pStyle}"/></w:pPr>
      ${runs}
    </w:p>`;
  }

  private emitRun(node: RunNode): string {
    let rPr = '';
    if (node.rPr) {
      rPr = '<w:rPr>';
      if (node.rPr.b) rPr += '<w:b/>';
      if (node.rPr.i) rPr += '<w:i/>';
      if (node.rPr.sz) rPr += `<w:sz w:val="${node.rPr.sz}"/>`;
      if (node.rPr.color) rPr += `<w:color w:val="${node.rPr.color}"/>`;
      rPr += '</w:rPr>';
    }
    return `<w:r>${rPr}<w:t xml:space="preserve">${node.t}</w:t></w:r>`;
  }
}

// Class representing an OOXML package
class OOXMLPackage {
  public readonly id: string;
  private paragraphs: ParagraphNode[] = [];
  private rels = new RelationshipManager();
  private styles = new StylingEngine();
  private emitter = new OOXMLEmitter();

  public stats = { pCount: 0, rCount: 0 };
  public metadata = {
    creator: 'DALEK_CAAN_v10.5',
    revision: 'FINAL_SATURATION',
    created: new Date()
  };

  constructor() {
    this.rels = new RelationshipManager();
    this.styles = new StylingEngine();
    this.emitter = new OOXMLEmitter();
  }

  public registerRelationship(type: string, target: string): string {
    return this.rels.register(type, target);
  }

  public emitDocument(): string {
    return this.emitter.emit(this.getNodes());
  }

  public emitRelationships(): string {
    return this.rels.emit();
  }

  public addParagraph(node: ParagraphNode): void {
    this.paragraphs.push(node);
    this.stats.pCount++;
  }

  public resolveNodeStyle(node: ParagraphNode): PropertyState {
    return this.styles.resolveEffectiveProps(node.pStyle, node.runs[0].rPr);
  }

  public getNodes(): ParagraphNode[] {
    return this.paragraphs;
  }
}