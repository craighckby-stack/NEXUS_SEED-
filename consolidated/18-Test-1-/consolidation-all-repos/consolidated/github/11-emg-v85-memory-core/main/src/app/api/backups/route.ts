import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { binaryData, fileName, messageCount, version = '8.5', description } = body

    if (!binaryData || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: binaryData or fileName' },
        { status: 400 }
      )
    }

    // Calculate file size
    const fileSize = Buffer.from(binaryData, 'base64').length

    // Save to database
    const backup = await db.memoryBackup.create({
      data: {
        fileName,
        binaryData,
        messageCount: messageCount || 0,
        version,
        fileSize,
        description: description || `Auto-backup ${new Date().toISOString()}`
      }
    })

    return NextResponse.json({
      success: true,
      backup: {
        id: backup.id,
        fileName: backup.fileName,
        messageCount: backup.messageCount,
        fileSize: backup.fileSize,
        createdAt: backup.createdAt,
        description: backup.description
      }
    })
  } catch (error) {
    console.error('Error saving backup:', error)
    return NextResponse.json(
      { error: 'Failed to save backup' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // If id is provided, load specific backup
    if (id) {
      const backup = await db.memoryBackup.findUnique({
        where: { id }
      })

      if (!backup) {
        return NextResponse.json(
          { error: 'Backup not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        backup: {
          id: backup.id,
          fileName: backup.fileName,
          binaryData: backup.binaryData,
          messageCount: backup.messageCount,
          version: backup.version,
          fileSize: backup.fileSize,
          description: backup.description,
          createdAt: backup.createdAt,
          updatedAt: backup.updatedAt
        }
      })
    }

    // Otherwise, list all backups
    const backups = await db.memoryBackup.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      backups: backups.map(backup => ({
        id: backup.id,
        fileName: backup.fileName,
        messageCount: backup.messageCount,
        version: backup.version,
        fileSize: backup.fileSize,
        description: backup.description,
        createdAt: backup.createdAt,
        updatedAt: backup.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching backups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backups' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing backup id' },
        { status: 400 }
      )
    }

    await db.memoryBackup.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting backup:', error)
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    )
  }
}
