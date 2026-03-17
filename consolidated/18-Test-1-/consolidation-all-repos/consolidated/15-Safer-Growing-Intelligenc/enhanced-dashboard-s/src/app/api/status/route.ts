import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await db.aGISession.findFirst({
      orderBy: { lastActivity: 'desc' }
    })

    const memoryCount = await db.aGIMemory.count()
    const activeAlerts = await db.emergentAlert.count({
      where: { resolved: false }
    })
    const completedEnvironments = await db.virtualEnvironment.count({
      where: { completed: true }
    })

    const status = {
      systemActive: session?.status === 'active' || false,
      currentLevel: session?.currentLevel || 'CAVEMAN',
      memoryCount,
      activeAlerts,
      completedEnvironments,
      lastActivity: session?.lastActivity || new Date(),
      sessionId: session?.sessionId || 'none'
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching status:', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}