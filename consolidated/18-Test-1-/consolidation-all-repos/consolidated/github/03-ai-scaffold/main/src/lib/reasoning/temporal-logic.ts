// Reasoning Layer - Temporal Logic Engine
// Handles time-aware decision making, planning, and causal reasoning

export enum TemporalType {
  INSTANT = 'instant',
  SECONDS = 'seconds',
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years',
}

export enum TemporalSeverity {
  SOFT = 'soft',
  HARD = 'hard',
  CRITICAL = 'critical',
}

export enum TemporalStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  FAILED = 'failed',
}

export interface TemporalEvent {
  id: string;
  timestamp: number;
  type: TemporalType;
  description: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
}

export interface TemporalConstraint {
  id: string;
  type: 'deadline' | 'duration' | 'sequence' | 'concurrent' | 'recurrence';
  value: number | string | Date;
  severity: TemporalSeverity;
  description: string;
}

export interface TemporalPhase {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  dependencies: string[];
  status: TemporalStatus;
}

export interface CausalRelationship {
  id: string;
  causeEventId: string;
  effectEventId: string;
  type: 'direct' | 'indirect' | 'contributing' | 'preventing';
  confidence: number; // 0.0 to 1.0
  strength: number; // 0.0 to 1.0
}

export interface TemporalPlan {
  id: string;
  horizon: 'short' | 'medium' | 'long' | 'very_long';
  startTime: number;
  endTime: number;
  phases: TemporalPhase[];
  constraints: TemporalConstraint[];
  totalDuration: number;
}

export const TEMPORAL_ABSTRACTIONS = {
  [TemporalType.INSTANT]: {
    level: 0,
    description: 'Immediate action with no delay',
    duration_ms: 0,
  },
  [TemporalType.SECONDS]: {
    level: 1,
    description: 'Actions within seconds time horizon',
    duration_ms: 1000,
  },
  [TemporalType.MINUTES]: {
    level: 2,
    description: 'Actions within minutes time horizon',
    duration_ms: 60000,
  },
  [TemporalType.HOURS]: {
    level: 3,
    description: 'Actions within hours time horizon',
    duration_ms: 360000,
  },
  [TemporalType.DAYS]: {
    level: 4,
    description: 'Actions within days time horizon',
    duration_ms: 86400000,
  },
} as const;

class TemporalLogic {
  private events: TemporalEvent[] = [];
  private constraints: TemporalConstraint[] = [];
  private causalRelationships: CausalRelationship[] = [];
  private plans: TemporalPlan[] = [];

  constructor() {
    this.loadTemporalState();
  }

  private async loadTemporalState(): Promise<void> {
    try {
      const response = await fetch('/api/memory/temporal');
      const data = await response.json();
      this.events = data.events || [];
      this.constraints = data.constraints || [];
      this.causalRelationships = data.causalRelationships || [];
      this.plans = data.plans || [];
    } catch (error) {
      console.error('Failed to load temporal state:', error);
    }
  }

  createEvent(event: Omit<TemporalEvent, 'id'>): TemporalEvent {
    const newEvent: TemporalEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      ...event,
    };

    this.events.push(newEvent);

    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }

    return newEvent;
  }

  getEventsInWindow(startTime: number, endTime: number = Date.now(), type?: TemporalType): TemporalEvent[] {
    return this.events.filter(event => {
      const inTimeWindow = event.timestamp >= startTime && event.timestamp <= endTime;
      const matchesType = !type || event.type === type;
      return inTimeWindow && matchesType;
    }).sort((a, b) => a.timestamp - b.timestamp);
  }

  addConstraint(constraint: Omit<TemporalConstraint, 'id'>): TemporalConstraint {
    const newConstraint: TemporalConstraint = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ...constraint,
    };

    this.constraints.push(newConstraint);

    if (this.constraints.length > 1000) {
      this.constraints = this.constraints.slice(-1000);
    }

    return newConstraint;
  }

  checkConstraint(constraintId: string): {
    satisfied: boolean;
    remaining: number;
    description: string;
  } {
    const constraint = this.constraints.find(c => c.id === constraintId);
    if (!constraint) {
      return {
        satisfied: true,
        remaining: 0,
        description: 'Constraint not found',
      };
    }

    const now = Date.now();
    const nowMs = now;

    switch (constraint.type) {
      case 'deadline':
        const deadlineMs =
          constraint.value instanceof Date
            ? constraint.value.getTime()
            : new Date(constraint.value).getTime();
        const remaining = deadlineMs - nowMs;

        return {
          satisfied: remaining >= 0,
          remaining: Math.max(0, remaining),
          description: constraint.severity === 'critical' && remaining < 0
            ? 'Critical deadline exceeded'
            : constraint.severity === 'hard' && remaining < 0
            ? 'Hard deadline exceeded'
            : `Deadline ${remaining >= 0 ? 'in' : remaining < 0 ? 'missed by' : ''} ${Math.abs(remaining)}ms`,
        };

      case 'duration':
        const durationMs =
          typeof constraint.value === 'number'
            ? constraint.value * 1000
            : typeof constraint.value === 'string'
            ? this.parseDuration(constraint.value)
            : 0;
        return {
          satisfied: true,
          remaining: durationMs,
          description: `Duration constraint: ${durationMs}ms`,
        };

      default:
        return {
          satisfied: true,
          remaining: 0,
          description: `Constraint type ${constraint.type} not implemented`,
        };
    }
  }

  parseDuration(duration: string): number {
    const patterns = {
      s: 1000,
      m: 60000,
      h: 360000,
      d: 86400000,
      w: 604800000,
      mo: 2629800000,
      y: 31536000000,
    };

    let totalMs = 0;
    const regex = /(\d+)([smhdwy])/gi;
    let match;

    while ((match = regex.exec(duration)) !== null) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      totalMs += value * patterns[unit as keyof typeof patterns];
    }

    return totalMs;
  }

  createCausalRelationship(relationship: Omit<CausalRelationship, 'id'>): CausalRelationship {
    const newRelationship: CausalRelationship = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ...relationship,
    };

    this.causalRelationships.push(newRelationship);

    if (this.causalRelationships.length > 5000) {
      this.causalRelationships = this.causalRelationships.slice(-5000);
    }

    return newRelationship;
  }

  analyzeCausalChain(startEventId: string, maxDepth: number = 10): {
    chain: CausalRelationship[];
    loops: string[][];
    confidence: number;
    longestPath: string[];
  } {
    const chain: CausalRelationship[] = [];
    const loops: string[] = [];
    const visited: Set<string> = new Set();

    let currentEventId = startEventId;
    let depth = 0;

    while (currentEventId && depth < maxDepth) {
      if (visited.has(currentEventId)) {
        loops.push(currentEventId);
        break;
      }

      visited.add(currentEventId);

      const effects = this.causalRelationships
        .filter(r => r.causeEventId === currentEventId)
        .sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending

      if (effects.length === 0) {
        break; // No more effects, end of chain
      }

      const strongestEffect = effects[0];
      chain.push(strongestEffect);
      currentEventId = strongestEffect.effectEventId;
      depth++;
    }

    const averageConfidence = chain.length > 0
      ? chain.reduce((sum, r) => sum + r.confidence, 0) / chain.length
      : 0;

    return {
      chain,
      loops,
      confidence: averageConfidence,
      longestPath: chain.map(r => r.effectEventId),
    };
  }

  predictFutureEvents(horizon: 'short' | 'medium' | 'long' = 'medium'): {
    predictedEvents: TemporalEvent[];
    confidence: number;
    reasoning: string;
  } {
    const now = Date.now();
    let horizonMs: number;

    switch (horizon) {
      case 'short':
        horizonMs = TEMPORAL_ABSTRACTIONS.MINUTES.duration_ms; // 1 hour
        break;
      case 'medium':
        horizonMs = TEMPORAL_ABSTRACTIONS.HOURS.duration_ms; // 1 day
        break;
      case 'long':
        horizonMs = TEMPORAL_ABSTRACTIONS.DAYS.duration_ms; // 1 week
        break;
    }

    const recentEvents = this.getEventsInWindow(now - 7 * 24 * 60 * 60 * 1000, now);

    const predictedEvents: TemporalEvent[] = [];

    const eventPatterns = new Map<string, number>();

    for (const event of recentEvents) {
      const patternKey = `${event.type}-${event.description.substring(0, 50)}`;
      eventPatterns.set(patternKey, (eventPatterns.get(patternKey) || 0) + 1);
    }

    for (const [patternKey, count] of eventPatterns.entries()) {
      if (count >= 2) { // Pattern repeated at least twice
        const [eventType, description] = patternKey.split('-');

        const relatedEvents = recentEvents.filter(e =>
          e.type === eventType && e.description.startsWith(description)
        );

        if (relatedEvents.length >= 2) {
          const intervals: number[] = [];
          for (let i = 1; i < relatedEvents.length; i++) {
            intervals.push(relatedEvents[i].timestamp - relatedEvents[i - 1].timestamp);
          }

          const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
          const lastEventTime = relatedEvents[relatedEvents.length - 1].timestamp;
          const nextPredictedTime = lastEventTime + avgInterval;

          if (nextPredictedTime <= now + horizonMs) {
            predictedEvents.push({
              id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
              timestamp: nextPredictedTime,
              type: eventType as TemporalType,
              description: `Predicted: ${description}`,
              duration: avgInterval,
            });
          }
        }
      }
    }

    const confidence = predictedEvents.length > 0
      ? Math.min(0.5 + (predictedEvents.length * 0.05), 0.9)
      : 0.0;

    return {
      predictedEvents,
      confidence,
      reasoning: confidence > 0.3
        ? `Predictions based on ${predictedEvents.length} repeating patterns`
        : 'Insufficient pattern data for reliable predictions',
    };
  }

  createTemporalPlan(params: {
    horizon: 'short' | 'medium' | 'long' | 'very_long';
    phases: Array<{
      name: string;
      duration: number;
      dependencies: string[];
    }>;
    constraints?: TemporalConstraint[];
  }): TemporalPlan {
    const now = Date.now();
    let totalDurationMs: number;

    totalDurationMs = params.phases.reduce((sum, phase) => sum + phase.duration, 0);

    let horizonMs: number;
    switch (params.horizon) {
      case 'short':
        horizonMs = TEMPORAL_ABSTRACTIONS.MINUTES.duration_ms; // 1 hour
        break;
      case 'medium':
        horizonMs = TEMPORAL_ABSTRACTIONS.HOURS.duration_ms; // 1 day
        break;
      case 'long':
        horizonMs = TEMPORAL_ABSTRACTIONS.DAYS.duration_ms; // 1 week
        break;
      case 'very_long':
        horizonMs = TEMPORAL_ABSTRACTIONS.WEEKS.duration_ms; // 1 month
        break;
    }

    if (totalDurationMs > horizonMs) {
      totalDurationMs = horizonMs;
    }

    const phases: TemporalPhase[] = [];
    let currentStartTime = now;

    for (let i = 0; i < params.phases.length; i++) {
      const phase = params.phases[i];
      const endTime = currentStartTime + phase.duration;

      phases.push({
        id: `${Date.now()}-${i}`,
        name: phase.name,
        startTime: currentStartTime,
        endTime,
        duration: phase.duration,
        dependencies: phase.dependencies || [],
        status: i === 0 ? 'pending' : 'blocked',
      });

      currentStartTime = endTime;
    }

    const activeConstraints = params.constraints || [];
    const constraintViolations: string[]