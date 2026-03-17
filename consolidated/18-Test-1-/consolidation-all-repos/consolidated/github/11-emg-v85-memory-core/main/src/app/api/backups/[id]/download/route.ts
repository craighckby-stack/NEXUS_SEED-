import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const backup = await db.memoryBackup.findUnique({
      where: { id }
    })

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }

    // Decode base64 to binary
    const binaryData = Buffer.from(backup.binaryData, 'base64')

    return new NextResponse(binaryData, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${backup.fileName}"`
      }
    })
  } catch (error) {
    console.error('Error downloading backup:', error)
    return NextResponse.json(
      { error: 'Failed to download backup' },
      { status: 500 }
    )
  }
}
