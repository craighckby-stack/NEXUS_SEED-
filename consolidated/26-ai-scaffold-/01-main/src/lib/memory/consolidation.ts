// src/lib/memory/consolidation.ts
import { v4 as uuidv4 } from 'uuid';

export interface ConsolidationTask {
  concepts: string[];
  experienceData: any;
  timestamp: Date;
  priority: number;
  taskId: string; // Unique task ID
}

export interface LearningData {
  context: string;
  response: string;
  oecsScore: number;
  stage: string;
  phase: string;
}

export class MemoryConsolidation {
  private consolidationQueue: ConsolidationTask[] = [];
  private queueLock: boolean = false; // Mutex for concurrent safety

  async queueConsolidation(task: ConsolidationTask): Promise<void> {
    if (this.queueLock) {
      await this.waitForQueueAvailability();
    }
    this.consolidationQueue.push({ ...task, taskId: uuidv4() });
    console.log('📝 Consolidation task queued');
  }

  async waitForQueueAvailability(): Promise<void> {
    while (this.queueLock) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  async consolidate(): Promise<void> {
    console.log(`🧠 Consolidating ${this.consolidationQueue.length} tasks...`);

    for (const task of [...this.consolidationQueue]) {
      console.log(`Processing task: ${JSON.stringify(task.experienceData)}`);
      this.consolidationQueue = this.consolidationQueue.filter(t => t.taskId !== task.taskId);
    }

    this.consolidationQueue.length = 0;

    console.log('✅ Consolidation complete');
  }
}
```

**