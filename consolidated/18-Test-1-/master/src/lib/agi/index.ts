/**
 * AGI System - Main Export
 * Autonomous General Intelligence for self-evolving code systems
 */

export { CognitiveCore, getCognitiveCore, type Thought, type CognitiveState } from './cognitive-core';
export { CodeAnalyzer, getCodeAnalyzer, type CodePattern, type AnalysisResult } from './code-analyzer';
export { CodeGenerator, getCodeGenerator, type GenerationRequest, type GeneratedCode, type MutationProposal } from './code-generator';
export { EvolutionEngine, getEvolutionEngine, type EvolutionCycleResult, type SystemHealth } from './evolution-engine';
export { 
  GAXEngine, 
  GODMEngine, 
  TCRMEngine, 
  GovernanceOrchestrator, 
  getGovernance,
  type Constraint,
  type ValidationResult,
  type Decision,
  type DecisionOption,
  type ConsensusResult
} from './governance';
export {
  AutonomousScheduler,
  getAutonomousScheduler,
  type AutonomousGoal,
  type AutonomousTask,
  type SchedulerState,
  type TaskQueue
} from './autonomous-scheduler';
export {
  MetaSystem,
  getMetaSystem,
  type FileMetadata,
  type MetaVote,
  type MetaRound
} from './meta-system';
export { AGICore, getAGI, type AGIConfig, type AnalysisResult as AGIAnalysisResult, type PatternMatch } from './core';
