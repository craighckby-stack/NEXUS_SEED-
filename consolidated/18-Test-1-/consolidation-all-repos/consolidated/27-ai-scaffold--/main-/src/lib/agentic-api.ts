// @ts-check
/**
 * AGENTIC API - Simple Interface for Agent Swarm
 * Provides easy access to agent capabilities and task submission
 */

import { agentRegistry } from './agents/agent-registry';
import { orchestrator } from './agents/orchestrator';

/**
 * Agent Capability
 */
interface AgentCapability {
  agentId: string;
  name: string;
  domain: string;
  capabilities: string[];
  availability: 'available' | 'busy' | 'offline';
  priority: number;
}

/**
 * Task Submission
 */
interface TaskSubmission {
  taskId: string;
  taskDescription: string;
  taskType: string;
  domain: string;
  priority: number;
  inputs?: Record<string, any>;
  context?: Record<string, any>;
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Task Status
 */
interface TaskStatus {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'timeout';
  assignedAgent?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  progress: number; // 0.0 to 1.0
  result?: Record<string, any>;
  error?: string;
}

/**
 * Agentic API Class
 * Provides simple interface for agent swarm operations
 */
class AgenticAPI {
  private static instance: AgenticAPI;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AgenticAPI {
    if (!AgenticAPI.instance) {
      AgenticAPI.instance = new AgenticAPI();
    }
    return AgenticAPI.instance;
  }

  /**
   * Get all available agents
   */
  private async getAvailableAgents(): Promise<AgentCapability[]> {
    return agentRegistry.getAllAgents().map((agent) => ({
      agentId: agent.id,
      name: agent.name,
      domain: agent.domain,
      capabilities: agent.capabilities,
      availability: agent.status === 'idle' ? 'available' : 'busy',
      priority: agent.priority,
    }));
  }

  async getAgentsByDomain(domain: string): Promise<AgentCapability[]> {
    const agents = await this.getAvailableAgents();
    return agents.filter((agent) => agent.domain.toLowerCase() === domain.toLowerCase());
  }

  /**
   * Submit task to agent swarm
   */
  private async submitTask(submission: TaskSubmission): Promise<TaskStatus> {
    const task = {
      id: submission.taskId,
      description: submission.taskDescription,
      type: submission.taskType,
      domain: submission.domain,
      priority: submission.priority,
      inputs: submission.inputs || {},
      context: submission.context || {},
    };

    const result = await orchestrator.executeTask(task, {
      timeout: submission.timeoutMs,
      maxRetries: submission.maxRetries || 3,
    });

    const taskStatus: TaskStatus = {
      taskId: submission.taskId,
      status: result.success ? 'completed' : 'failed',
      assignedAgent: result.agentId,
      startTime: result.startTime,
      endTime: result.endTime,
      duration: result.duration,
      progress: result.success ? 1.0 : 0.0,
      result: result.output,
      error: result.error,
    };

    console.log(`AgenticAPI: Task ${submission.taskId} ${taskStatus.status}`);

    return taskStatus;
  }

  /**
   * Get task status
   */
  private async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const result = await orchestrator.getTaskResult(taskId);

    return {
      taskId,
      status: result.success ? 'completed' : 'failed',
      assignedAgent: result.agentId,
      startTime: result.startTime,
      endTime: result.endTime,
      duration: result.duration,
      progress: result.success ? 1.0 : 0.0,
      result: result.output,
      error: result.error,
    };
  }

  /**
   * Batch submit tasks
   */
  async batchSubmitTasks(submissions: TaskSubmission[]): Promise<TaskStatus[]> {
    return Promise.all(submissions.map((submission) => this.submitTask(submission)));
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    console.log(`AgenticAPI: Cancelling task ${taskId}`);

    return await orchestrator.cancelTask(taskId);
  }

  /**
   * Get agent statistics
   */
  private async getAgentStatistics(): Promise<{
    totalAgents: number;
    availableAgents: number;
    busyAgents: number;
    offlineAgents: number;
    byDomain: Record<string, number>;
    tasksCompleted: number;
    averageTaskDuration: number;
  }> {
    const agents = await agentRegistry.getAllAgents();
    const total = agents.length;
    const available = agents.filter((agent) => agent.status === 'idle').length;
    const busy = agents.filter((agent) => agent.status === 'busy').length;
    const offline = agents.filter((agent) => agent.status === 'offline').length;

    const byDomain: Record<string, number> = {};
    agents.forEach((agent) => {
      const domain = agent.domain;
      byDomain[domain] = (byDomain[domain] || 0) + 1;
    });

    const taskResults = await orchestrator.getTaskResults();
    const completedTasks = taskResults.filter((result) => result.success).length;
    const avgDuration =
      completedTasks > 0
        ? taskResults.reduce((sum, result) => sum + (result.duration || 0), 0) / completedTasks
        : 0;

    return {
      totalAgents: total,
      availableAgents: available,
      busyAgents: busy,
      offlineAgents: offline,
      byDomain,
      tasksCompleted: completedTasks,
      averageTaskDuration: avgDuration,
    };
  }

  /**
   * Get swarm health status
   */
  private async getSwarmHealth(): Promise<{
    healthy: boolean;
    activeAgents: number;
    totalCapacity: number;
    currentLoad: number;
    loadPercentage: number;
    recommendedActions: string[];
  }> {
    const agents = await agentRegistry.getAllAgents();
    const activeAgents = agents.filter((agent) => agent.status === 'idle' || agent.status === 'busy').length;
    const totalCapacity = agents.length;
    const currentLoad = agents.filter((agent) => agent.status === 'busy').length;
    const loadPercentage =
      totalCapacity > 0
        ? (currentLoad / totalCapacity) * 100
        : 0;

    const healthy = loadPercentage < 80 && activeAgents > 0;

    const recommendedActions: string[] = [];

    if (loadPercentage > 90) {
      recommendedActions.push('Agent swarm near capacity - consider adding more agents');
    }

    if (activeAgents < totalCapacity * 0.5) {
      recommendedActions.push('Low agent utilization - consider reducing agent pool');
    }

    if (!healthy) {
      recommendedActions.push('Agent swarm unhealthy - investigate agent failures');
    }

    return {
      healthy,
      activeAgents,
      totalCapacity,
      currentLoad,
      loadPercentage: Math.round(loadPercentage * 100) / 100,
      recommendedActions,
    };
  }

  /**
   * Register new agent
   */
  private async registerAgent(agent: {
    id: string;
    name: string;
    domain: string;
    capabilities: string[];
    priority: number;
  }): Promise<boolean> {
    console.log(`AgenticAPI: Registering agent ${agent.id}`);

    try {
      return await agentRegistry.registerAgent(agent);
    } catch (error) {
      console.error(`AgenticAPI: Failed to register agent ${agent.id}:`, error);
      return false;
    }
  }

  /**
   * Unregister agent
   */
  private async unregisterAgent(agentId: string): Promise<boolean> {
    console.log(`AgenticAPI: Unregistering agent ${agentId}`);

    try {
      return await agentRegistry.unregisterAgent(agentId);
    } catch (error) {
      console.error(`AgenticAPI: Failed to unregister agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Get agent capabilities
   */
  private async getAgentCapabilities(agentId: string): Promise<AgentCapability | null> {
    const agents = await this.getAvailableAgents();
    const agent = agents.find((a) => a.agentId === agentId);

    return agent || null;
  }

  /**
   * Update agent status
   */
  private async updateAgentStatus(agentId: string, status: 'idle' | 'busy' | 'offline'): Promise<boolean> {
    try {
      return await agentRegistry.updateAgentStatus(agentId, status);
    } catch (error) {
      console.error(`AgenticAPI: Failed to update agent ${agentId} status:`, error);
      return false;
    }
  }

  /**
   * Get task queue status
   */
  private async getTaskQueueStatus(): Promise<{
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageQueueWaitTime: number;
    longestWaitTime: number;
  }> {
    const taskResults = await orchestrator.getTaskResults();

    const pending = taskResults.filter((result) => !result.completed && !result.failed).length;
    const inProgress = taskResults.filter((result) => result.inProgress).length;
    const completed = taskResults.filter((result) => result.completed && result.success).length;
    const failed = taskResults.filter((result) => result.completed && !result.success).length;

    const waitTimes =
      taskResults.filter((result) => result.startTime && result.submissionTime).map((result) => result.startTime - result.submissionTime);

    const avgWait = waitTimes.length > 0
      ? waitTimes.reduce((sum, wait) => sum + wait, 0) / waitTimes.length
      : 0;

    const longestWait = waitTimes.length > 0
      ? Math.max(...waitTimes)
      : 0;

    return {
      pendingTasks: pending,
      inProgressTasks: inProgress,
      completedTasks: completed,
      failedTasks: failed,
      averageQueueWaitTime: avgWait,
      longestWaitTime: longestWait,
    };
  }

  // Singleton instance
  static get instance() {
    return AgenticAPI.getInstance();
  }
}
```

**