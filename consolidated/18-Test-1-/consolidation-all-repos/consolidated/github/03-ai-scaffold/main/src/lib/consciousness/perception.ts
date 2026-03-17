import { v4 as uuidv4 } from 'uuid';

// Define types
type CompressedPattern = {
  keyPatterns: string[];
  semanticTokens: string[];
  structuralSignature: string;
  confidence: number;
};

type FeatureVector = {
  features: string[];
  weights: number[];
  dimensions: number;
};

type InternalModel = {
  concepts: string[];
  features: FeatureVector;
  confidence: number;
  id: string;
  timestamp: number;
};

class PerceptionLayer {
  private static readonly MAX_FEATURES = 20;
  private static readonly MIN_CONFIDENCE = 0.05;

  async perceive(rawInput: string): Promise<InternalModel> {
    const startTime = Date.now();

    const compressed = await this.compressInput(rawInput);
    const features = await this.extractFeatures(compressed);
    const model = await this.buildInternalModel(features, compressed);
    const isValid = await this.validateModel(model);

    if (!isValid) {
      throw new Error('Invalid internal model generated');
    }

    model.id = uuidv4();
    model.timestamp = Date.now();
    return model;
  }

  private async compressInput(input: string): Promise<CompressedPattern> {
    const words = input.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();

    // Extract key patterns
    words.forEach(word => {
      const normalized = word.replace(/[^a-z0-9]/g, '');
      if (normalized.length > 3 && normalized.length <= 20) {
        wordFreq.set(normalized, (wordFreq.get(normalized) || 0) + 1);
      }
    });

    // Get top patterns
    const topPatterns = [...wordFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, PerceptionLayer.MAX_FEATURES)
      .map(([word]) => word);

    return {
      keyPatterns: topPatterns,
      semanticTokens: this.extractSemanticTokens(input),
      structuralSignature: this.calculateStructuralSignature(input),
      confidence: this.calculateConfidence(topPatterns)
    };
  }

  private async extractFeatures(pattern: CompressedPattern): Promise<FeatureVector> {
    const features: string[] = [];
    const weights: number[] = [];

    // Extract features from compressed patterns
    pattern.keyPatterns.forEach(word => {
      features.push(word);
      weights.push(pattern.confidence);
    });

    return {
      features,
      weights,
      dimensions: features.length
    };
  }

  private async buildInternalModel(
    features: FeatureVector,
    pattern: CompressedPattern
  ): Promise<InternalModel> {
    const concepts = features.features;

    return {
      concepts,
      features,
      confidence: pattern.confidence,
      timestamp: Date.now()
    };
  }

  private async validateModel(model: InternalModel): Promise<boolean> {
    // Basic validation
    return (
      model.concepts.length > 0 &&
      model.confidence > PerceptionLayer.MIN_CONFIDENCE &&
      model.features.dimensions > 0
    );
  }

  private extractSemanticTokens(input: string): string[] {
    return input.split(/[.,!?;:\s]+/).filter(t => t.length > 2);
  }

  private calculateStructuralSignature(input: string): string {
    const length = input.length;
    const words = input.split(/\s+/).length;
    const sentences = input.split(/[.!?]+/).length;
    return JSON.stringify({
      length,
      words,
      sentences,
      avgWordLength: length / (words || 1)
    });
  }

  private calculateConfidence(patterns: string[]): number {
    if (patterns.length === 0) return PerceptionLayer.MIN_CONFIDENCE;
    const avgFrequency = patterns.length / PerceptionLayer.MAX_FEATURES;
    return Math.min(1.0, avgFrequency);
  }
}
```

**