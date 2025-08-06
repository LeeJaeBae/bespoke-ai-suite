/**
 * Document Entity
 * Domain Layer - Following DDD principles
 * 
 * Represents a document in the RAG system
 */

import { nanoid } from 'nanoid';
import { ContentType } from '../value-objects/ContentType.js';
import { Embedding } from '../value-objects/Embedding.js';
import { ChunkMetadata } from '../value-objects/ChunkMetadata.js';

export interface DocumentProps {
  id?: string;
  content: string;
  embedding?: Embedding;
  title?: string;
  type?: ContentType;
  source?: string;
  author?: string;
  contentId?: string;
  chunkMetadata?: ChunkMetadata;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Document {
  private readonly id: string;
  private content: string;
  private embedding?: Embedding;
  private readonly metadata: {
    title?: string;
    type?: ContentType;
    source?: string;
    author?: string;
    contentId?: string;
    tags: string[];
  };
  private chunkMetadata?: ChunkMetadata;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: DocumentProps) {
    this.id = props.id || nanoid();
    this.content = props.content;
    this.embedding = props.embedding;
    this.metadata = {
      title: props.title,
      type: props.type,
      source: props.source,
      author: props.author,
      contentId: props.contentId,
      tags: props.tags || []
    };
    this.chunkMetadata = props.chunkMetadata;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * Create a new document
   */
  static create(props: DocumentProps): Document {
    // Validate content
    if (!props.content || props.content.trim().length === 0) {
      throw new Error('Document content cannot be empty');
    }

    // Validate content length
    if (props.content.length > 100000) {
      throw new Error('Document content exceeds maximum length of 100,000 characters');
    }

    return new Document(props);
  }

  /**
   * Create document from chunk
   */
  static createFromChunk(
    content: string,
    parentId: string,
    chunkIndex: number,
    totalChunks: number,
    metadata?: Partial<DocumentProps>
  ): Document {
    const chunkMetadata = ChunkMetadata.create({
      parentId,
      chunkIndex,
      totalChunks,
      startPosition: 0, // Will be calculated by the chunking algorithm
      endPosition: content.length
    });

    return new Document({
      ...metadata,
      content,
      chunkMetadata,
      contentId: parentId
    });
  }

  /**
   * Update embedding
   */
  updateEmbedding(embedding: Embedding): void {
    this.embedding = embedding;
    this.updatedAt = new Date();
  }

  /**
   * Update content
   */
  updateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Document content cannot be empty');
    }
    
    this.content = content;
    this.embedding = undefined; // Clear embedding as content changed
    this.updatedAt = new Date();
  }

  /**
   * Add tags
   */
  addTags(tags: string[]): void {
    const uniqueTags = new Set([...this.metadata.tags, ...tags]);
    this.metadata.tags = Array.from(uniqueTags);
    this.updatedAt = new Date();
  }

  /**
   * Remove tags
   */
  removeTags(tags: string[]): void {
    this.metadata.tags = this.metadata.tags.filter(tag => !tags.includes(tag));
    this.updatedAt = new Date();
  }

  /**
   * Check if document is a chunk
   */
  isChunk(): boolean {
    return this.chunkMetadata !== undefined;
  }

  /**
   * Check if document has embedding
   */
  hasEmbedding(): boolean {
    return this.embedding !== undefined;
  }

  /**
   * Calculate content hash for deduplication
   */
  getContentHash(): string {
    // Simple hash for demo - in production use proper hashing
    return Buffer.from(this.content).toString('base64').substring(0, 16);
  }

  /**
   * Get word count
   */
  getWordCount(): number {
    return this.content.trim().split(/\s+/).length;
  }

  /**
   * Get estimated tokens (rough approximation)
   */
  getEstimatedTokens(): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(this.content.length / 4);
  }

  /**
   * Check if document needs chunking
   */
  needsChunking(maxTokens: number = 512): boolean {
    return this.getEstimatedTokens() > maxTokens;
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getContent(): string {
    return this.content;
  }

  getEmbedding(): Embedding | undefined {
    return this.embedding;
  }

  getTitle(): string | undefined {
    return this.metadata.title;
  }

  getType(): ContentType | undefined {
    return this.metadata.type;
  }

  getSource(): string | undefined {
    return this.metadata.source;
  }

  getAuthor(): string | undefined {
    return this.metadata.author;
  }

  getContentId(): string | undefined {
    return this.metadata.contentId;
  }

  getTags(): string[] {
    return [...this.metadata.tags];
  }

  getChunkMetadata(): ChunkMetadata | undefined {
    return this.chunkMetadata;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Convert to plain object
   */
  toObject(): DocumentProps {
    return {
      id: this.id,
      content: this.content,
      embedding: this.embedding,
      title: this.metadata.title,
      type: this.metadata.type,
      source: this.metadata.source,
      author: this.metadata.author,
      contentId: this.metadata.contentId,
      chunkMetadata: this.chunkMetadata,
      tags: [...this.metadata.tags],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}