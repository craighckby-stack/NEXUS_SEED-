import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { context, system, tools, apiKey } = await request.json()

    if (!context || !system) {
      return NextResponse.json(
        { error: 'Missing required parameters: context and system' },
        { status: 400 }
      )
    }

    // Use z-ai-web-dev-sdk instead of direct Gemini API
    const zai = await ZAI.create()

    // Build messages for z-ai-web-dev-sdk
    const messages = [
      {
        role: 'system' as const,
        content: system
      },
      ...context.map((item: any) => ({
        role: item.role === 'model' ? 'assistant' as const : 'user' as const,
        content: item.parts[0]?.text || ''
      }))
    ]

    const completion = await zai.chat.completions.create({
      messages,
      max_tokens: 2000,
      temperature: 0.7
    })

    const response = completion.choices[0]?.message?.content || 'No response generated'

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Agent API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}