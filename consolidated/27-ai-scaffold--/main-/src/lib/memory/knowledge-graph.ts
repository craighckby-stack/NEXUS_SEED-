import { db } from '@/lib/db';
import console from 'console';

/**
 * Represents a concept node in the knowledge graph.
 */
export interface ConceptNode {
  name: string;
  frequency: number;
  confidence: number;
  lastSeen: Date;
}

/**
 * Represents a relationship between two concept nodes.
 */
export interface Relationship {
  targetConcept: string;
  type: string;
  strength: number;
}

/**
 * Represents learning data resulting from a user interaction.
 */
export interface LearningData {
  context: string;
  response: string;
  oecsScore: number;
}

/**
 * Manages the storage and processing of concept nodes within the knowledge graph.
 */
export class KnowledgeGraph {
  private readonly logger = console;

  /**
   * Processes learning data, extracts concepts, and updates the knowledge graph.
   *
   * @param learningData The data generated from a learning interaction.
   * @returns An array of ConceptNodes representing the updated state of the extracted concepts.
   */
  public async storeLearning(learningData: LearningData): Promise<ConceptNode[]> {
    const conceptNames = await this.extractConcepts(learningData);
    await this.updateConcepts(conceptNames, learningData);
    return conceptNames.map(concept => {
      const now = new Date();
      return {
        name: concept,
        frequency: 1,
        confidence: learningData.oecsScore,
        lastSeen: now,
      };
    });
  }

  /**
   * Extracts potential concept keywords from the learning context and response.
   * Logic: Filters for words that are TitleCased (starting with A-Z, followed by a-z)
   * and are longer than 3 characters.
   */
  private async extractConcepts(data: LearningData): Promise<string[]> {
    const text = `${data.context} ${data.response}`;
    const words = this.splitTextRobustly(text);
    const concepts = words
      .filter(word => word.length > 3)
      .filter(word => /^[A-Z][a-z]+$/.test(word));
    return Array.from(new Set(concepts));
  }

  private splitTextRobustly(text: string): string[] {
    return text.split(/\s+/).filter(word => word.length > 0);
  }

  /**
   * Upserts or updates a single concept node in the database using Prisma.
   */
  private async updateConcepts(concepts: string[], data: LearningData): Promise<void> {
    const now = new Date();
    const oecsScore = data.oecsScore;

    try {
      await Promise.all(concepts.map(async concept => {
        await db.concept.upsert({
          where: { name: concept },
          update: {
            frequency: { increment: 1 },
            lastSeen: now,
            confidence: oecsScore,
          },
          create: {
            name: concept,
            frequency: 1,
            confidence: oecsScore,
            firstSeen: now,
            lastSeen: now,
            semanticTags: JSON.stringify([]),
          }
        });
      }));
    } catch (error) {
      this.logger.error(`Error updating concepts:`, error);
    }
  }
}