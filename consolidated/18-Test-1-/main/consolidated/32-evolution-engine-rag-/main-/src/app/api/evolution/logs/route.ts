// src/app/api/evolution/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Constants for log retrieval
const LOG_RETRIEVAL_LIMIT = 100;
const LOG_RETRIEVAL_ORDER = { timestamp: 'desc' };

// Constants for error handling
const INTERNAL_SERVER_ERROR_STATUS = 500;
const GENERIC_ERROR_MESSAGE = 'Failed to fetch logs';
const LOG_CREATION_ERROR_MESSAGE = 'Failed to create log';

// Function to handle GET requests for logs
export async function GET() {
  try {
    const logs = await retrieveLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: GENERIC_ERROR_MESSAGE }, { status: INTERNAL_SERVER_ERROR_STATUS });
  }
}

// Function to handle POST requests for log creation
export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();
    const createdLog = await createLog(logData);
    return NextResponse.json(createdLog);
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json({ error: LOG_CREATION_ERROR_MESSAGE }, { status: INTERNAL_SERVER_ERROR_STATUS });
  }
}

// Helper function to retrieve logs from the database
async function retrieveLogs() {
  const logs = await db.systemLog.findMany({
    orderBy: LOG_RETRIEVAL_ORDER,
    take: LOG_RETRIEVAL_LIMIT
  });
  return logs.reverse();
}

// Helper function to create a new log in the database
async function createLog(logData: { message: string; type?: string }) {
  const { message, type } = logData;
  return await db.systemLog.create({
    data: {
      message,
      type: type || 'info',
      timestamp: new Date()
    }
  });
}