import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const alerts = await db.emergentAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, alertType, severity, description, baseline, observed } = body

    const alert = await db.emergentAlert.create({
      data: {
        sessionId,
        alertType,
        severity,
        description,
        baseline,
        observed
      }
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}