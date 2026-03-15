import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Load Z.AI config
async function loadConfig() {
  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    path.join(process.cwd(), '../.z-ai-config'),
    '/etc/.z-ai-config'
  ]
  
  for (const filePath of configPaths) {
    try {
      const configStr = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(configStr)
    } catch { }
  }
  throw new Error('No .z-ai-config found')
}

// LLM API with direct fetch (bypassing SDK issue)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, systemPrompt, messages } = body
    
    // Load config
    const config = await loadConfig()
    
    // Build messages array
    const chatMessages = messages || []
    
    if (systemPrompt) {
      chatMessages.unshift({
        role: 'assistant',
        content: systemPrompt
      })
    }
    
    if (prompt) {
      chatMessages.push({
        role: 'user',
        content: prompt.length > 8000 ? prompt.slice(0, 8000) + '\n... [truncated]' : prompt
      })
    }
    
    if (chatMessages.length === 0) {
      return NextResponse.json({ error: 'Prompt or messages required' }, { status: 400 })
    }
    
    // Build headers - include token if available
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'X-Z-AI-From': 'Z'
    }
    
    if (config.chatId) headers['X-Chat-Id'] = config.chatId
    if (config.userId) headers['X-User-Id'] = config.userId
    if (config.token) headers['X-Token'] = config.token
    
    const url = `${config.baseUrl}/chat/completions`
    
    console.log('Sending LLM request to:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: chatMessages,
        thinking: { type: 'disabled' }
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('LLM API Error:', response.status, errorText)
      return NextResponse.json({ 
        success: false, 
        error: `API error: ${response.status}` 
      }, { status: 500 })
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    console.log('LLM response received:', content.length, 'chars')
    
    return NextResponse.json({ 
      success: true, 
      response: content,
      tokens: data.usage?.total_tokens || 1
    })
    
  } catch (error) {
    console.error('LLM API Error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
