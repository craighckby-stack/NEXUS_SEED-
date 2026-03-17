import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface Anomaly {
  type: 'WORD' | 'EQUATION' | 'CODE' | 'ENTITY' | 'UNKNOWN'
  item: string
  reason: string
  position?: number
  severity: 'low' | 'medium' | 'high'
}

export async function POST(request: NextRequest) {
  try {
    const { buffer, model = 'gemini-2.0-flash-preview-09-2025' } = await request.json()

    if (!buffer) {
      return NextResponse.json(
        { error: 'Buffer data is required' },
        { status: 400 }
      )
    }

    // Initialize ZAI
    const zai = await ZAI.create()

    // Prepare data slice for context (limit to prevent token overflow)
    const dataSlice = buffer.length > 60000 ? buffer.slice(-60000) : buffer

    const payload = {
      contents: [{
        parts: [{
          text: `Technical Audit: Extract all undefined/anomalous entities.

Look for:
1. Undefined Words (Jargon without context)
2. Undefined Equations (Variables like 'Delta-str', 'unknown-constant')
3. Undefined Code (Anomalous logic fragments)
4. Undefined Entities (Names, concepts not defined)

Return ONLY a JSON array: [{"type": "WORD|EQUATION|CODE", "item": "text", "reason": "why"}]

DATA:
${dataSlice}`
        }]
      }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    }

    // Call AI for anomaly detection
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=process.env.GEMINI_API_KEY || ''}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to detect anomalies', status: response.status },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Parse response
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()

    let anomalies: Anomaly[] = []

    try {
      anomalies = JSON.parse(rawText)
    } catch (e) {
      // If JSON parsing fails, try to extract array
      const match = rawText.match(/\[.*\]/s)
      if (match) {
        try {
          anomalies = JSON.parse(match[0])
        } catch {
          anomalies = []
        }
      }
    }

    // Add severity to anomalies
    anomalies = anomalies.map((a: any) => ({
      ...a,
      severity: determineSeverity(a.type)
    }))

    return NextResponse.json({
      success: true,
      anomalies,
      total: anomalies.length,
      bufferSize: buffer.length,
      model
    })
  } catch (error) {
    console.error('Anomaly detection error:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform anomaly detection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function determineSeverity(type: string): 'low' | 'medium' | 'high' {
  const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
    'WORD': 'low',
    'ENTITY': 'medium',
    'EQUATION': 'high',
    'CODE': 'high',
    'UNKNOWN': 'low'
  }
  return severityMap[type] || 'low'
}
