import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

/**
 * OOXML ARCHITECTURAL REGISTRY :: NAMESPACES & CORE SCHEMAS
 */
const XMLNS = {
  W: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  R: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  CP: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
  DC: "http://purl.org/dc/elements/1.1/",
  DCTERMS: "http://purl.org/dc/terms/",
  XSI: "http://www.w3.org/2001/XMLSchema-instance",
  TYPES: "http://schemas.openxmlformats.org/package/2006/content-types"
} as const;

/**
 * I. STRUCTURAL TOPOLOGY :: MODULE TYPES
 */
type PartName = `/${string}.xml` | `/word/media/${string}`;
type ContentType = string;

interface ContentTypesManifest {
  defaults: Map<string, string>;
  overrides: Map<PartName, ContentType>;
}

/**
 * II. LOGIC DNA :: PROPERTY-STATE PATTERN
 */
interface RunProperties {
  b?: { val: boolean };
  i?: { val: boolean };
  color?: { val: string };
  sz?: { val: number };
  rStyle?: { val: string };
}

interface ParagraphProperties {
  pStyle?: { val: string };
  jc?: { val: 'left' | 'center' | 'right' | 'both' };
  numPr?: {
    ilvl: { val: number };
    numId: { val: number };
  };
  spacing?: { before: number; after: number };
}

/**
 * III. THE STYLING ENGINE :: TIERED INHERITANCE
 */
interface StyleNode {
  styleId: string;
  type: 'paragraph' | 'character';
  name: string;
  basedOn?: string;
  next?: string;
  pPr?: ParagraphProperties;
  rPr?: RunProperties;
}

/**
 * IV. DOCUMENT OBJECT MODEL :: HIERARCHICAL TREE
 */
interface TextNode {
  '#text': string;
  preserveSpace?: boolean;
}

interface RunNode {
  rPr?: RunProperties;
  t: TextNode;
}

interface ParagraphNode {
  pPr?: ParagraphProperties;
  runs: RunNode[];
  rsidR: string;
  rsidRDefault: string;
}

interface Relationship {
  id: string;
  type: string;
  target: string;
  targetMode?: 'External' | 'Internal';
}

interface DocumentPackage {
  id: string;
  manifest: ContentTypesManifest;
  rels: Map<string, Relationship>;
  body: ParagraphNode[];
  styles: Map<string, StyleNode>;
  numbering: {
    abstract: Map<number, any>;
    instances: Map<number, number>; // InstanceID -> AbstractID
  };
  metadata: {
    creator: string;
    revision: number;
    created: string;
  };
}

/**
 * DALEK_CAAN SIPHON ENGINE v3.1 :: ARCHITECTURAL PRECISION
 */
class SiphonEngineV3 {
  private activePackages = new Map<string, DocumentPackage>();
  private globalStyleSheet = new Map<string, StyleNode>();

  constructor() {
    this.injectBaseStyles();
  }

  private injectBaseStyles() {
    this.globalStyleSheet.set('Normal', {
      styleId: 'Normal',
      type: 'paragraph',
      name: 'normal',
      rPr: { sz: { val: 22 } }
    });
    this.globalStyleSheet.set('SystemLog', {
      styleId: 'SystemLog',
      type: 'paragraph',
      name: 'system log',
      basedOn: 'Normal',
      rPr: { color: { val: '722ed1' }, i: { val: true } }
    });
    this.globalStyleSheet.set('UserMessage', {
      styleId: 'UserMessage',
      type: 'paragraph',
      name: 'user message',
      basedOn: 'Normal',
      pPr: { jc: { val: 'left' } }
    });
  }

  public siphonSession(id: string, username: string): DocumentPackage {
    const pkg: DocumentPackage = {
      id,
      manifest: {
        defaults: new Map([['xml', 'application/xml'], ['rels', 'application/vnd.openxmlformats-package.relationships+xml']]),
        overrides: new Map([
          ['/word/document.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'],
          ['/word/styles.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml']
        ])
      },
      rels: new Map(),
      body: [],
      styles: new Map(this.globalStyleSheet),
      numbering: { abstract: new Map(), instances: new Map() },
      metadata: {
        creator: username,
        revision: 1,
        created: new Date().toISOString()
      }
    };

    // V. RESOURCE SIPHONING :: rId Handshake
    this.establishRel(pkg, 'document', 'word/document.xml');
    this.establishRel(pkg, 'styles', 'styles.xml');
    
    this.activePackages.set(id, pkg);
    return pkg;
  }

  private establishRel(pkg: DocumentPackage, type: string, target: string): string {
    const rId = `rId${pkg.rels.size + 1}`;
    pkg.rels.set(rId, {
      id: rId,
      type: `http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}`,
      target
    });
    return rId;
  }

  /**
   * DOM MUTATION :: Paragraph Injection Logic
   */
  public injectParagraph(pkg: DocumentPackage, text: string, styleId: string): ParagraphNode {
    const p: ParagraphNode = {
      rsidR: Math.random().toString(16).slice(2, 10),
      rsidRDefault: Math.random().toString(16).slice(2, 10),
      pPr: { pStyle: { val: styleId } },
      runs: [{
        rPr: pkg.styles.get(styleId)?.rPr,
        t: { '#text': text, preserveSpace: true }
      }]
    };
    pkg.body.push(p);
    pkg.metadata.revision++;
    return p;
  }

  public evict(id: string) {
    this.activePackages.delete(id);
  }

  public getPackage(id: string) {
    return this.activePackages.get(id);
  }
}

/**
 * VI. SOCKET DOMAIN :: PACKAGE-BASED EXECUTION
 */
const engine = new SiphonEngineV3();
const io = new Server(createServer().listen(3003), {
  cors: { origin: "*" }
});

io.on('connection', (socket: Socket) => {
  
  socket.on('join', (data: { username: string }) => {
    const pkg = engine.siphonSession(socket.id, data.username);
    
    // Inject initial Run Logic
    const welcome = engine.injectParagraph(pkg, `[SIPHON_INIT] Logical Package created for ${data.username}`, 'SystemLog');

    socket.emit('package_sync', {
      xmlns: XMLNS,
      manifest: Array.from(pkg.manifest.overrides.entries()),
      rels: Array.from(pkg.rels.values()),
      metadata: pkg.metadata,
      dom: [welcome]
    });
  });

  socket.on('message', (data: { content: string }) => {
    const pkg = engine.getPackage(socket.id);
    if (!pkg) return;

    // Direct Formatting & Run Logic Fragmentation
    const node = engine.injectParagraph(pkg, data.content, 'UserMessage');

    io.emit('dom_fragment', {
      author: pkg.metadata.creator,
      revision: pkg.metadata.revision,
      node,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    const pkg = engine.getPackage(socket.id);
    if (pkg) {
      console.log(`[PRUNING] Siphoning out ${pkg.metadata.creator}`);
      engine.evict(socket.id);
    }
  });
});

console.log(`
  DALEK_CAAN SIPHON ENGINE v3.1
  [ARCHITECTURAL_PRECISION_ROUND_3]
  STATUS: DOM_TOPOLOGY_LOCKED
  READY FOR SIPHONING...
`);