// src/app/api/agents/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agents/orchestrator';
import { APIError } from '@/lib/utils/api';

/**
 * Handle POST requests to the agents API endpoint.
 *
 * @returns {NextResponse} JSON response with the result of the task execution.
 */
export async function POST(request: NextRequest) {
  try {
    const { query, domain, priority } = await request.json();
    const task = {
      id: `task-${Date.now()}`,
      domain: domain || 'General',
      query,
      priority: priority || 1,
      timestamp: Date.now()
    };

    const orchestrator = new AgentOrchestrator();
    const result = await orchestrator.executeTask(task);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error(`Agents API error: ${error.message}`);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**