// src/app/api/learning/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SelfImprovementCycle } from '@/lib/learning/self-improvement';

const cycle = new SelfImprovementCycle();

export async function POST(request: NextRequest) {
  const data = await request.json();

  switch (data.action) {
    case 'start-cycle':
      return await startCycle();
    case 'get-status':
      return await getStatus();
    case 'set-constraint':
      return await setConstraint(data.constraintLevel);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  async function startCycle() {
    try {
      const result = await cycle.executeCycle();
      return NextResponse.json({ success: true, cycle: result });
    } catch (error: any) {
      console.error('Learning API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  async function getStatus() {
    try {
      const constraintLevel = await cycle.getConstraintLevel();
      return NextResponse.json({ success: true, currentCycle: constraintLevel });
    } catch (error: any) {
      console.error('Learning API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  async function setConstraint(constraintLevel: string) {
    if (!constraintLevel) {
      return NextResponse.json({ error: 'Constraint level required' }, { status: 400 });
    }
    try {
      cycle.setConstraintLevel(constraintLevel);
      return NextResponse.json({ success: true, constraintLevel: cycle.getConstraintLevel() });
    } catch (error: any) {
      console.error('Learning API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
```

**