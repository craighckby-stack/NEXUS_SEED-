/**
 * Evolution Phases Definition
 * Defines 7-phase evolution cycle for autonomous code improvement
 */

export type EvolutionPhase = 
  | 'question'
  | 'answer'
  | 'debate'
  | 'decision'
  | 'mutation'
  | 'commit'
  | 'deployment';

export interface PhaseContext {
  phase: EvolutionPhase;
  question?: string;
  answer?: string;
  proArguments?: string;
  conArguments?: string;
  decision?: boolean;
  targetFile?: string;
  evolvedCode?: string;
  commitSha?: string;
  deploymentStatus?: 'pending' | 'in_progress' | 'success' | 'failed';
  startTime: number;
}

export const PHASE_NAMES: Record<EvolutionPhase, string> = {
  question: 'Phase 1: Question Generation',
  answer: 'Phase 2: AI Answer',
  debate: 'Phase 3: PRO/CON Debate',
  decision: 'Phase 4: Decision Making',
  mutation: 'Phase 5: Code Mutation',
  commit: 'Phase 6: Commit to GitHub',
  deployment: 'Phase 7: Deployment Monitor'
};

export const QUESTIONS_TO_ASK = [
  'How can we optimize React component rendering performance?',
  'What TypeScript patterns would improve type safety?',
  'How can we reduce bundle size without breaking functionality?',
  'What error handling patterns should be added?',
  'How can we improve state management architecture?',
  'What accessibility features are missing?',
  'How can we optimize API response handling?',
  'What testing strategies should be implemented?',
  'How can we improve code maintainability?'
];

export function getRandomQuestion(): string {
  return QUESTIONS_TO_ASK[Math.floor(Math.random() * QUESTIONS_TO_ASK.length)];
}

export function getNextPhase(currentPhase: EvolutionPhase): EvolutionPhase {
  const phases: EvolutionPhase[] = [
    'question', 'answer', 'debate', 'decision', 
    'mutation', 'commit', 'deployment'
  ];
  const currentIndex = phases.indexOf(currentPhase);
  return phases[(currentIndex + 1) % phases.length];
}
