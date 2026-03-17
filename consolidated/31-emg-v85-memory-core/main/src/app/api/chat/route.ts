import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Convert messages to ZAI format
    const zaiMessages = messages.map((msg: any) => ({
      role: msg.role === 'ai' ? 'assistant' : msg.role,
      content: msg.text || msg.content || ''
    }))

    // Add system prompt
    zaiMessages.unshift({
      role: 'assistant',
      content: 'You are EMG_CORE v8.5, an advanced AI assistant with memory capabilities. You are helpful, knowledgeable, and provide clear, concise responses.'
    })

    // Get completion from ZAI
    const completion = await zai.chat.completions.create({
      messages: zaiMessages,
      thinking: { type: 'disabled' }
    })

    const responseText = completion.choices[0]?.message?.content || 'No response generated.'

    return NextResponse.json({
      success: true,
      response: responseText
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
