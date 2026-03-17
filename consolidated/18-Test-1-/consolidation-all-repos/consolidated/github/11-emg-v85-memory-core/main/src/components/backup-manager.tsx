'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Download, Trash2, RefreshCw, Clock, Database, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import {
  BackupMetadata,
  BackupData,
  conversationToBinary,
  binaryToBase64,
  formatFileSize,
  formatTimestamp,
} from '@/lib/backup-utils'

interface BackupManagerProps {
  conversationHistory: any[]
  onRestore: (messages: any[]) => void
  autoSaveEnabled: boolean
  onAutoSaveToggle: (enabled: boolean) => void
  autoSaveInterval: number
  onAutoSaveIntervalChange: (interval: number) => void
}

export function BackupManager({
  conversationHistory,
  onRestore,
  autoSaveEnabled,
  onAutoSaveToggle,
  autoSaveInterval,
  onAutoSaveIntervalChange,
}: BackupManagerProps) {
  const [backups, setBackups] = useState<BackupMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<BackupData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [customFileName, setCustomFileName] = useState('')
  const [description, setDescription] = useState('')
  const { toast } = useToast()

  // Fetch backups
  const fetchBackups = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/backups')
      const data = await response.json()
      if (data.success) {
        setBackups(data.backups)
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch backups',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Load backups on mount
  useEffect(() => {
    fetchBackups()
  }, [fetchBackups])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || autoSaveInterval <= 0) return

    const interval = setInterval(async () => {
      if (conversationHistory.length > 0) {
        await saveBackup(`AUTO_${Date.now()}.bin`, 'Auto-saved backup')
      }
    }, autoSaveInterval * 60 * 1000) // Convert minutes to milliseconds

    return () => clearInterval(interval)
  }, [autoSaveEnabled, autoSaveInterval, conversationHistory])

  // Save backup
  const saveBackup = async (fileName?: string, desc?: string) => {
    try {
      setIsSaving(true)

      const binaryString = conversationToBinary(conversationHistory)
      const base64Data = binaryToBase64(binaryString)

      const response = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binaryData: base64Data,
          fileName: fileName || customFileName || `EMG_BACKUP_${Date.now()}.bin`,
          messageCount: conversationHistory.length,
          version: '8.5',
          description: desc || description || 'Manual backup'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Backup Saved',
          description: `Backup saved with ${conversationHistory.length} messages`
        })
        setCustomFileName('')
        setDescription('')
        fetchBackups()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error saving backup:', error)
      toast({
        title: 'Error',
        description: 'Failed to save backup',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Restore backup
  const restoreBackup = async (id: string) => {
    try {
      const response = await fetch(`/api/backups?id=${id}`)
      const data = await response.json()

      if (data.success && data.backup) {
        onRestore(data.backup.binaryData)
        toast({
          title: 'Backup Restored',
          description: `Restored ${data.backup.messageCount} messages from backup`
        })
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast({
        title: 'Error',
        description: 'Failed to restore backup',
        variant: 'destructive'
      })
    }
  }

  // Delete backup
  const deleteBackup = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/backups?id=${deleteId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Backup Deleted',
          description: 'Backup has been deleted'
        })
        fetchBackups()
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete backup',
        variant: 'destructive'
      })
    } finally {
      setDeleteId(null)
    }
  }

  // Preview backup
  const previewBackup = async (id: string) => {
    try {
      const response = await fetch(`/api/backups?id=${id}`)
      const data = await response.json()

      if (data.success && data.backup) {
        setPreviewData(data.backup)
        setPreviewId(id)
      }
    } catch (error) {
      console.error('Error previewing backup:', error)
      toast({
        title: 'Error',
        description: 'Failed to preview backup',
        variant: 'destructive'
      })
    }
  }

  // Download backup
  const downloadBackup = async (id: string, fileName: string) => {
    try {
      window.open(`/api/backups/${id}/download`, '_blank')
      toast({
        title: 'Download Started',
        description: `Downloading ${fileName}`
      })
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast({
        title: 'Error',
        description: 'Failed to download backup',
        variant: 'destructive'
      })
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/40"
          >
            <Database className="w-4 h-4 mr-2" />
            Backups
            <Badge variant="secondary" className="ml-2">
              {backups.length}
            </Badge>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-950/95 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              Memory Backup System
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Manage your conversation backups and restore them anytime
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Auto-save Settings */}
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">Auto-Save</div>
                    <div className="text-xs text-slate-400">
                      {autoSaveEnabled ? `Every ${autoSaveInterval} min` : 'Disabled'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={autoSaveInterval}
                    onChange={(e) => onAutoSaveIntervalChange(Number(e.target.value))}
                    disabled={!autoSaveEnabled}
                    className="w-20 h-9 text-center"
                    placeholder="min"
                  />
                  <Button
                    variant={autoSaveEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onAutoSaveToggle(!autoSaveEnabled)}
                    className={autoSaveEnabled ? 'bg-emerald-600' : ''}
                  >
                    {autoSaveEnabled ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Manual Backup */}
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex gap-2">
                <Input
                  placeholder="Custom filename (optional)"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  className="flex-1 bg-slate-950 border-slate-700 text-white"
                />
                <Input
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 bg-slate-950 border-slate-700 text-white"
                />
                <Button
                  onClick={() => saveBackup()}
                  disabled={isSaving || !customFileName}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </Button>
              </div>
            </Card>

            {/* Backup List */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                Backup History ({backups.length})
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBackups}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {backups.map((backup) => (
                    <motion.div
                      key={backup.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-sm font-semibold text-white truncate">
                              {backup.fileName}
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              v{backup.version}
                            </Badge>
                          </div>
                          {backup.description && (
                            <div className="text-xs text-slate-400 mb-2 truncate">
                              {backup.description}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Save className="w-3 h-3" />
                              {backup.messageCount} messages
                            </span>
                            <span className="flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              {formatFileSize(backup.fileSize)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(backup.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => previewBackup(backup.id)}
                              >
                                <FolderOpen className="w-4 h-4 text-slate-400" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Preview</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadBackup(backup.id, backup.fileName)}
                              >
                                <Download className="w-4 h-4 text-slate-400" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => restoreBackup(backup.id)}
                              >
                                <RefreshCw className="w-4 h-4 text-emerald-400" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Restore</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(backup.id)}
                              >
                                <Trash2 className="w-4 h-4 text-rose-400" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {backups.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <Database className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <div className="text-sm">No backups yet</div>
                      <div className="text-xs mt-1">Create your first backup to save your conversation history</div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-950 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Backup?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. Are you sure you want to delete this backup?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-400">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBackup}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
