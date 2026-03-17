import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// LLM API using z-ai-web-dev-sdk
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, systemPrompt } = body
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }
    
    // Truncate very long prompts
    const maxPromptLength = 8000
    const truncatedPrompt = prompt.length > maxPromptLength 
      ? prompt.slice(0, maxPromptLength) + '\n... [truncated]'
      : prompt
    
    // Create ZAI instance
    const zai = await ZAI.create()
    
    const messages = []
    
    if (systemPrompt) {
      messages.push({
        role: 'assistant' as const,
        content: systemPrompt
      })
    }
    
    messages.push({
      role: 'user' as const,
      content: truncatedPrompt
    })
    
    console.log('Sending LLM request...')
    
    const completion = await zai.chat.completions.create({
      messages,
      stream: false,
      thinking: { type: 'disabled' }
    })
    
    const response = completion.choices?.[0]?.message?.content || ''
    
    if (!response) {
      console.log('Empty response from LLM')
      return NextResponse.json({ 
        success: false, 
        error: 'Empty response from LLM' 
      }, { status: 500 })
    }
    
    console.log('LLM response received:', response.length, 'chars')
    
    return NextResponse.json({ 
      success: true, 
      response,
      tokens: completion.usage?.total_tokens || 1
    })
  } catch (error) {
    console.error('LLM API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}
