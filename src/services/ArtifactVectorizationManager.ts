import { IndexingStrategy, ArtifactMetadata } from '../types/ArtifactTypes';
import { EmbeddingService } from './EmbeddingService';
import { VectorDBClient } from '../data/VectorDBClient';

/**
 * Manages the transformation, insertion, and querying of artifact content
 * into the vector store based on the defined ArtifactIndexingPolicy.
 * This service is critical for enabling semantic search across the artifact history.
 */
export class ArtifactVectorizationManager {
  constructor(private embeddingService: EmbeddingService, private dbClient: VectorDBClient) {}

  public async indexArtifact(artifact: ArtifactMetadata, policy: IndexingStrategy): Promise<void> {
    if (!policy.vectorIndexing.enabled) {
      return;
    }

    const { embeddingModel, targetFields, vectorStoreAlias } = policy.vectorIndexing;
    
    const contentToEmbed = targetFields
      .map(field => artifact[field] || '')
      .join('\n\n---\n\n');

    if (!contentToEmbed) {
        console.warn(`Artifact ${artifact.id}: No content found for vector indexing.`);
        return;
    }

    const vector = await this.embeddingService.generateEmbedding(contentToEmbed, embeddingModel);

    await this.dbClient.insertVector({
      vector: vector,
      id: artifact.id,
      metadata: artifact.metadata, 
    }, vectorStoreAlias);

    console.log(`Artifact ${artifact.id} successfully vectorized using ${embeddingModel}.`);
  }

  public async semanticSearch(query: string, policy: IndexingStrategy, topK: number = 10): Promise<any[]> {
    if (!policy.vectorIndexing.enabled) {
      throw new Error("Vector indexing is disabled for this artifact type.");
    }

    const queryVector = await this.embeddingService.generateEmbedding(query, policy.vectorIndexing.embeddingModel);

    return this.dbClient.queryVectors(queryVector, policy.vectorIndexing.vectorStoreAlias, topK);
  }
}