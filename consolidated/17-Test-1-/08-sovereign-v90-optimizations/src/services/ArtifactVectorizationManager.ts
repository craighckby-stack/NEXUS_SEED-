import { IndexingStrategy, ArtifactMetadata } from '../types/ArtifactTypes';
import { EmbeddingService } from './EmbeddingService';
import { VectorDBClient } from '../data/VectorDBClient';
import { CanonicalErrorFactory } from '../core/CanonicalErrorFactory';
import { SecurePluginExecutorUtility } from '../core/SecurePluginExecutorUtility';

// Constants for the capability registration
const ARTIFACT_TRANSFORMER_REGISTRY = 'ArtifactTransformer';
const AGGREGATE_CONTENT_CAPABILITY = 'aggregateContent';

/**
 * Manages the transformation, insertion, and querying of artifact content
 * into the vector store based on the defined ArtifactIndexingPolicy.
 * This service is critical for enabling semantic search across the artifact history.
 */
export class ArtifactVectorizationManager {

  constructor(
    private embeddingService: EmbeddingService, 
    private dbClient: VectorDBClient,
    private errorFactory: CanonicalErrorFactory,
    private pluginExecutor: SecurePluginExecutorUtility
  ) {
    // Manual plugin simulation removed; dependencies injected for secure execution.
  }

  public async indexArtifact(artifact: ArtifactMetadata, policy: IndexingStrategy): Promise<void> {
    if (!policy.vectorIndexing.enabled) {
      return;
    }

    const { embeddingModel, targetFields, vectorStoreAlias } = policy.vectorIndexing;
    
    let contentToEmbed: string;
    
    try {
        // Use SecurePluginExecutorUtility for centralized, validated, and secure capability execution
        contentToEmbed = await this.pluginExecutor.executeCapability<string>({
            registryName: ARTIFACT_TRANSFORMER_REGISTRY,
            capabilityName: AGGREGATE_CONTENT_CAPABILITY,
            args: {
                artifact: artifact,
                targetFields: targetFields,
                separator: '\n\n---\n\n' 
            },
        });
    } catch (e) {
        // Catch execution failures (including configuration/validation errors handled by the utility)
        // Log canonically (TELEMETRY_TRANSFORMATION_FAILURE) and fail-securely.
        this.errorFactory.create(
            'TELEMETRY_TRANSFORMATION_FAILURE', 
            `Failed to aggregate content for artifact ${artifact.id}. Skipping vectorization.`,
            { artifactId: artifact.id, error: e }
        ).report();
        return;
    }

    if (!contentToEmbed) {
        console.warn(`Artifact ${artifact.id}: No meaningful content found for vector indexing.`);
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