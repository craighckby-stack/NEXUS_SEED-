import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const environments = await db.virtualEnvironment.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(environments)
  } catch (error) {
    console.error('Error fetching environments:', error)
    return NextResponse.json({ error: 'Failed to fetch environments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, level, sessionId } = body

    const environment = await db.virtualEnvironment.create({
      data: {
        domain,
        level,
        sessionId
      }
    })

    return NextResponse.json(environment)
  } catch (error) {
    console.error('Error creating environment:', error)
    return NextResponse.json({ error: 'Failed to create environment' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, completed, score } = body

    const environment = await db.virtualEnvironment.update({
      where: { id },
      data: {
        completed,
        score
      }
    })

    return NextResponse.json(environment)
  } catch (error) {
    console.error('Error updating environment:', error)
    return NextResponse.json({ error: 'Failed to update environment' }, { status: 500 })
  }
}