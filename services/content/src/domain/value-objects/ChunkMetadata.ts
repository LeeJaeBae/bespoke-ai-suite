/**
 * ChunkMetadata Value Object
 * Domain Layer - Following DDD principles
 * 
 * Represents metadata for document chunks in RAG system
 */

export interface ChunkMetadataProps {
  parentId: string;
  chunkIndex: number;
  totalChunks: number;
  startPosition: number;
  endPosition: number;
  overlapWithPrevious?: number;
  overlapWithNext?: number;
}

export class ChunkMetadata {
  private readonly parentId: string;
  private readonly chunkIndex: number;
  private readonly totalChunks: number;
  private readonly startPosition: number;
  private readonly endPosition: number;
  private readonly overlapWithPrevious: number;
  private readonly overlapWithNext: number;

  private constructor(props: ChunkMetadataProps) {
    this.parentId = props.parentId;
    this.chunkIndex = props.chunkIndex;
    this.totalChunks = props.totalChunks;
    this.startPosition = props.startPosition;
    this.endPosition = props.endPosition;
    this.overlapWithPrevious = props.overlapWithPrevious || 0;
    this.overlapWithNext = props.overlapWithNext || 0;
  }

  /**
   * Create chunk metadata
   */
  static create(props: ChunkMetadataProps): ChunkMetadata {
    // Validate parent ID
    if (!props.parentId || props.parentId.trim().length === 0) {
      throw new Error('Parent ID is required for chunk metadata');
    }

    // Validate chunk index
    if (props.chunkIndex < 0) {
      throw new Error('Chunk index must be non-negative');
    }

    // Validate total chunks
    if (props.totalChunks <= 0) {
      throw new Error('Total chunks must be positive');
    }

    // Validate chunk index against total
    if (props.chunkIndex >= props.totalChunks) {
      throw new Error('Chunk index must be less than total chunks');
    }

    // Validate positions
    if (props.startPosition < 0) {
      throw new Error('Start position must be non-negative');
    }

    if (props.endPosition <= props.startPosition) {
      throw new Error('End position must be greater than start position');
    }

    // Validate overlaps
    if (props.overlapWithPrevious && props.overlapWithPrevious < 0) {
      throw new Error('Overlap with previous chunk must be non-negative');
    }

    if (props.overlapWithNext && props.overlapWithNext < 0) {
      throw new Error('Overlap with next chunk must be non-negative');
    }

    return new ChunkMetadata(props);
  }

  /**
   * Check if this is the first chunk
   */
  isFirstChunk(): boolean {
    return this.chunkIndex === 0;
  }

  /**
   * Check if this is the last chunk
   */
  isLastChunk(): boolean {
    return this.chunkIndex === this.totalChunks - 1;
  }

  /**
   * Check if this is a middle chunk
   */
  isMiddleChunk(): boolean {
    return !this.isFirstChunk() && !this.isLastChunk();
  }

  /**
   * Get chunk length
   */
  getChunkLength(): number {
    return this.endPosition - this.startPosition;
  }

  /**
   * Get effective content length (excluding overlaps)
   */
  getEffectiveLength(): number {
    let length = this.getChunkLength();
    
    if (!this.isFirstChunk()) {
      length -= this.overlapWithPrevious;
    }
    
    if (!this.isLastChunk()) {
      length -= this.overlapWithNext;
    }
    
    return Math.max(0, length);
  }

  /**
   * Get chunk identifier
   */
  getChunkId(): string {
    return `${this.parentId}_chunk_${this.chunkIndex}`;
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    if (this.totalChunks === 1) {
      return 100;
    }
    return Math.round(((this.chunkIndex + 1) / this.totalChunks) * 100);
  }

  // Getters
  getParentId(): string {
    return this.parentId;
  }

  getChunkIndex(): number {
    return this.chunkIndex;
  }

  getTotalChunks(): number {
    return this.totalChunks;
  }

  getStartPosition(): number {
    return this.startPosition;
  }

  getEndPosition(): number {
    return this.endPosition;
  }

  getOverlapWithPrevious(): number {
    return this.overlapWithPrevious;
  }

  getOverlapWithNext(): number {
    return this.overlapWithNext;
  }

  /**
   * Check if two chunk metadata are equal
   */
  equals(other: ChunkMetadata): boolean {
    return (
      this.parentId === other.parentId &&
      this.chunkIndex === other.chunkIndex &&
      this.totalChunks === other.totalChunks &&
      this.startPosition === other.startPosition &&
      this.endPosition === other.endPosition
    );
  }

  /**
   * Convert to plain object
   */
  toObject(): ChunkMetadataProps {
    return {
      parentId: this.parentId,
      chunkIndex: this.chunkIndex,
      totalChunks: this.totalChunks,
      startPosition: this.startPosition,
      endPosition: this.endPosition,
      overlapWithPrevious: this.overlapWithPrevious,
      overlapWithNext: this.overlapWithNext
    };
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return `Chunk ${this.chunkIndex + 1}/${this.totalChunks} of ${this.parentId}`;
  }
}