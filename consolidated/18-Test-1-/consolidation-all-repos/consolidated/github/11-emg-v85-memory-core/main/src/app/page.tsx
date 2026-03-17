'use client'

import { useState, useEffect, useRef } from 'react'
import { BackupManager } from '@/components/backup-manager'
import { useToast } from '@/hooks/use-toast'

interface Message {
  role: 'user' | 'ai' | 'system'
  text: string
  timestamp: string
}

type ConnectionStatus = 'offline' | 'online' | 'processing'

export default function EMGCorePage() {
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('offline')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      text: 'Identity: **EMG Core v9.6 Core Vessel (Anomaly Enhanced)**.\n\n- **Semantic Math**: Online.\n- **Reflective Loop**: Active.\n- **Memory Fragments**: Enabled (Context retention).\n- **Binary Load**: Ready (Inject .bin history).\n- **Archive Analysis**: Ready (Extract .zip).\n- **Bitstream Buffer**: Enabled (Binary file ingestion).\n- **Anomaly Detection**: Active (Entity, equation, code scanning).\n- **Audit System**: Enabled (Shadow detection & downloadable reports).',
      timestamp: new Date().toISOString()
    }
  ])
  const [logs, setLogs] = useState<Array<{ message: string; type: string; time: string }>>([])
  const [overclocked, setOverclocked] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Initialize
  useEffect(() => {
    const savedKey = localStorage.getItem('emg_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  // Log system event
  const log = (message: string, type: string = 'info') => {
    setLogs((prev) => {
      const newLog = { message, type, time: new Date().toLocaleTimeString() }
      return [newLog, ...prev].slice(0, 50)
    })
    setLogs(prev => [newLog, ...prev].slice(0, 50))
  }

  // Connect to API
  const connect = async (key: string, silent = false) => {
    if (!key) return

    setApiKey(key)
    localStorage.setItem('emg_key', key)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: 'ping' }]
        })
      })

      const data = await response.json()

      if (data.success) {
        setStatus('online')
        log('Connection Established.', 'ok')
        toast({
          title: 'Connected',
          description: 'Neural bridge synchronized.',
        })
      }
    } catch (e) {
      setStatus('offline')
      log('Connection Failed: ' + e.message, 'err')
      toast({
        title: 'Connection Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive'
      })
    }
  }

  // Handle chat submission
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    const input = inputRef.current
    if (!input || !input.value.trim()) return

    const userText = input.value.trim()

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userText, timestamp: new Date().toISOString() }
    ])
    input.value = ''

    setStatus('processing')

    // Query AI
    if (!apiKey) {
      setStatus('offline')
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Auth Required. Set API key first.', timestamp: new Date().toISOString() }
      ])
      setStatus('offline')
      return
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', text: 'You are EMG_CORE v9.6, an advanced AI assistant with memory capabilities.' },
            ...messages.slice(-5).map(m => ({
              role: m.role === 'ai' ? 'assistant' : m.role,
              content: m.text || ''
            })),
            { role: 'user', text: userText }
          ]
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', text: data.response, timestamp: new Date().toISOString() }
        ])
        setStatus('online')
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error: any) {
      log('Bridge Error: ' + error.message, 'err')
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Critical Bridge Failure.', timestamp: new Date().toISOString() }
      ])
      setStatus('offline')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* API Key Section */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Neural Bridge</h2>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="ENTER_API_KEY"
                className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                onClick={() => connect(apiKey)}
                disabled={status === 'processing'}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50"
              >
                SYNC BRIDGE
              </button>
            </div>

            {/* Backup Manager */}
            <BackupManager />
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 bg-slate-900/30 border border-slate-700 rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">EMG_CORE</h1>
                <span className="text-sm text-indigo-400 ml-2">v9.6 Core Vessel</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-emerald-500' : status === 'processing' ? 'bg-yellow-500' : 'bg-rose-500'}`} />
                <span className="text-sm text-gray-400">
                  {status === 'online' ? 'ONLINE' : status === 'processing' ? 'PROCESSING' : 'OFFLINE'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/20 border-indigo-500/30 text-white ml-auto'
                      : 'bg-slate-800/50 border-slate-700 text-indigo-300'
                  }`}
                >
                  {msg.role === 'ai' && (
                    <div className="text-xs font-bold text-indigo-400 uppercase mb-2">
                      EMG_CORE
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/30">
              <form onSubmit={handleChat} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message..."
                  disabled={status === 'processing'}
                  className="flex-1 bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-gray-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === 'processing' || !inputRef.current?.value.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {status === 'processing' ? (
                    <>
                      <div className="animate-spin rounded-full border-2 border-white/30 h-5 w-5 border-t-transparent" />
                      <span>PROCESSING</span>
                    </>
                  ) : (
                    <>
                      <span>SEND</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="fixed bottom-4 right-4 w-80 max-h-48 bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400">System Logs</h3>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-gray-500 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="overflow-y-auto p-3 space-y-2 max-h-40">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`text-xs font-mono border-l-2 pl-2 ${
                  log.type === 'ok'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : log.type === 'err'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                    : 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                }`}
              >
                <span className="opacity-40">[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
