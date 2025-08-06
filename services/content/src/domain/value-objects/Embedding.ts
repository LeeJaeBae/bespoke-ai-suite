/**
 * Embedding Value Object
 * Domain Layer - Following DDD principles
 */

export class Embedding {
  private readonly vector: number[];
  private readonly model: string;
  private readonly dimensions: number;

  private constructor(vector: number[], model: string) {
    this.vector = vector;
    this.model = model;
    this.dimensions = vector.length;
  }

  /**
   * Create an embedding
   */
  static create(vector: number[], model: string = 'text-embedding-3-small'): Embedding {
    // Validate vector
    if (!vector || vector.length === 0) {
      throw new Error('Embedding vector cannot be empty');
    }

    // Validate dimensions based on model
    const validDimensions: Record<string, number[]> = {
      'text-embedding-3-small': [1536],
      'text-embedding-3-large': [1024, 3072],
      'text-embedding-ada-002': [1536]
    };

    if (validDimensions[model] && !validDimensions[model].includes(vector.length)) {
      throw new Error(
        `Invalid embedding dimensions for model ${model}. Expected ${validDimensions[model].join(' or ')}, got ${vector.length}`
      );
    }

    // Validate vector values
    for (const value of vector) {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error('Embedding vector must contain only valid numbers');
      }
    }

    return new Embedding(vector, model);
  }

  /**
   * Calculate cosine similarity with another embedding
   */
  cosineSimilarity(other: Embedding): number {
    if (this.dimensions !== other.dimensions) {
      throw new Error('Cannot calculate similarity between embeddings of different dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < this.dimensions; i++) {
      dotProduct += this.vector[i] * other.vector[i];
      normA += this.vector[i] * this.vector[i];
      normB += other.vector[i] * other.vector[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Calculate Euclidean distance
   */
  euclideanDistance(other: Embedding): number {
    if (this.dimensions !== other.dimensions) {
      throw new Error('Cannot calculate distance between embeddings of different dimensions');
    }

    let sum = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const diff = this.vector[i] - other.vector[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Get normalized vector
   */
  normalize(): Embedding {
    let norm = 0;
    for (const value of this.vector) {
      norm += value * value;
    }
    norm = Math.sqrt(norm);

    if (norm === 0) {
      return new Embedding([...this.vector], this.model);
    }

    const normalized = this.vector.map(v => v / norm);
    return new Embedding(normalized, this.model);
  }

  getVector(): number[] {
    return [...this.vector];
  }

  getModel(): string {
    return this.model;
  }

  getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Check if two embeddings are equal
   */
  equals(other: Embedding): boolean {
    if (this.dimensions !== other.dimensions || this.model !== other.model) {
      return false;
    }

    for (let i = 0; i < this.dimensions; i++) {
      if (Math.abs(this.vector[i] - other.vector[i]) > 0.0001) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert to JSON
   */
  toJSON(): { vector: number[]; model: string; dimensions: number } {
    return {
      vector: [...this.vector],
      model: this.model,
      dimensions: this.dimensions
    };
  }
}