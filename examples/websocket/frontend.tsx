'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Terminal, ShieldCheck, Activity, Wifi, WifiOff, FileJson, Layers, Cpu } from 'lucide-react';

/**
 * [Content_Types].xml :: MIME TYPE REGISTRATION
 * Orchestrates the mapping of raw data streams to recognized Nexus schemas.
 */
const SCHEMA_MANIFEST = {
  PART_USER: 'application/vnd.nexus.user+xml',
  PART_DATA: 'application/vnd.nexus.run+xml',
  PART_REL: 'application/vnd.openxmlformats-package.relationships+xml',
  PART_CORE: 'application/vnd.openxmlformats-package.core-properties+xml'
} as const;

/**
 * word/styles.xml :: TIERED INHERITANCE ARCHITECTURE
 * Encapsulates CSS-like inheritance logic into reusable Property-State Run tokens.
 */
const STYLES = {
  /** <w:docDefaults> Global Body Context */
  body: "container mx-auto p-4 max-w-4xl font-sans antialiased min-h-screen flex items-center justify-center bg-[#f8fafc]",
  
  /** <w:pPr> Paragraph Layout Properties */
  paragraph: {
    base: "group relative flex flex-col space-y-1.5 p-4 rounded-xl transition-all border-l-4 mb-3",
    user: "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-900",
    system: "bg-slate-100/50 border-blue-400/50 justify-center items-center py-4 border-l-0 border-y italic",
  },

  /** <w:rPr> Run Property States ( kontent runs ) */
  run: {
    header: "flex items-center gap-2 mb-1",
    id_tag: "text-[10px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded tracking-tighter uppercase",
    username: "text-xs font-bold text-slate-600 tracking-tight",
    text: "text-sm text-slate-800 leading-relaxed selection:bg-slate-900 selection:text-white",
    timestamp: "text-[9px] font-mono text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300",
    sys_msg: "text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2",
  },

  /** Direct Local Overrides */
  override: {
    active: "bg-emerald-500 text-white border-none shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse",
    terminated: "bg-rose-500 text-white border-none shadow-[0_0_15px_rgba(244,63,94,0.3)]"
  }
};

type UserPart = { id: string; username: string };
type DocumentRun = {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  type: 'user' | 'system';
};

/**
 * word/document.xml :: MODULAR DOM REPLICATOR
 * Root execution context for siphoning logic into a structured OOXML-hybrid container.
 */
export default function NexusPackageReplicator() {
  const [archive, setArchive] = useState<{
    dom: DocumentRun[];
    abstractNum: UserPart[];
    rels: { rId: string; status: 'STANDBY' | 'SYNCHRONIZED' | 'TERMINATED' };
  }>({
    dom: [],
    abstractNum: [],
    rels: { rId: '', status: 'STANDBY' },
  });

  const [inputBuffer, setInputBuffer] = useState({ literal: '', targetId: '' });
  const [ioStream, setIoStream] = useState<Socket | null>(null);

  /**
   * word/_rels/document.xml.rels :: RELATIONSHIP HANDSHAKE
   * Pointer-based dependency injection. Reconciles rId values to maintain DOM integrity.
   */
  useEffect(() => {
    const handshake_rId = io('/?NexusLogicPort=3003', {
      transports: ['websocket'],
      autoConnect: true,
    });

    setIoStream(handshake_rId);

    handshake_rId.on('connect', () => 
      setArchive(prev => ({ ...prev, rels: { ...prev.rels, status: 'SYNCHRONIZED' } })));
    
    handshake_rId.on('disconnect', () => 
      setArchive(prev => ({ ...prev, rels: { ...prev.rels, status: 'TERMINATED' } })));

    handshake_rId.on('message', (run: DocumentRun) => 
      setArchive(prev => ({ ...prev, dom: [...prev.dom, run] })));

    handshake_rId.on('user-joined', (payload: { user: UserPart; message: DocumentRun }) => {
      setArchive(prev => ({
        ...prev,
        dom: [...prev.dom, payload.message],
        abstractNum: prev.abstractNum.some(u => u.id === payload.user.id) 
          ? prev.abstractNum 
          : [...prev.abstractNum, payload.user]
      }));
    });

    return () => { handshake_rId.disconnect(); };
  }, []);

  /** Resource Siphoning Mechanics :: Abstract Instance Injection */
  const commitRelationalHandshake = useCallback(() => {
    if (ioStream && inputBuffer.targetId.trim() && archive.rels.status === 'SYNCHRONIZED') {
      ioStream.emit('join', { username: inputBuffer.targetId.trim() });
      setArchive(prev => ({ ...prev, rels: { ...prev.rels, rId: inputBuffer.targetId.trim() } }));
    }
  }, [ioStream, inputBuffer.targetId, archive.rels.status]);

  /** Paragraph Logic :: Atomic Unit Commitment */
  const siphonLiteralRun = useCallback(() => {
    if (ioStream && inputBuffer.literal.trim() && archive.rels.rId) {
      ioStream.emit('message', {
        content: inputBuffer.literal.trim(),
        username: archive.rels.rId
      });
      setInputBuffer(prev => ({ ...prev, literal: '' }));
    }
  }, [ioStream, inputBuffer, archive.rels.rId]);

  /** docProps/app.xml :: EXTENDED PROPERTY STATISTICS */
  const packageStats = useMemo(() => ({
    wordCount: archive.dom.reduce((acc, curr) => acc + curr.content.split(' ').length, 0),
    instanceCount: archive.abstractNum.length,
    runCount: archive.dom.length,
    checksum: "0xFD4A2C"
  }), [archive.dom, archive.abstractNum]);

  return (
    <main className={STYLES.body}>
      <Card className="w-full border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Layers className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
                  NEXUS_REPLICATOR
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">v3.1</span>
                </CardTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">Siphoning Round 3/5 :: OOXML_DNA</p>
              </div>
            </div>
            <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest ${archive.rels.status === 'SYNCHRONIZED' ? STYLES.override.active : STYLES.override.terminated}`}>
              {archive.rels.status === 'SYNCHRONIZED' ? <Activity className="mr-2 h-3 w-3" /> : <WifiOff className="mr-2 h-3 w-3" />}
              {archive.rels.status}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
             <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase">Abstract_Defs</p>
                <p className="text-lg font-mono font-bold text-white">{packageStats.instanceCount.toString().padStart(2, '0')}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase">Numbered_Runs</p>
                <p className="text-lg font-mono font-bold text-white">{packageStats.runCount.toString().padStart(2, '0')}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase">Checksum_Part</p>
                <p className="text-lg font-mono font-bold text-white truncate">{packageStats.checksum}</p>
             </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 bg-[#fcfdfe]">
          {!archive.rels.rId ? (
            <div className="max-w-md mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-700">
              <div className="text-center space-y-2">
                <div className="inline-flex p-4 rounded-full bg-slate-100 mb-4 text-slate-900">
                   <ShieldCheck className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Relational Handshake Required</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Establish a Relationship ID (rId) to register your logical fragment within the global package manifest.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target_Namespace_Identity</label>
                    <span className="text-[9px] font-mono text-slate-300">SCHEMA_v3.1</span>
                  </div>
                  <Input
                    value={inputBuffer.targetId}
                    onChange={(e) => setInputBuffer(prev => ({ ...prev, targetId: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && commitRelationalHandshake()}
                    placeholder="e.g. RID_ALPHA_TRANSFORM"
                    className="h-16 bg-slate-50 border-slate-200 rounded-2xl focus:ring-slate-900 text-lg font-bold transition-all px-6"
                  />
                </div>
                <Button
                  onClick={commitRelationalHandshake}
                  disabled={archive.rels.status !== 'SYNCHRONIZED' || !inputBuffer.targetId.trim()}
                  className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-slate-200"
                >
                  Register Part Identity
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <ScrollArea className="h-[450px] w-full rounded-[2rem] border-2 border-slate-50 bg-white/50 p-6">
                <div className="space-y-2">
                  {archive.dom.length === 0 ? (
                    <div className="h-[400px] flex flex-col items-center justify-center space-y-4 opacity-10">
                      <Cpu className="h-16 w-16 animate-pulse" />
                      <p className="text-sm font-black uppercase tracking-[0.5em]">Awaiting Data Injection</p>
                    </div>
                  ) : (
                    archive.dom.map((run) => (
                      <div 
                        key={run.id} 
                        className={`${STYLES.paragraph.base} ${run.type === 'system' ? STYLES.paragraph.system : STYLES.paragraph.user}`}
                      >
                        {run.type === 'system' ? (
                          <span className={STYLES.run.sys_msg}>
                            <FileJson className="h-3 w-3" />
                            {run.content}
                          </span>
                        ) : (
                          <>
                            <div className={STYLES.run.header}>
                              <span className={STYLES.run.id_tag}>rId</span>
                              <span className={STYLES.run.username}>{run.username}</span>
                              <time className={STYLES.run.timestamp}>
                                {new Date(run.timestamp).toLocaleTimeString([], { hour12: false })}
                              </time>
                            </div>
                            <p className={STYLES.run.text}>{run.content}</p>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-4 p-3 bg-slate-900 rounded-[1.5rem] shadow-2xl shadow-slate-200">
                <Input
                  value={inputBuffer.literal}
                  onChange={(e) => setInputBuffer(prev => ({ ...prev, literal: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && siphonLiteralRun()}
                  placeholder="Insert literal run data..."
                  className="flex-1 h-14 bg-transparent border-none text-white focus-visible:ring-0 px-6 placeholder:text-slate-500 font-bold"
                />
                <Button
                  onClick={siphonLiteralRun}
                  disabled={archive.rels.status !== 'SYNCHRONIZED' || !inputBuffer.literal.trim()}
                  className="h-14 w-14 rounded-2xl bg-white text-slate-900 hover:bg-blue-400 hover:text-white transition-all group"
                >
                  <Terminal className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-between px-10 py-6 items-center">
            <div className="flex gap-6">
                <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Part_Manifest</p>
                    <p className="text-[10px] font-bold text-slate-600">{SCHEMA_MANIFEST.PART_DATA}</p>
                </div>
                <div className="space-y-1 border-l pl-6 border-slate-200">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Package_Auth</p>
                    <p className="text-[10px] font-bold text-slate-600">{archive.rels.rId || 'UNREGISTERED'}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-900 italic">DOM_Archive_v10.0.1</p>
                <p className="text-[8px] font-bold text-slate-400">Precision_Audit_Trail: SUCCESS</p>
            </div>
        </CardFooter>
      </Card>
      
      <div className="fixed bottom-8 text-center w-full pointer-events-none opacity-20">
         <p className="text-[10px] font-black text-slate-900 uppercase tracking-[1em]">Architecture_Precision_Nexus_Core</p>
      </div>
    </main>
  );
}