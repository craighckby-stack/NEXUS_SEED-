import { NextRequest, NextResponse } from 'next/server';
import { getAGI } from '@/lib/agi/core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message is required' 
      }, { status: 400 });
    }

    const agi = await getAGI();
    const response = await agi.chat(message, sessionId || 'default');

    return NextResponse.json({
      success: true,
      response,
      sessionId: sessionId || 'default'
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
