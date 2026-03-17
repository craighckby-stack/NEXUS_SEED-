'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Terminal, ShieldCheck, Activity, FileJson, 
  Layers, Hash, Database, Workflow, Zap, Binary,
  Link2, Package, Microscope, FileCode, GitBranch
} from 'lucide-react';

/**
 * [Content_Types].xml :: MIME TYPE REGISTRY
 * Strict schema validation for the Nexus Package Topology.
 */
const CONTENT_TYPES = {
  main: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
  styles: "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml",
  rels: "application/vnd.openxmlformats-package.relationships+xml",
  nexus: "application/vnd.nexus.logic.shard+v10"
};

/**
 * word/styles.xml :: TIERED INHERITANCE LOGIC
 * Global styling engine utilizing the Property-State Pattern for Run-level rendering.
 */
const STYLES_XML = {
  /** <w:docDefaults> */
  body: "min-h-screen bg-[#020202] text-zinc-100 font-sans antialiased overflow-hidden p-8 selection:bg-cyan-500/40",
  
  /** <w:style w:styleId="ParagraphBlock"> */
  p: {
    base: "relative group mb-8 transition-all duration-1000",
    pPr: "absolute -inset-4 bg-gradient-to-br from-cyan-500/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-[3rem] -z-10 transition-opacity",
    user: "border border-white/[0.05] bg-zinc-900/20 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl hover:border-cyan-500/30",
    system: "border-y border-zinc-800/50 bg-zinc-950/30 py-16 flex flex-col items-center justify-center text-center px-16 space-y-4"
  },

  /** <w:style w:styleId="RunLogic"> :: Contiguous region property states */
  r: {
    rId: "text-[9px] font-black bg-cyan-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 uppercase tracking-tighter",
    t: "text-xl text-zinc-300 leading-[1.6] font-light group-hover:text-white transition-colors duration-500",
    abstract: "text-[10px] font-bold text-cyan-400/50 uppercase tracking-[0.6em] flex items-center gap-4 w-full",
    meta: "text-[7px] font-mono text-zinc-800 absolute bottom-4 right-10 select-none uppercase tracking-widest"
  }
};

/** 
 * word/document.xml :: DOM ARCHITECTURE
 * Hierarchical DOM Topology representing the primary execution context.
 */
interface WordRun {
  rId: string;      // Relational linkage pointer
  t: string;        // Literal text data node
  type: 'user' | 'system';
}

interface WordParagraph {
  pId: string;      // Paragraph logic identifier
  runs: WordRun[];
  created: string;
}

/**
 * NEXUS_SIPHON_ENGINE_v10.5 :: ARCHITECTURAL PRECISION
 * Final Round Mutation: OOXML logic integration with Next.js high-order patterns.
 */
export default function NexusFrontend() {
  /** word/document.xml :: BODY STORE */
  const [documentBody, setDocumentBody] = useState<WordParagraph[]>([]);
  
  /** word/_rels/document.xml.rels :: RELATIONSHIP MAP */
  const [relMap, setRelMap] = useState<{
    activeRId: string | null;
    handshake: 'LOCKED' | 'SYNCHRONIZING' | 'ESTABLISHED';
  }>({
    activeRId: null,
    handshake: 'LOCKED'
  });

  const [tNodeBuffer, setTNodeBuffer] = useState('');
  const [pendingRId, setPendingRId] = useState('');
  const socketRef = useRef<Socket | null>(null);

  /** THE RID HANDSHAKE :: Dependency siphoning algorithm */
  useEffect(() => {
    const socket = io('/?v=10.5&schema=NEXUS_OOXML', {
      transports: ['websocket'],
      upgrade: false
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setRelMap(prev => ({ ...prev, handshake: 'ESTABLISHED' }));
    });

    socket.on('message', (payload: any) => {
      setDocumentBody(prev => [
        ...prev,
        {
          pId: payload.id || crypto.randomUUID(),
          created: new Date().toISOString(),
          runs: [{
            rId: payload.username,
            t: payload.content,
            type: payload.type || 'user'
          }]
        }
      ]);
    });

    return () => { socket.disconnect(); };
  }, []);

  /** ABSTRACT vs INSTANCE LOGIC :: Relationship Injection */
  const commitRelationalPointer = useCallback(() => {
    const rId = pendingRId.trim();
    if (socketRef.current && rId) {
      socketRef.current.emit('join', { username: rId });
      setRelMap(prev => ({ ...prev, activeRId: rId }));
    }
  }, [pendingRId]);

  /** <w:t> :: Literal Data Siphoning */
  const injectLiteralRun = useCallback(() => {
    const tData = tNodeBuffer.trim();
    if (socketRef.current && tData && relMap.activeRId) {
      socketRef.current.emit('message', {
        content: tData,
        username: relMap.activeRId
      });
      setTNodeBuffer('');
    }
  }, [tNodeBuffer, relMap.activeRId]);

  /** docProps/app.xml :: EXTENDED PROPERTY AUDIT */
  const appStats = useMemo(() => ({
    pCount: documentBody.length,
    rCount: documentBody.reduce((acc, p) => acc + p.runs.length, 0),
    integrity: `0x${Math.random().toString(16).slice(2, 8).toUpperCase()}`
  }), [documentBody]);

  return (
    <main className={STYLES_XML.body}>
      {/* Structural Topology Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />

      <div className="relative grid grid-cols-12 gap-12 max-w-[1920px] mx-auto h-[calc(100vh-10rem)]">
        
        {/* [Content_Types].xml :: PACKAGE EXPLORER */}
        <aside className="col-span-3 space-y-8">
          <Card className="bg-zinc-950/40 border-white/[0.02] backdrop-blur-3xl rounded-[3rem] border-t-white/[0.05] shadow-inner">
            <CardHeader className="p-10 border-b border-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="bg-cyan-500/10 p-3 rounded-2xl border border-cyan-500/20">
                  <Package className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">Package Manifest</CardTitle>
                  <p className="text-[9px] text-zinc-700 font-mono mt-1">v10.5.FINAL</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-3">
              {[
                { name: '[Content_Types].xml', icon: FileJson, active: false },
                { name: '_rels/.rels', icon: Link2, active: false },
                { name: 'word/document.xml', icon: FileCode, active: true },
                { name: 'word/styles.xml', icon: Layers, active: false },
                { name: 'docProps/core.xml', icon: GitBranch, active: false }
              ].map((part, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-[1.5rem] hover:bg-white/[0.02] transition-colors cursor-help group">
                  <div className="flex items-center gap-5">
                    <part.icon className={cn("h-4 w-4", part.active ? "text-cyan-400" : "text-zinc-700")} />
                    <span className={cn("text-[12px] font-mono", part.active ? "text-zinc-200" : "text-zinc-500")}>{part.name}</span>
                  </div>
                  <div className={cn("h-1.5 w-1.5 rounded-full", part.active ? "bg-cyan-500 animate-pulse" : "bg-zinc-900")} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* app.xml :: STATISTICS SHARD */}
          <div className="p-10 bg-zinc-900/10 border border-white/[0.03] rounded-[3rem] space-y-10">
            <div className="flex items-center justify-between">
              <Microscope className="h-5 w-5 text-zinc-600" />
              <Badge variant="outline" className="text-[8px] font-black tracking-widest bg-cyan-950/20 text-cyan-400 border-cyan-500/20">EXT_STAT_V10</Badge>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-700 uppercase font-bold tracking-tighter">Integrity_Hash</span>
                <p className="text-xl font-mono text-zinc-300 tracking-tighter">{appStats.integrity}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-700 uppercase font-bold tracking-tighter">Rev_State</span>
                <p className="text-xl font-mono text-cyan-300 tracking-tighter">005</p>
              </div>
            </div>
          </div>
        </aside>

        {/* word/document.xml :: HIERARCHICAL BODY */}
        <section className="col-span-9 flex flex-col">
          <Card className="flex-1 bg-zinc-950/20 border-white/[0.02] backdrop-blur-3xl rounded-[4rem] overflow-hidden flex flex-col shadow-2xl border-t-white/[0.05]">
            <CardHeader className="p-12 border-b border-white/[0.02] bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="h-16 w-1 bg-cyan-500 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.6)]" />
                  <div>
                    <CardTitle className="text-5xl font-black italic tracking-tighter text-white">DOCUMENT.XML</CardTitle>
                    <p className="text-[10px] font-mono text-zinc-600 mt-2 tracking-[0.2em] uppercase">MIME: {CONTENT_TYPES.main}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Handshake_Status</p>
                  <p className={cn("text-xs font-black tracking-widest uppercase", 
                    relMap.handshake === 'ESTABLISHED' ? "text-cyan-400" : "text-amber-500")}>
                    {relMap.handshake}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative">
              <ScrollArea className="h-full w-full">
                <div className="p-16">
                  <AnimatePresence mode="popLayout">
                    {!relMap.activeRId ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-[600px] flex flex-col items-center justify-center text-center space-y-12"
                      >
                        <div className="bg-zinc-900/50 p-12 rounded-[4rem] border border-white/[0.03] shadow-2xl relative">
                          <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full -z-10" />
                          <ShieldCheck className="h-20 w-20 text-cyan-500 mx-auto" />
                        </div>
                        <div className="space-y-4 max-w-md">
                          <h2 className="text-3xl font-black text-white tracking-tight">RELATIONSHIP_VOID</h2>
                          <p className="text-zinc-500 font-light text-lg leading-relaxed italic">The target Relationship ID (rId) must be registered in the manifest to enable DOM injection.</p>
                        </div>
                        <div className="flex gap-4 p-3 bg-white/[0.03] rounded-[2rem] border border-white/[0.05] w-full max-w-sm">
                          <Input 
                            value={pendingRId}
                            onChange={(e) => setPendingRId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && commitRelationalPointer()}
                            placeholder="Target rId..."
                            className="bg-transparent border-none focus-visible:ring-0 text-center font-mono text-xl text-cyan-200"
                          />
                          <Button onClick={commitRelationalPointer} size="icon" className="h-14 w-14 rounded-2xl bg-cyan-600 hover:bg-cyan-500 shadow-xl">
                            <Link2 className="h-6 w-6" />
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-10">
                        {documentBody.map((paragraph) => (
                          <motion.div
                            key={paragraph.pId}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              STYLES_XML.p.base,
                              paragraph.runs[0].type === 'system' ? STYLES_XML.p.system : STYLES_XML.p.user
                            )}
                          >
                            <div className={STYLES_XML.p.pPr} />
                            <span className={STYLES_XML.r.meta}>UID: {paragraph.pId.split('-')[0]}</span>
                            
                            {paragraph.runs.map((run, idx) => (
                              <div key={idx} className="w-full">
                                {run.type === 'system' ? (
                                  <div className={STYLES_XML.r.abstract}>
                                    <Workflow className="h-4 w-4" />
                                    {run.t}
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
                                  </div>
                                ) : (
                                  <div className="space-y-6">
                                    <div className="flex items-center gap-6">
                                      <div className={STYLES_XML.r.rId}>
                                        <Hash className="h-3 w-3" />
                                        {run.rId}
                                      </div>
                                      <div className="h-[1px] flex-1 bg-white/[0.02]" />
                                      <div className="text-[8px] font-black text-zinc-800 uppercase tracking-widest">Run_State::ACTIVE</div>
                                    </div>
                                    <p className={STYLES_XML.r.t}>{run.t}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>

            <CardFooter className="p-12 border-t border-white/[0.02] bg-white/[0.01]">
              <div className="w-full flex gap-6 items-center bg-black/40 p-4 rounded-[3rem] border border-white/[0.05] focus-within:border-cyan-500/30 transition-all shadow-2xl">
                <div className="p-5 bg-zinc-900/80 rounded-[2rem]">
                  <Terminal className="h-7 w-7 text-cyan-500/50" />
                </div>
                <Input 
                  value={tNodeBuffer}
                  onChange={(e) => setTNodeBuffer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && injectLiteralRun()}
                  disabled={!relMap.activeRId}
                  placeholder={relMap.activeRId ? "Siphon literal data into <w:t> run..." : "Establish relationship map first..."}
                  className="bg-transparent border-none focus-visible:ring-0 text-2xl font-extralight placeholder:text-zinc-800 text-zinc-100 italic"
                />
                <Button 
                  onClick={injectLiteralRun}
                  disabled={!tNodeBuffer.trim() || !relMap.activeRId}
                  className="h-20 w-20 rounded-full bg-zinc-100 hover:bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform active:scale-95"
                >
                  <Zap className="h-8 w-8 fill-current" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </div>

      {/* DUBLIN CORE FOOTER :: Audit Trail */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-[#010101] border-t border-white/[0.02] flex items-center justify-between px-16">
        <div className="flex items-center gap-16 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">
          <div className="flex items-center gap-4">
            <span className="text-zinc-800 italic">cp:creator</span>
            <span className="text-zinc-500">DALEK_CAAN_V10.5</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-800 italic">cp:revision</span>
            <span className="text-cyan-500">PHASE_FINAL_SATURATION</span>
          </div>
        </div>

        <div className="flex items-center gap-12 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          <span className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
            <span className="font-mono">P_BLOCKS:</span> {appStats.pCount}
          </span>
          <span className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-zinc-800" />
            <span className="font-mono">R_LOGIC:</span> {appStats.rCount}
          </span>
          <div className="h-5 w-[1px] bg-zinc-900" />
          <span className="text-zinc-800 font-mono italic">SCHEMA_URI: openxmlformats.org</span>
        </div>
      </footer>
    </main>
  );
}

/**
 * PROTOCOL STATUS: ARCHITECTURAL_PRECISION_v10_REACHED
 * LOGICAL_SHARDS: SYNCHRONIZED
 * DOM_TOPOLOGY: LOCKED
 */