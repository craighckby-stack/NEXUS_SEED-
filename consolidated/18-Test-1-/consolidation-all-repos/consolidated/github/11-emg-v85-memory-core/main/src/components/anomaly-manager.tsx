'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertTriangle, Download, Shield, Activity, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  detectAnomalies,
  generateAnomalyStats,
  formatBytes,
  validateBitstream,
  sanitizeBitstream,
  type Anomaly,
} from '@/lib/bitstream-utils'

interface AnomalyManagerProps {
  buffer: string
  onAnomaliesDetected: (anomalies: Anomaly[]) => void
}

export function AnomalyManager({ buffer, onAnomaliesDetected }: AnomalyManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [customNotes, setCustomNotes] = useState('')
  const [selectedAnomalies, setSelectedAnomalies] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Auto-scan when buffer changes
  useEffect(() => {
    if (buffer.length > 100) {
      scanForAnomalies()
    }
  }, [buffer])

  const scanForAnomalies = async () => {
    if (isScanning) return
    setIsScanning(true)

    try {
      const detected = detectAnomalies(buffer)
      setAnomalies(detected)
      
      if (detected.length > 0) {
        onAnomaliesDetected(detected)
        toast({
          title: 'Anomalies Detected',
          description: `Found ${detected.length} anomalies in buffer`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Anomaly scan error:', error)
      toast({
        title: 'Scan Failed',
        description: 'Failed to scan for anomalies',
        variant: 'destructive'
      })
    } finally {
      setIsScanning(false)
    }
  }

  const generateAuditReport = async () => {
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anomalies,
          model: 'gemini-2.0-flash-preview-09-2025',
          bufferSize: buffer.length,
          systemStatus: {
            bridgeStatus: 'active',
            bufferLength: buffer.length,
            timestamp: new Date().toISOString()
          },
          customNotes: customNotes.trim() || undefined
        })
      })

      const data = await response.json()

      if (data.success && data.content) {
        // Download the report
        const blob = new Blob([data.content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: 'Audit Report Generated',
          description: `Report downloaded as ${data.filename}`
        })
      }
    } catch (error) {
      console.error('Audit generation error:', error)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate audit report',
        variant: 'destructive'
      })
    }
  }

  const clearAnomalies = () => {
    setAnomalies([])
    setSelectedAnomalies(new Set())
    setCustomNotes('')
  }

  const deleteAnomaly = (index: number) => {
    setAnomalies(prev => prev.filter((_, i) => i !== index))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const stats = generateAnomalyStats(anomalies)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/40"
        >
          <Activity className="w-4 h-4 mr-2" />
          Anomalies
          {anomalies.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {anomalies.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[85vh] bg-slate-950/95 border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Anomaly Detection & Audit System
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Detect undefined entities, equations, and code fragments in your neural buffer
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Stats Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="text-xs text-slate-400 mb-1">TOTAL ANOMALIES</div>
              <div className="text-2xl font-bold text-white">{anomalies.length}</div>
            </Card>
            
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="text-xs text-slate-400 mb-1">BUFFER SIZE</div>
              <div className="text-lg font-bold text-white">{formatBytes(buffer.length)}</div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="text-xs text-slate-400 mb-1">HIGH SEVERITY</div>
              <div className="text-2xl font-bold text-red-400">
                {stats.bySeverity.high || 0}
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="text-xs text-slate-400 mb-1">SCAN STATUS</div>
              <div className={`text-sm font-bold ${isScanning ? 'text-yellow-400 animate-pulse' : 'text-emerald-400'}`}>
                {isScanning ? 'SCANNING...' : 'READY'}
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={scanForAnomalies}
              disabled={isScanning || buffer.length === 0}
              className="flex-1 bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/40"
            >
              <Search className="w-4 h-4 mr-2" />
              Scan Buffer
            </Button>
            
            <Button
              onClick={generateAuditReport}
              disabled={anomalies.length === 0}
              className="flex-1 bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/40"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>

            <Button
              onClick={clearAnomalies}
              disabled={anomalies.length === 0}
              variant="outline"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Custom Notes */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              CUSTOM NOTES (Optional):
            </label>
            <Input
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Add context or observations about detected anomalies..."
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600"
            />
          </div>

          {/* Anomaly List */}
          <Card className="flex-1 bg-slate-900/30 border-slate-700 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              <AnimatePresence mode="popLayout">
                {anomalies.map((anomaly, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-4 rounded-lg border mb-3 transition-all ${getSeverityColor(anomaly.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px]">
                            {anomaly.type}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            Severity: {anomaly.severity.toUpperCase()}
                          </Badge>
                          {anomaly.line && (
                            <Badge variant="outline" className="text-[10px] text-slate-400">
                              Line {anomaly.line}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-slate-300 mb-1">
                          <span className="text-slate-100 font-mono">"</span>
                          {anomaly.item}
                          <span className="text-slate-100 font-mono">"</span>
                        </div>
                        
                        <div className="text-xs text-slate-400">
                          {anomaly.reason}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAnomaly(index)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {anomalies.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <div className="text-sm">No anomalies detected</div>
                    <div className="text-xs mt-1">
                      Buffer is clean or click "Scan Buffer" to analyze
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </Card>
        </div>

        <DialogFooter className="bg-slate-900/30 border-t border-slate-700">
          <div className="text-xs text-slate-400">
            EMG v9.6 Anomaly Detection System - Neural Bridge Integration
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
