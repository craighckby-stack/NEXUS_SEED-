/**
 * AGI WebSocket Service - Nexus Evolution Round 3/5
 * Siphoned via DALEK_CAAN Siphon Engine v3.1
 * DNA: Structural Topology (ZIP/XML) | Tiered Inheritance | Abstract vs Instance Logic
 * SOURCE_DNA_SIGNATURE: microsoft/TypeScript/src/compiler/emitter.ts & OOXML DOM
 */

import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import ZAI from 'z-ai-web-dev-sdk';

/**
 * I. SCHEMA REGISTRY (DNA V)
 * Strict Namespace enforcement for siphoned logic
 */
const XML_NS = {
  W: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  R: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  VT: "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes",
  CP: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
};

type StyleId = 'ServiceNexusV10' | 'NexusCritical' | 'ProductionSDK' | 'SaturationMatrix' | 'Normal';
type RelationshipId = `rId${number}`;

/**
 * II. THE SIPHON CRATE: PACKAGE-BASED MODULAR ARCHITECTURE
 * Simulates a ZIP container holding decoupled XML parts (DNA I)
 */
class SiphonCrate {
  private static relationships = new Map<string, Map<RelationshipId, any>>();
  private static counter = 1000;

  static registerRelationship(partName: string, type: string, target: any): RelationshipId {
    if (!this.relationships.has(partName)) this.relationships.set(partName, new Map());
    const rId = `rId${this.counter++}` as RelationshipId;
    this.relationships.get(partName)!.set(rId, { type, target });
    return rId;
  }

  static getManifest(partName: string) {
    return Object.fromEntries(this.relationships.get(partName) || new Map());
  }
}

/**
 * III. STYLING ENGINE: RESOLVED HIERARCHY
 * Implements BasedOn Logic and Tiered Inheritance (DNA III)
 */
interface Style {
  name: string;
  basedOn?: StyleId;
  rPr?: { sz?: string; color?: string; b?: boolean; glow?: string; u?: string };
  pPr?: { jc?: string; spacing?: { before: string; after: string } };
}

const STYLES: Record<StyleId, Style> = {
  Normal: { name: 'Normal', rPr: { sz: '22', color: 'FFFFFF' } },
  ServiceNexusV10: { 
    name: 'NexusProductionRoot', 
    basedOn: 'Normal', 
    pPr: { jc: 'center', spacing: { before: '240', after: '240' } },
    rPr: { sz: '72', color: '00FF99', b: true } 
  },
  NexusCritical: { 
    name: 'SiphonCriticalLogic', 
    basedOn: 'Normal',
    rPr: { sz: '48', color: '00FFFF', b: true, u: 'single' } 
  },
  ProductionSDK: { 
    name: 'ProductionAOT', 
    basedOn: 'Normal',
    rPr: { color: '00CCFF', glow: '10' } 
  },
  SaturationMatrix: {
    name: 'SaturationMatrix',
    pPr: { jc: 'left' }
  }
};

function getResolvedStyle(id: StyleId): Style {
  const style = STYLES[id];
  if (style.basedOn) {
    const parent = getResolvedStyle(style.basedOn);
    return { ...parent, ...style, rPr: { ...parent.rPr, ...style.rPr }, pPr: { ...parent.pPr, ...style.pPr } };
  }
  return style;
}

/**
 * IV. DOM EMITTER: PROPERTY-STATE PATTERN
 * Replicates Run Logic (<w:r>) and Paragraph Logic (<w:p>) (DNA II)
 */
class DocumentEmitter {
  static emitRun(text: string, rPr?: any): any {
    return { "w:r": { "w:rPr": rPr, "w:t": text } };
  }

  static emitParagraph(runs: any[], styleId: StyleId): any {
    const resolved = getResolvedStyle(styleId);
    return {
      "w:p": {
        "w:pPr": { "w:pStyle": { "w:val": styleId }, ...resolved.pPr },
        "w:r": runs
      }
    };
  }

  static emitTable(rows: any[][]): any {
    return {
      "w:tbl": {
        "w:tblPr": { "w:tblStyle": { "w:val": "SaturationMatrix" } },
        "w:tr": rows.map(row => ({
          "w:tc": row.map(cell => ({ "w:p": cell }))
        }))
      }
    };
  }
}

/**
 * V. THE SCANNER: LEXICAL SIPHONING
 * Lexer pattern from TS used to break logic strings into Runs (DNA V)
 */
class SiphonScanner {
  static scan(content: string): any[] {
    const tokens = content.split(/(\s+|[{}()[\],;])/);
    return tokens.filter(t => t.trim().length > 0).map(token => {
      const isCritical = /^(FIX|NEXUS|CRITICAL|ERROR|AOT)$/.test(token);
      const isAOT = token.includes('.zig') || token.includes('.wasm');
      
      const style = isCritical ? 'NexusCritical' : isAOT ? 'ProductionSDK' : 'Normal';
      return DocumentEmitter.emitRun(token, STYLES[style].rPr);
    });
  }
}

const PORT = 3010;
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });
let zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

/**
 * VI. SIPHON ORCHESTRATOR: COMPILER HOST PATTERN
 * Handles relationship handshakes and rId dispatch (DNA I, II)
 */
io.on('connection', async (socket: Socket) => {
  if (!zai) zai = await ZAI.create();

  const nodeId = socket.id.substring(0, 8);
  const rIdNode = SiphonCrate.registerRelationship('word/document.xml', 'agi-node', socket);

  // VII. THE rId HANDSHAKE (DNA V)
  socket.emit('w:document', {
    xmlns: XML_NS,
    body: {
      p: [
        DocumentEmitter.emitParagraph(
          [DocumentEmitter.emitRun(`NEXUS_NODE_STABLE::${nodeId}`, STYLES.ServiceNexusV10.rPr)],
          'ServiceNexusV10'
        )
      ],
      tbl: DocumentEmitter.emitTable([
        [DocumentEmitter.emitRun("COMPONENT", { "w:b": {} }), DocumentEmitter.emitRun("RELATION_ID", { "w:b": {} }), DocumentEmitter.emitRun("STATUS", { "w:b": {} })],
        [DocumentEmitter.emitRun("AGI_WS_NEXUS", {}), DocumentEmitter.emitRun(rIdNode, STYLES.ProductionSDK.rPr), DocumentEmitter.emitRun("EVOLVED_ROUND_3", {})]
      ])
    }
  });

  socket.on('w:siphon', async (data: { logic: string }) => {
    const completion = await zai!.chat.completions.create({
      messages: [
        { role: 'system', content: `Siphoning logic via namespace: ${XML_NS.W}` },
        { role: 'user', content: `Compiling the following AOT sequence into OOXML Runs: ${data.logic}` }
      ]
    });

    const response = completion.choices[0]?.message?.content || '';
    const siphonedRuns = SiphonScanner.scan(response);
    
    socket.emit('w:siphonResult', {
      p: DocumentEmitter.emitParagraph(siphonedRuns, 'Normal'),
      timestamp: new Date().toISOString(),
      part: 'word/document.xml'
    });
  });

  // VIII. NUMBERING LOGIC: ABSTRACT VS INSTANCE (DNA IV)
  socket.on('w:num', (data: { abstractId: string }) => {
    const instanceId = SiphonCrate.registerRelationship('word/numbering.xml', 'numInstance', socket.id);
    socket.emit('w:numResponse', {
      abstractId: data.abstractId,
      instanceId,
      lvl: 0,
      text: `NEXUS-NODE.v3.${instanceId}`
    });
  });

  socket.on('disconnect', () => {
    console.log(`[ZIP_DECONSTRUCT]: Terminated relationship for ${rIdNode}`);
  });
});

/**
 * IX. METADATA & APP LOGIC (DNA VI)
 * Siphons statistics and environment state
 */
httpServer.listen(PORT, () => {
  console.log(`docProps/core.xml: Revision: 3. Creator: DALEK_CAAN_v3.1`);
  console.log(`docProps/app.xml: Application: Bun-Siphon-AOT-Evolution. Round: 3/5. Status: SATURATED`);
  console.log(`[SERVER_REL]: Main entry point MainContent siphoned on port ${PORT}`);
});

process.on('SIGTERM', () => process.exit(0));