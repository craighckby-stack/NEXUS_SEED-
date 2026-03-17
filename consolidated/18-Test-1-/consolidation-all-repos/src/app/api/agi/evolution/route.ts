/**
 * AGI Evolution API
 * Controls the autonomous evolution engine with governance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEvolutionEngine, getGovernance, getAutonomousScheduler } from '@/lib/agi';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const engine = getEvolutionEngine();

    switch (action) {
      case 'start': {
        try {
          await engine.start();
          return NextResponse.json({ 
            success: true, 
            message: 'Evolution engine started',
            status: await engine.getStatus()
          });
        } catch (error) {
          // Engine might already be running
          return NextResponse.json({ 
            success: true, 
            message: 'Evolution engine already running or starting',
            status: await engine.getStatus()
          });
        }
      }

      case 'stop': {
        await engine.stop();
        return NextResponse.json({ 
          success: true, 
          message: 'Evolution engine stopping'
        });
      }

      case 'runCycle': {
        const result = await engine.runCycle();
        return NextResponse.json({ success: true, result });
      }

      case 'setGoal': {
        const scheduler = getAutonomousScheduler();
        await scheduler.setGoal(data.goal);
        return NextResponse.json({ 
          success: true, 
          message: 'Goal set successfully',
          goal: data.goal
        });
      }

      case 'startAutonomous': {
        const scheduler = getAutonomousScheduler();
        try {
          await scheduler.start();
          return NextResponse.json({ 
            success: true, 
            message: 'Autonomous scheduler started',
            state: scheduler.getState()
          });
        } catch (error) {
          return NextResponse.json({ 
            success: true, 
            message: 'Scheduler already running',
            state: scheduler.getState()
          });
        }
      }

      case 'stopAutonomous': {
        const scheduler = getAutonomousScheduler();
        await scheduler.stop();
        return NextResponse.json({ 
          success: true, 
          message: 'Autonomous scheduler stopping'
        });
      }

      case 'evaluateAction': {
        const governance = await getGovernance();
        const evaluation = await governance.evaluateAction({
          type: data.type,
          description: data.description,
          confidence: data.confidence || 0.8,
          target: data.target,
          options: data.options,
          data: data.data
        });
        return NextResponse.json({ 
          success: true, 
          evaluation 
        });
      }

      case 'addConstraint': {
        const governance = await getGovernance();
        const constraint = await governance.getGAX().addConstraint({
          name: data.name,
          type: data.type,
          description: data.description,
          rule: data.rule,
          severity: data.severity || 'medium',
          active: true
        });
        return NextResponse.json({ 
          success: true, 
          message: 'Constraint added',
          constraint
        });
      }

      case 'scoreDecision': {
        const governance = await getGovernance();
        const decision = await governance.getGODM().scoreDecision(
          data.description,
          data.options,
          data.context || {}
        );
        return NextResponse.json({ 
          success: true, 
          decision 
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Evolution API error:', error);
    return NextResponse.json({
      error: 'Evolution action failed',
      message: (error as Error).message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail');

    const engine = getEvolutionEngine();

    if (detail === 'health') {
      const health = await engine.getHealth();
      return NextResponse.json({ success: true, health });
    }

    if (detail === 'cycles') {
      const cycles = await db.evolutionCycle.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          mutations: {
            select: {
              id: true,
              type: true,
              description: true,
              status: true
            }
          }
        }
      });
      return NextResponse.json({ success: true, cycles });
    }

    if (detail === 'mutations') {
      const mutations = await db.mutation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      return NextResponse.json({ success: true, mutations });
    }

    if (detail === 'scheduler') {
      const scheduler = getAutonomousScheduler();
      const state = scheduler.getState();
      const queue = scheduler.getTaskQueue();
      return NextResponse.json({ 
        success: true, 
        scheduler: state,
        taskQueue: queue
      });
    }

    if (detail === 'constraints') {
      const governance = await getGovernance();
      const constraints = governance.getGAX().getConstraints();
      return NextResponse.json({ 
        success: true, 
        constraints 
      });
    }

    if (detail === 'governance') {
      const governance = await getGovernance();
      const sources = governance.getTCRM().getSources();
      const constraints = governance.getGAX().getConstraints();
      return NextResponse.json({ 
        success: true, 
        telemetrySources: sources,
        constraintCount: constraints.length,
        axiomCount: constraints.filter(c => c.id.startsWith('axiom')).length
      });
    }

    if (detail === 'logs') {
      const logs = await db.aGILog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      return NextResponse.json({ success: true, logs });
    }

    // Default: return status
    const status = await engine.getStatus();
    const health = await engine.getHealth();

    return NextResponse.json({ 
      success: true, 
      status,
      health
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get evolution status',
      message: (error as Error).message
    }, { status: 500 });
  }
}
