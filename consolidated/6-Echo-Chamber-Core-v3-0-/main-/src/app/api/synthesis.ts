import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { userQuery, debateHistory, apiKey } = await request.json()

    if (!userQuery || !debateHistory) {
      return NextResponse.json(
        { error: 'Missing required parameters: userQuery and debateHistory' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const synthesisPrompt = `You are the Final Synthesis Engine. Analyze the debate and deliver a comprehensive, structured synthesis report.

ORIGINAL QUERY: ${userQuery}

DEBATE HISTORY:
${debateHistory.map((entry: any, index: number) => `
AGENT ${index + 1} (${entry.name}):
${entry.response}
`).join('\n')}

Key considerations:
- Identify the evolution of arguments
- Highlight points of consensus and disagreement
- Note any novel insights or paradigm shifts
- Provide balanced conclusions

Deliver a final integrated report.`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the Final Synthesis Engine. Analyze the debate and deliver a comprehensive, structured synthesis report.

Key considerations:
- Identify the evolution of arguments
- Highlight points of consensus and disagreement
- Note any novel insights or paradigm shifts
- Provide balanced conclusions

Deliver a final integrated report.`
        },
        {
          role: 'user',
          content: synthesisPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.5
    })

    const response = completion.choices[0]?.message?.content || 'Synthesis generation failed'

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Synthesis generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}