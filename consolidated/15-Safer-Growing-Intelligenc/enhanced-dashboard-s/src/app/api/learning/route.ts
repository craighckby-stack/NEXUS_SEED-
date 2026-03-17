import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const strategies = await db.learningStrategy.findMany({
      orderBy: { effectiveness: 'desc' }
    })

    return NextResponse.json(strategies)
  } catch (error) {
    console.error('Error fetching learning strategies:', error)
    return NextResponse.json({ error: 'Failed to fetch learning strategies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { strategy, effectiveness } = body

    const existingStrategy = await db.learningStrategy.findFirst({
      where: { strategy }
    })

    let updatedStrategy
    if (existingStrategy) {
      updatedStrategy = await db.learningStrategy.update({
        where: { id: existingStrategy.id },
        data: {
          effectiveness: effectiveness || existingStrategy.effectiveness,
          usageCount: existingStrategy.usageCount + 1,
          lastUsed: new Date()
        }
      })
    } else {
      updatedStrategy = await db.learningStrategy.create({
        data: {
          strategy,
          effectiveness: effectiveness || 0.0,
          usageCount: 1
        }
      })
    }

    return NextResponse.json(updatedStrategy)
  } catch (error) {
    console.error('Error updating learning strategy:', error)
    return NextResponse.json({ error: 'Failed to update learning strategy' }, { status: 500 })
  }
}