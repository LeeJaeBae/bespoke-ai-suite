/**
 * RAG (Retrieval-Augmented Generation) Service Interface
 * Clean Architecture - Application Layer
 * 
 * Defines the contract for vector database and document retrieval operations
 * Following Dependency Inversion Principle
 */

import { ContentType } from '../../domain/value-objects/ContentType.js';

/**
 * Document representation for RAG system
 */
export interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    title?: string;
    type?: ContentType;
    source?: string;
    createdAt?: Date;
    tags?: string[];
    author?: string;
    contentId?: string;
    chunkIndex?: number;
    totalChunks?: number;
  };
  embedding?: number[];
}

/**
 * Search query for RAG retrieval
 */
export interface RAGSearchQuery {
  query: string;
  limit?: number;
  filter?: {
    type?: ContentType;
    tags?: string[];
    dateRange?: {
      from?: Date;
      to?: Date;
    };
    author?: string;
  };
  hybridSearch?: boolean;  // Combine vector + keyword search
  alpha?: number;          // Weight for hybrid search (0-1)
}

/**
 * Search result from RAG system
 */
export interface RAGSearchResult {
  document: RAGDocument;
  score: number;
  distance?: number;
  explanation?: string;
}

/**
 * Context for content generation
 */
export interface RAGContext {
  query: string;
  retrievedDocuments: RAGDocument[];
  summary?: string;
  relevantInsights?: string[];
}

/**
 * Configuration for document processing
 */
export interface DocumentProcessingConfig {
  chunkSize: number;         // Default: 512 tokens
  chunkOverlap: number;      // Default: 50 tokens
  embeddingModel: string;    // Default: 'text-embedding-3-small'
  dimensions?: number;       // Default: 1536 for OpenAI
}

/**
 * Collection statistics
 */
export interface CollectionStats {
  documentCount: number;
  vectorCount: number;
  indexStatus: 'ready' | 'building' | 'error';
  lastUpdated: Date;
  storageSize?: number;
}

/**
 * RAG Service - Main interface for vector operations
 */
export interface RAGService {
  /**
   * Initialize the vector database collection
   */
  initialize(): Promise<void>;

  /**
   * Add a document to the vector database
   */
  addDocument(document: RAGDocument): Promise<string>;

  /**
   * Add multiple documents in batch
   */
  addDocuments(documents: RAGDocument[]): Promise<string[]>;

  /**
   * Update an existing document
   */
  updateDocument(id: string, document: Partial<RAGDocument>): Promise<void>;

  /**
   * Delete a document from the vector database
   */
  deleteDocument(id: string): Promise<void>;

  /**
   * Search for similar documents
   */
  search(query: RAGSearchQuery): Promise<RAGSearchResult[]>;

  /**
   * Get document by ID
   */
  getDocument(id: string): Promise<RAGDocument | null>;

  /**
   * Process and chunk a large document
   */
  processDocument(
    content: string,
    metadata: RAGDocument['metadata'],
    config?: Partial<DocumentProcessingConfig>
  ): Promise<RAGDocument[]>;

  /**
   * Generate embeddings for text
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Build context from search results for LLM
   */
  buildContext(
    query: string,
    searchResults: RAGSearchResult[]
  ): Promise<RAGContext>;

  /**
   * Get collection statistics
   */
  getStats(): Promise<CollectionStats>;

  /**
   * Clear all documents from collection
   */
  clearCollection(): Promise<void>;

  /**
   * Reindex the entire collection
   */
  reindex(): Promise<void>;
}

/**
 * Configuration for RAG service
 */
export interface RAGConfig {
  weaviate: {
    scheme: string;
    host: string;
    port?: number;
    apiKey?: string;
    headers?: Record<string, string>;
  };
  openai: {
    apiKey: string;
    model?: string;
    dimensions?: number;
  };
  collection: {
    name: string;
    vectorIndexType?: string;
    distance?: 'cosine' | 'euclidean' | 'manhattan';
  };
  processing: DocumentProcessingConfig;
}