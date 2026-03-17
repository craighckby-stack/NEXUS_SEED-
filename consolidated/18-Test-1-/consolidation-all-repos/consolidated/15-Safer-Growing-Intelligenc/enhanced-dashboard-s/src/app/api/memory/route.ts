import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const memories = await db.aGIMemory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(memories)
  } catch (error) {
    console.error('Error fetching memories:', error)
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { concept, confidence, relationships, category } = body

    const memory = await db.aGIMemory.create({
      data: {
        concept,
        confidence: confidence || 0.0,
        relationships,
        category
      }
    })

    return NextResponse.json(memory)
  } catch (error) {
    console.error('Error creating memory:', error)
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 })
  }
}