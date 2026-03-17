import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { debateHistory, summaryLength, apiKey } = await request.json()

    if (!debateHistory || debateHistory.length < 2) {
      return NextResponse.json(
        { error: 'Insufficient debate history for summarization' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const lengthConstraints = {
      short: "100-200 words",
      medium: "200-400 words", 
      detailed: "400-600 words"
    }

    const summaryPrompt = `Please provide a comprehensive summary of the debate progression in ${lengthConstraints[summaryLength || 'medium']}.

DEBATE HISTORY:
${debateHistory.map((entry: any, index: number) => `
AGENT ${index + 1} (${entry.name}):
${entry.response}
`).join('\n')}

Create a structured summary that captures:
1. The main question/topic
2. Key perspectives and their evolution
3. Major arguments and counterarguments
4. Points of agreement and ongoing disagreement
5. Critical insights and novel ideas

Focus on the progression of thought rather than reproducing every detail.`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Debate Summarization Engine. Your task is to create a concise, structured summary of the debate progression so far. Focus on:
- Key arguments and counterarguments
- Evolution of the discussion
- Major points of consensus and disagreement
- Critical insights from each perspective
Maintain objectivity and preserve the core reasoning from each agent.`
        },
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })

    const summary = completion.choices[0]?.message?.content || 'Summary generation failed'

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Summary generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}