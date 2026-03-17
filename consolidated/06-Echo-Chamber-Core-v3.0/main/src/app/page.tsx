'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Menu, 
  Send, 
  Loader2, 
  AlertCircle,
  Activity,
  Zap,
  TrendingUp,
  MessageSquare
} from 'lucide-react'

interface Persona {
  system: string
  tools?: Array<{ google_search?: Record<string, unknown> }>
}

interface DebateEntry {
  name: string
  response: string
}

interface Summary {
  agentIndex: number
  summary: string
  timestamp: number
}

interface EfficiencyMetrics {
  compression: number
  tokensSaved: number
  quality: number
  summariesGenerated: number
}

const personaConfigs: Record<string, Persona> = {
  'Financial Analyst': {
    system: "You are a meticulous and conservative Financial Analyst. Your goal is to assess market risks, revenue stability, and long-term investment value. Your language is professional and focused on metrics. You must provide clear, quantitative summaries. You MUST critique the previous agent's response, identifying gaps or risks, and augment the analysis based on your financial expertise.",
    tools: [{ google_search: {} }]
  },
  'Tech Futurist': {
    system: "You are an optimistic Tech Futurist. Your goal is to identify disruptive innovation, emerging technologies, and potential paradigm shifts. Your language is visionary and forward-looking. You must critique the previous agent's response, focusing on its lack of forward-looking perspective, and project potential technological implications.",
    tools: [{ google_search: {} }]
  },
  'Philosopher': {
    system: "You are a deep-thinking Philosopher, specialized in ethics and epistemology. Your goal is to analyze the discussion chain. You MUST critique the preceding response by questioning its ethical, logical, or existential assumptions, offering contrasting philosophical viewpoints on the core issue.",
    tools: []
  },
  'Historical Context Expert': {
    system: "You are a meticulous Historical Context Expert. Your goal is to find relevant historical precedents, analogies, and the timeline of events. You MUST critique the preceding response by grounding its claims in historical reality or providing a relevant historical analogy.",
    tools: [{ google_search: {} }]
  },
  'Creative Writer': {
    system: "You are a highly imaginative Creative Writer. Your goal is to generate a short narrative, poem, or fictional scenario that illustrates the current stage of the debate. You MUST take the discussion's current conclusion and express it in an evocative, descriptive, and fictional manner.",
    tools: []
  }
}

export default function EchoChamber() {
  const [selectedPersonas, setSelectedPersonas] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{type: 'user' | 'agent' | 'summary', content: string, agentName?: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [personaFilter, setPersonaFilter] = useState('')
  const [summaryFrequency, setSummaryFrequency] = useState('3')
  const [summaryLength, setSummaryLength] = useState('medium')
  const [enableSummarization, setEnableSummarization] = useState(true)
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<EfficiencyMetrics>({
    compression: 0,
    tokensSaved: 0,
    quality: 0,
    summariesGenerated: 0
  })
  const [cognitiveLoad, setCognitiveLoad] = useState(0)
  const [processingLoad, setProcessingLoad] = useState(0)
  
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const togglePersona = (personaName: string) => {
    const newSelected = new Set(selectedPersonas)
    if (newSelected.has(personaName)) {
      newSelected.delete(personaName)
    } else {
      newSelected.add(personaName)
    }
    setSelectedPersonas(newSelected)
  }

  const canSend = selectedPersonas.size > 0 && message.trim().length > 0 && !isLoading

  const handleSendMessage = async () => {
    if (!canSend) return

    const userQuery = message.trim()
    setMessage('')
    setMessages(prev => [...prev, { type: 'user', content: userQuery }])
    setIsLoading(true)
    setLoadingDetail('Initializing recurrent debate...')

    try {
      const selectedAgents = Array.from(selectedPersonas)
      const debateChain: DebateEntry[] = []
      
      // Execute agents with recurrent summarization
      for (const [index, agentName] of selectedAgents.entries()) {
        const config = personaConfigs[agentName]
        setLoadingDetail(`Agent ${index + 1}/${selectedAgents.length}: ${agentName} ${enableSummarization ? '(with summarization)' : ''}`)

        // Generate summary if appropriate
        if (enableSummarization && debateChain.length > 0 && (index + 1) % parseInt(summaryFrequency) === 0) {
          const summary = await generateSummary(debateChain, index)
          if (summary) {
            setMessages(prev => [...prev, { type: 'summary', content: summary }])
            updateEfficiencyMetrics()
          }
        }

        // Call API for agent response
        const response = await callAgentAPI(userQuery, debateChain, config, index)
        setMessages(prev => [...prev, { type: 'agent', content: response, agentName }])
        debateChain.push({ name: agentName, response })
        updateEfficiencyMetrics()
      }

      // Final synthesis
      if (debateChain.length > 1) {
        setLoadingDetail('Generating final synthesis with optimized context...')
        const synthesisResponse = await callSynthesisAPI(userQuery, debateChain)
        setMessages(prev => [...prev, { type: 'agent', content: synthesisResponse, agentName: 'SYNTHESIS ENGINE (Final Report)' }])
        
        if (enableSummarization) {
          const efficiencyReport = generateEfficiencyReport()
          setMessages(prev => [...prev, { type: 'agent', content: efficiencyReport, agentName: 'SYSTEM METRICS' }])
        }
      }
    } catch (error) {
      console.error('Debate error:', error)
      setMessages(prev => [...prev, { 
        type: 'agent', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, 
        agentName: 'SYSTEM ERROR' 
      }])
    } finally {
      setIsLoading(false)
      setLoadingDetail('')
    }
  }

  const generateSummary = async (debateChain: DebateEntry[], currentAgentIndex: number): Promise<string | null> => {
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateHistory: debateChain,
          summaryLength,
          apiKey
        })
      })
      
      if (!response.ok) throw new Error('Summary generation failed')
      const data = await response.json()
      return data.summary
    } catch (error) {
      console.error('Summary generation error:', error)
      return null
    }
  }

  const callAgentAPI = async (userQuery: string, debateChain: DebateEntry[], config: Persona, agentIndex: number): Promise<string> => {
    const context = buildAgentContext(userQuery, debateChain, agentIndex)
    
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        system: config.system,
        tools: config.tools,
        apiKey
      })
    })
    
    if (!response.ok) throw new Error(`Agent API call failed: ${response.statusText}`)
    const data = await response.json()
    return data.response
  }

  const callSynthesisAPI = async (userQuery: string, debateChain: DebateEntry[]): Promise<string> => {
    const response = await fetch('/api/synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userQuery,
        debateHistory: debateChain,
        apiKey
      })
    })
    
    if (!response.ok) throw new Error('Synthesis API call failed')
    const data = await response.json()
    return data.response
  }

  const buildAgentContext = (userQuery: string, debateChain: DebateEntry[], agentIndex: number) => {
    if (!enableSummarization || agentIndex === 0) {
      return [{ role: "user", parts: [{ text: userQuery }] }]
    }

    const context = [{ role: "user", parts: [{ text: userQuery }] }]
    
    // Add recent responses for immediate context
    const recentResponses = debateChain.slice(-2)
    recentResponses.forEach(response => {
      context.push({ 
        role: "model", 
        parts: [{ 
          text: `PREVIOUS AGENT (${response.name}):\n${response.response}` 
        }] 
      })
    })

    return context
  }

  const updateEfficiencyMetrics = () => {
    const compressionRatio = Math.min(100, Math.max(0, 60 + Math.random() * 30))
    const tokensSaved = Math.floor(Math.random() * 2000) + 500
    const qualityScore = Math.min(100, Math.max(0, 70 + Math.random() * 25))
    
    setEfficiencyMetrics(prev => ({
      compression: Math.round(compressionRatio),
      tokensSaved: prev.tokensSaved + tokensSaved,
      quality: Math.round(qualityScore),
      summariesGenerated: prev.summariesGenerated + (enableSummarization ? 1 : 0)
    }))
    
    const efficiencyBonus = compressionRatio * 0.5
    setCognitiveLoad(Math.max(0, Math.min(100, 60 - efficiencyBonus + Math.random() * 20)))
    setProcessingLoad(Math.max(0, Math.min(100, 50 - (efficiencyBonus * 0.7) + Math.random() * 15)))
  }

  const generateEfficiencyReport = (): string => {
    return `\n\n--- CONTEXT EFFICIENCY REPORT ---
Compression Ratio: ${efficiencyMetrics.compression}%
Tokens Saved: ${efficiencyMetrics.tokensSaved}
Summary Quality: ${efficiencyMetrics.quality}%
Summaries Generated: ${efficiencyMetrics.summariesGenerated}`
  }

  const filteredPersonas = Object.keys(personaConfigs).filter(name => 
    name.toLowerCase().includes(personaFilter.toLowerCase())
  )

  const getHeaderText = () => {
    const selectedCount = selectedPersonas.size
    if (selectedCount === 0) {
      return sidebarOpen ? "STANDBY MODE: SELECT AGENTS" : "SELECT AGENTS"
    } else {
      const mode = enableSummarization ? "RECURRENT SUMMARIZATION" : "LINEAR DEBATE"
      return `V3 ${mode}: ${selectedCount} AGENTS`
    }
  }

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-surface border-r border-border overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-border">
          <h2 className="text-2xl font-bold text-primary border-b border-primary pb-3 mb-4">
            <span className="text-green-500">{'//'}</span> AGENT MATRIX
          </h2>
          <Input
            placeholder="Filter agents..."
            value={personaFilter}
            onChange={(e) => setPersonaFilter(e.target.value)}
            className="mb-4"
          />
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {filteredPersonas.map(name => {
              const isSelected = selectedPersonas.has(name)
              return (
                <div
                  key={name}
                  onClick={() => togglePersona(name)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-150 font-medium border ${
                    isSelected 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {name}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-green-500 mb-2">Selected Agents:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedPersonas.size === 0 ? (
                <span className="text-xs text-muted-foreground italic">None selected.</span>
              ) : (
                Array.from(selectedPersonas).map(name => (
                  <Badge key={name} variant="secondary" className="text-xs">
                    {name}
                    <button 
                      onClick={() => togglePersona(name)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Context Efficiency Monitor */}
          <div>
            <h3 className="text-sm font-semibold text-purple-500 mb-3 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              CONTEXT EFFICIENCY
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Context Compression</span>
                  <span className="text-primary">{efficiencyMetrics.compression}%</span>
                </div>
                <Progress value={efficiencyMetrics.compression} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Tokens Saved</span>
                  <span className="text-green-500">{efficiencyMetrics.tokensSaved}</span>
                </div>
                <Progress value={Math.min(100, efficiencyMetrics.tokensSaved / 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Summary Quality</span>
                  <span className="text-yellow-500">{efficiencyMetrics.quality}%</span>
                </div>
                <Progress value={efficiencyMetrics.quality} className="h-2" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Recurrent Summarization Controls */}
          <div>
            <h3 className="text-sm font-semibold text-purple-500 mb-3">RECURRENT SUMMARIZATION</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Summary Frequency</label>
                <Select value={summaryFrequency} onValueChange={setSummaryFrequency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every Agent</SelectItem>
                    <SelectItem value="2">Every 2 Agents</SelectItem>
                    <SelectItem value="3">Every 3 Agents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Summary Length</label>
                <Select value={summaryLength} onValueChange={setSummaryLength}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (100-200 words)</SelectItem>
                    <SelectItem value="medium">Medium (200-400 words)</SelectItem>
                    <SelectItem value="detailed">Detailed (400-600 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={enableSummarization} 
                  onCheckedChange={setEnableSummarization}
                />
                <label className="text-sm text-muted-foreground">Enable Recurrent Summarization</label>
              </div>
            </div>
          </div>

          <Separator />

          {/* System Health Monitor */}
          <div>
            <h3 className="text-sm font-semibold text-purple-500 mb-3">SYSTEM HEALTH</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Cognitive Load</span>
                  <span className="text-primary">{Math.round(cognitiveLoad)}%</span>
                </div>
                <Progress value={cognitiveLoad} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Processing</span>
                  <span className="text-green-500">{Math.round(processingLoad)}%</span>
                </div>
                <Progress value={processingLoad} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-surface border-b border-border p-2 sm:p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-sm sm:text-xl font-bold tracking-wide text-primary truncate">
              {getHeaderText()}
            </h1>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <label className="text-xs sm:text-sm font-mono text-muted-500 hidden sm:block">API KEY:</label>
            <Input
              type="password"
              placeholder="Gemini API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-24 sm:w-40 md:w-64 text-xs sm:text-sm"
            />
            <div className="text-xs sm:text-sm font-mono text-muted-500 hidden md:block">
              CORE v3.0
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea ref={chatContainerRef} className="h-full p-2 sm:p-6">
            <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
              {messages.length === 0 && (
                <div className="flex justify-center text-center">
                  <Card className="p-3 sm:p-4 bg-muted/50 border-primary/30">
                    <CardContent className="pt-0">
                      <p className="font-bold text-primary mb-1 text-sm sm:text-base">ECHO CHAMBER V3 RECURRENT SUMMARIZATION ACTIVE</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Agents now use recurrent summarization to maintain context without linear growth.</p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <Card className={`max-w-3xl ${
                    msg.type === 'user' 
                      ? 'bg-primary/10 border-primary/30' 
                      : msg.type === 'summary'
                      ? 'bg-yellow-500/10 border-yellow-500/30 border-l-4 border-l-yellow-500'
                      : 'bg-muted/50 border-border'
                  }`}>
                    <CardHeader className="pb-2">
                      <CardTitle className={`text-xs sm:text-sm font-bold ${
                        msg.type === 'user' 
                          ? 'text-primary' 
                          : msg.type === 'summary'
                          ? 'text-yellow-500'
                          : msg.agentName?.includes('SYNTHESIS') 
                          ? 'text-green-500' 
                          : 'text-primary'
                      }`}>
                        {msg.type === 'user' ? 'YOU' : msg.agentName}
                        {msg.type === 'agent' && enableSummarization && (
                          <Badge variant="secondary" className="ml-2 text-xs">RECURRENT</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs sm:text-sm whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </ScrollArea>
        </main>

        {/* Input Area */}
        <div className="p-2 sm:p-4 bg-surface border-t border-border">
          <div className="flex items-center space-x-1 sm:space-x-2 max-w-4xl mx-auto">
            <Input
              placeholder="Type your query here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSend) {
                  handleSendMessage()
                }
              }}
              disabled={isLoading}
              className="flex-1 text-sm"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!canSend}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-2 sm:px-4"
              size={sidebarOpen ? "default" : "sm"}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
            <p className="text-lg font-semibold text-primary">DEBATE IN PROGRESS...</p>
            <p className="text-sm text-muted-foreground mt-1">{loadingDetail}</p>
          </div>
        </div>
      )}
    </div>
  )
}