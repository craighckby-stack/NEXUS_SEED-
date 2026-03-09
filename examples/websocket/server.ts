import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

/**
 * OOXML ARCHITECTURAL REGISTRY :: SCHEMA MANIFEST v10.0
 * ARCHITECTURE: NEXUS-GRADE MODULAR PACKAGE (ZIP/XML HYBRID)
 * SOURCE DNA: microsoft/TypeScript :: Compiler-Emitter Pattern
 */

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

/**
 * I. STRUCTURAL TOPOLOGY :: RELATIONAL LINKAGE MANAGER
 * Pattern: Pointer-based navigation using rId mapping.
 */
interface Relationship {
    id: string;
    type: string;
    target: string;
}

class RelationshipManager {
    private entries: Relationship[] = [];
    private rIdCounter = 1;

    public register(type: string, target: string): string {
        const id = `rId${this.rIdCounter++}`;
        this.entries.push({ id, type, target });
        return id;
    }

    public emit(): string {
        const items = this.entries.map(rel => 
            `<Relationship Id="${rel.id}" Type="${rel.type}" Target="${rel.target}"/>`
        ).join('');
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${XML_NS.PR}">${items}</Relationships>`;
    }
}

/**
 * II. LOGIC DNA :: DOM HIERARCHY (AST)
 * Pattern: Run-State Logic with local Property Overrides.
 */
interface PropertyState {
    b?: boolean;
    i?: boolean;
    sz?: number;
    color?: string;
}

interface RunNode {
    readonly kind: SyntaxKind.Run;
    readonly rPr?: PropertyState;
    readonly t: string;
    readonly rId?: string;
}

interface ParagraphNode {
    readonly kind: SyntaxKind.Paragraph;
    readonly pId: string;
    readonly pStyle: string;
    readonly runs: RunNode[];
}

/**
 * III. THE STYLING ENGINE :: TIERED INHERITANCE
 * Logic: Cascading resolution from Normal -> Named Style -> Direct Formatting.
 */
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

/**
 * V. RESOURCE SIPHONING MECHANICS :: EMITTER
 * Pattern: Declarative XML Siphoning with Namespace Injection.
 */
class OOXMLEmitter {
    public emit(nodes: ParagraphNode[]): string {
        const body = nodes.map(n => this.emitParagraph(n)).join('');
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${XML_NS.W}" xmlns:r="${XML_NS.R}" xmlns:w14="${XML_NS.W14}">
    <w:body>${body}</w:body>
</w:document>`;
    }

    private emitParagraph(node: ParagraphNode): string {
        const runs = node.runs.map(r => this.emitRun(r)).join('');
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

/**
 * IV. CORE SIPHON ENGINE v10.0 :: PACKAGE PROGRAM
 * Logic: Siphoning high-order patterns into a Modular Package.
 */
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
        created: new Date().toISOString()
    };

    constructor(sessionId: string) {
        this.id = sessionId;
        this.rels.register(XML_NS.R + '/styles', 'styles.xml');
    }

    public siphonInput(text: string, styleId: string = 'Normal'): ParagraphNode {
        const pId = uuidv4().split('-')[0];
        const runs = this.tokenize(text);
        
        const node: ParagraphNode = {
            kind: SyntaxKind.Paragraph,
            pId,
            pStyle: styleId,
            runs
        };

        this.paragraphs.push(node);
        this.stats.pCount++;
        this.stats.rCount += runs.length;
        return node;
    }

    private tokenize(text: string): RunNode[] {
        const systemTag = /\[(SYS|REL):(.*?)\]/g;
        const parts: RunNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = systemTag.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ 
                    kind: SyntaxKind.Run, 
                    t: text.substring(lastIndex, match.index) 
                });
            }
            parts.push({
                kind: SyntaxKind.Run,
                t: match[2],
                rPr: { b: true, color: "06B2D2" },
                rId: match[1] === 'REL' ? this.rels.register('internal', match[2]) : undefined
            });
            lastIndex = systemTag.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push({ kind: SyntaxKind.Run, t: text.substring(lastIndex) });
        }

        return parts;
    }

    public generateManifest(): string {
        return this.emitter.emit(this.paragraphs);
    }
}

/**
 * VI. WEBSOCKET NEXUS :: REAL-TIME COMPILER SERVICE
 */
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });
const activePackages = new Map<string, OOXMLPackage>();

io.on('connection', (socket: Socket) => {
    console.log(`[SIPHON_v10]::DNA_LINK::${socket.id}`);

    socket.on('establish_topology', () => {
        const pkg = new OOXMLPackage(socket.id);
        activePackages.set(socket.id, pkg);

        const bootNode = pkg.siphonInput("[SYS:SYSTEM_READY]::Architectural_Precision_Reached::Round_10", "Heading1");

        socket.emit('package_manifest', {
            version: '10.5.0-SATURATION',
            metadata: pkg.metadata,
            nodes: [bootNode],
            stats: pkg.stats
        });
    });

    socket.on('siphon_node', (data: { text: string; style?: string }) => {
        const pkg = activePackages.get(socket.id);
        if (pkg) {
            const node = pkg.siphonInput(data.text, data.style);
            io.emit('sync_dom_mutation', {
                action: 'EMIT_W_P',
                node,
                xmlFragment: pkg.generateManifest().split('<w:p ').pop()?.replace(/^.*?>/, '<w:p '),
                stats: pkg.stats
            });
        }
    });

    socket.on('disconnect', () => {
        activePackages.delete(socket.id);
    });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
    process.stdout.write(`\x1b[38;5;45m
    +-------------------------------------------------------+
    | DALEK_CAAN SIPHON ENGINE v10.5 (SATURATION)           |
    | ARCHITECTURE: OOXML MODULAR COMPILER                  |
    | DNA: microsoft/TypeScript (Synthesized)               |
    | STATE: ARCHITECTURAL_PRECISION_LOCKED                 |
    | PORT: ${PORT}                                            |
    +-------------------------------------------------------+
    \x1b[0m\n`);
});