export interface SemanticTag {
  id: string;
  name: string;
  category: keyof typeof TAG_CATEGORIES;
  confidence: number;
  color?: string;
  icon?: string;
}

export interface TaggedExperience {
  experienceId: string;
  tags: SemanticTag[];
  semanticVector: number[];
  similarityScore: number;
}

export const TAG_CATEGORIES = {
  domain: {
    description: 'Domain-specific tags',
    icon: 'Globe',
    color: '#3B82F6',
  },
  task_type: {
    description: 'Task classification tags',
    icon: 'Zap',
    color: '#F59E0B',
  },
  difficulty: {
    description: 'Complexity and difficulty tags',
    icon: 'Target',
    color: '#EF4444',
  },
  outcome: {
    description: 'Result outcome tags',
    icon: 'CheckCircle',
    color: '#10B981',
  },
  quality: {
    description: 'Quality assessment tags',
    icon: 'Star',
    color: '#FBBF24',
  },
  pattern: {
    description: 'Recurring pattern tags',
    icon: 'Layers',
    color: '#8B5CF6',
  },
  custom: {
    description: 'User-defined custom tags',
    icon: 'Tag',
    color: '#6B7280',
  },
} as const;

export class SemanticTaggingEngine {
  private tagDefinitions: Map<string, SemanticTag[]> = new Map();
  private taggedExperiences: Map<string, TaggedExperience> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();

  private static instance: SemanticTaggingEngine;

  private constructor() {
    this.initializeTagDefinitions();
  }

  public static getInstance(): SemanticTaggingEngine {
    if (!SemanticTaggingEngine.instance) {
      SemanticTaggingEngine.instance = new SemanticTaggingEngine();
    }
    return SemanticTaggingEngine.instance;
  }

  public async tagExperience(experience: {
    id: string;
    description: string;
    taskType: string;
    domain: string;
    duration: number;
    success: boolean;
    performance: {
      accuracy: number;
      efficiency: number;
      quality: number;
    };
  }): Promise<TaggedExperience> {
    const tags: SemanticTag[] = [];

    // Auto-tag based on experience properties

    // Domain tag
    if (tags.length === 0 || tags.every(tag => tag.category !== 'domain')) {
      const domainTag = this.findMatchingDomainTag(experience.domain);
      if (domainTag) {
        tags.push(domainTag);
      }
    }

    // Task type tag
    if (tags.length === 0 || tags.every(tag => tag.category !== 'task_type')) {
      const taskTypeTag = this.findMatchingTaskTypeTag(experience.taskType);
      if (taskTypeTag) {
        tags.push(taskTypeTag);
      }
    }

    // Difficulty tag
    if (tags.length === 0 || tags.every(tag => tag.category !== 'difficulty')) {
      const difficultyTag = this.calculateDifficultyTag(experience);
      if (difficultyTag) {
        tags.push(difficultyTag);
      }
    }

    // Outcome tag
    if (tags.length === 0 || tags.every(tag => tag.category !== 'outcome')) {
      const outcomeTag = this.determineOutcomeTag(experience.success, experience.performance);
      if (outcomeTag) {
        tags.push(outcomeTag);
      }
    }

    // Quality tag
    if (tags.length === 0 || tags.every(tag => tag.category !== 'quality')) {
      const qualityTag = this.calculateQualityTag(experience.performance);
      if (qualityTag) {
        tags.push(qualityTag);
      }
    }

    // Pattern tags
    const patternTags = await this.detectPatterns(experience);
    tags.push(...patternTags);

    // Generate semantic vector
    const semanticVector = this.generateSemanticVector(experience);

    // Calculate similarity scores
    const similarityScores = await this.calculateTagSimilarity(tags, experience);

    const taggedExperience: TaggedExperience = {
      experienceId: experience.id,
      tags: tags.map(tag => ({
        ...tag,
        confidence: tag.confidence * similarityScores[tag.id],
      })),
      semanticVector,
      similarityScore: similarityScores.global,
    };

    // Cache and save
    this.embeddingCache.set(experience.id, semanticVector);
    this.taggedExperiences.set(experience.id, taggedExperience);
    await this.saveTaggedExperience(taggedExperience);

    return taggedExperience;
  }

  private findMatchingDomainTag(domain: string): SemanticTag | null {
    const tags = this.tagDefinitions.get('domain') || [];

    const exactMatch = tags.find(tag =>
      tag.name.toLowerCase() === domain.toLowerCase()
    );

    if (exactMatch) {
      return { ...exactMatch, confidence: 1.0 };
    }

    const partialMatch = domain.toLowerCase().includes(this.tagDefinitions.get('domain')!.find(t => t.name.toLowerCase().includes(domain.toLowerCase()))!.name.toLowerCase());
    if (partialMatch) {
      return { ...this.tagDefinitions.get('domain')!.find(t => t.name.toLowerCase().includes(domain.toLowerCase()))!, confidence: 0.85 };
    }

    return null;
  }

  private findMatchingTaskTypeTag(taskType: string): SemanticTag | null {
    const tags = this.tagDefinitions.get('task_type') || [];

    const exactMatch = tags.find(tag =>
      tag.name.toLowerCase() === taskType.toLowerCase()
    );

    if (exactMatch) {
      return { ...exactMatch, confidence: 1.0 };
    }

    const partialMatch = taskType.toLowerCase().includes(this.tagDefinitions.get('task_type')!.find(t => t.name.toLowerCase().includes(taskType.toLowerCase()))!.name.toLowerCase());
    if (partialMatch) {
      return { ...this.tagDefinitions.get('task_type')!.find(t => t.name.toLowerCase().includes(taskType.toLowerCase()))!, confidence: 0.85 };
    }

    return null;
  }

  private calculateDifficultyTag(experience: {
    duration: number;
    success: boolean;
  }): SemanticTag | null {
    const tags = this.tagDefinitions.get('difficulty') || [];

    // Based on duration and success
    if (experience.success) {
      if (experience.duration < 60000) { // < 1 minute
        return { ...tags[0], confidence: 0.8 }; // Trivial
      } else if (experience.duration < 600000) { // < 10 minutes
        return { ...tags[1], confidence: 0.85 }; // Easy
      } else if (experience.duration < 3600000) { // < 1 hour
        return { ...tags[2], confidence: 0.9 }; // Medium
      } else if (experience.duration < 14400000) { // < 4 hours
        return { ...tags[3], confidence: 0.85 }; // Hard
      } else {
        return { ...tags[4], confidence: 0.8 }; // Expert
      }
    } else {
      // Failed tasks are usually at least medium
      if (experience.duration < 3600000) { // < 1 hour
        return { ...tags[2], confidence: 0.75 }; // Medium
      } else {
        return { ...tags[3], confidence: 0.7 }; // Hard
      }
    }
  }

  private determineOutcomeTag(success: