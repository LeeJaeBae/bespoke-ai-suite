/**
 * Weaviate RAG Service Implementation
 * Infrastructure Layer - External Service Integration
 * 
 * Implements RAG Service using Weaviate vector database
 */

import { FastifyBaseLogger } from 'fastify';
import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import {
  RAGService,
  RAGDocument,
  RAGSearchQuery,
  RAGSearchResult,
  RAGContext,
  DocumentProcessingConfig,
  CollectionStats,
  RAGConfig
} from '../../application/interfaces/RAGService.js';
import { Document } from '../../domain/entities/Document.js';
import { Embedding } from '../../domain/value-objects/Embedding.js';
import { ChunkMetadata } from '../../domain/value-objects/ChunkMetadata.js';

export class WeaviateRAGService implements RAGService {
  private client: WeaviateClient;
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;
  private logger: FastifyBaseLogger;
  private config: RAGConfig;
  private collectionName: string;
  private initialized: boolean = false;

  constructor(config: RAGConfig, logger: FastifyBaseLogger) {
    this.config = config;
    this.logger = logger;
    this.collectionName = config.collection.name || 'ContentDocuments';

    // Initialize Weaviate client
    this.client = weaviate.client({
      scheme: config.weaviate.scheme || 'http',
      host: config.weaviate.host || 'localhost:8080',
      apiKey: config.weaviate.apiKey ? new ApiKey(config.weaviate.apiKey) : undefined,
      headers: config.weaviate.headers || {}
    });

    // Initialize OpenAI embeddings
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.model || 'text-embedding-3-small',
      dimensions: config.openai.dimensions || 1536
    });

    // Initialize text splitter
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.processing.chunkSize || 512,
      chunkOverlap: config.processing.chunkOverlap || 50,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });
  }

  /**
   * Initialize the vector database collection
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Weaviate RAG service...');

      // Check if collection exists
      const schemaExists = await this.collectionExists();
      
      if (!schemaExists) {
        // Create collection schema
        await this.createCollection();
        this.logger.info(`Collection ${this.collectionName} created`);
      } else {
        this.logger.info(`Collection ${this.collectionName} already exists`);
      }

      this.initialized = true;
      this.logger.info('Weaviate RAG service initialized successfully');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize Weaviate RAG service');
      throw new Error(`RAG initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a document to the vector database
   */
  async addDocument(document: RAGDocument): Promise<string> {
    this.ensureInitialized();

    try {
      // Generate embedding if not provided
      if (!document.embedding) {
        document.embedding = await this.generateEmbedding(document.content);
      }

      // Create Weaviate object
      const result = await this.client
        .data
        .creator()
        .withClassName(this.collectionName)
        .withProperties({
          content: document.content,
          title: document.metadata.title || '',
          type: document.metadata.type || '',
          source: document.metadata.source || '',
          author: document.metadata.author || '',
          contentId: document.metadata.contentId || '',
          tags: document.metadata.tags || [],
          chunkIndex: document.metadata.chunkIndex || 0,
          totalChunks: document.metadata.totalChunks || 1,
          createdAt: document.metadata.createdAt || new Date()
        })
        .withVector(document.embedding)
        .do();

      this.logger.info({ id: result.id }, 'Document added to Weaviate');
      return result.id || '';
    } catch (error) {
      this.logger.error({ error }, 'Failed to add document');
      throw new Error(`Failed to add document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add multiple documents in batch
   */
  async addDocuments(documents: RAGDocument[]): Promise<string[]> {
    this.ensureInitialized();

    try {
      const ids: string[] = [];
      const batchSize = 100;

      // Process in batches
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const objects = [];

        for (const doc of batch) {
          // Generate embedding if not provided
          if (!doc.embedding) {
            doc.embedding = await this.generateEmbedding(doc.content);
          }

          objects.push({
            class: this.collectionName,
            properties: {
              content: doc.content,
              title: doc.metadata.title || '',
              type: doc.metadata.type || '',
              source: doc.metadata.source || '',
              author: doc.metadata.author || '',
              contentId: doc.metadata.contentId || '',
              tags: doc.metadata.tags || [],
              chunkIndex: doc.metadata.chunkIndex || 0,
              totalChunks: doc.metadata.totalChunks || 1,
              createdAt: doc.metadata.createdAt || new Date()
            },
            vector: doc.embedding
          });
        }

        // Batch import
        const results = await this.client
          .batch
          .objectsBatcher()
          .withObjects(...objects)
          .do();

        results.forEach(result => {
          if (result.id) {
            ids.push(result.id);
          }
        });

        this.logger.info({ count: batch.length }, 'Batch of documents added');
      }

      return ids;
    } catch (error) {
      this.logger.error({ error }, 'Failed to add documents batch');
      throw new Error(`Failed to add documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(id: string, document: Partial<RAGDocument>): Promise<void> {
    this.ensureInitialized();

    try {
      const properties: any = {};

      if (document.content !== undefined) {
        properties.content = document.content;
        // Regenerate embedding if content changed
        if (!document.embedding) {
          document.embedding = await this.generateEmbedding(document.content);
        }
      }

      if (document.metadata) {
        if (document.metadata.title !== undefined) properties.title = document.metadata.title;
        if (document.metadata.type !== undefined) properties.type = document.metadata.type;
        if (document.metadata.source !== undefined) properties.source = document.metadata.source;
        if (document.metadata.author !== undefined) properties.author = document.metadata.author;
        if (document.metadata.tags !== undefined) properties.tags = document.metadata.tags;
      }

      // Update the document
      await this.client
        .data
        .updater()
        .withId(id)
        .withClassName(this.collectionName)
        .withProperties(properties)
        .withVector(document.embedding)
        .do();

      this.logger.info({ id }, 'Document updated');
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to update document');
      throw new Error(`Failed to update document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a document from the vector database
   */
  async deleteDocument(id: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.client
        .data
        .deleter()
        .withClassName(this.collectionName)
        .withId(id)
        .do();

      this.logger.info({ id }, 'Document deleted');
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to delete document');
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for similar documents
   */
  async search(query: RAGSearchQuery): Promise<RAGSearchResult[]> {
    this.ensureInitialized();

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query.query);

      // Build where filter
      let whereFilter = undefined;
      if (query.filter) {
        const conditions = [];

        if (query.filter.type) {
          conditions.push({
            path: ['type'],
            operator: 'Equal',
            valueText: query.filter.type
          });
        }

        if (query.filter.author) {
          conditions.push({
            path: ['author'],
            operator: 'Equal',
            valueText: query.filter.author
          });
        }

        if (query.filter.tags && query.filter.tags.length > 0) {
          conditions.push({
            path: ['tags'],
            operator: 'ContainsAny',
            valueTextArray: query.filter.tags
          });
        }

        if (conditions.length > 0) {
          whereFilter = conditions.length === 1 ? conditions[0] : {
            operator: 'And',
            operands: conditions
          };
        }
      }

      // Perform search
      const searchBuilder = this.client
        .graphql
        .get()
        .withClassName(this.collectionName)
        .withFields('_additional { id distance certainty } content title type source author tags contentId chunkIndex totalChunks')
        .withNearVector({ vector: queryEmbedding })
        .withLimit(query.limit || 10);

      if (whereFilter) {
        searchBuilder.withWhere(whereFilter);
      }

      const result = await searchBuilder.do();

      // Transform results
      const searchResults: RAGSearchResult[] = [];
      const objects = result.data.Get[this.collectionName] || [];

      for (const obj of objects) {
        searchResults.push({
          document: {
            id: obj._additional.id,
            content: obj.content,
            metadata: {
              title: obj.title,
              type: obj.type,
              source: obj.source,
              author: obj.author,
              tags: obj.tags || [],
              contentId: obj.contentId,
              chunkIndex: obj.chunkIndex,
              totalChunks: obj.totalChunks
            }
          },
          score: obj._additional.certainty || 0,
          distance: obj._additional.distance || 0
        });
      }

      this.logger.info({ count: searchResults.length }, 'Search completed');
      return searchResults;
    } catch (error) {
      this.logger.error({ error }, 'Search failed');
      throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<RAGDocument | null> {
    this.ensureInitialized();

    try {
      const result = await this.client
        .data
        .getterById()
        .withId(id)
        .withClassName(this.collectionName)
        .do();

      if (!result) {
        return null;
      }

      return {
        id: result.id || id,
        content: result.properties.content,
        metadata: {
          title: result.properties.title,
          type: result.properties.type,
          source: result.properties.source,
          author: result.properties.author,
          tags: result.properties.tags || [],
          contentId: result.properties.contentId,
          chunkIndex: result.properties.chunkIndex,
          totalChunks: result.properties.totalChunks,
          createdAt: result.properties.createdAt
        }
      };
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to get document');
      return null;
    }
  }

  /**
   * Process and chunk a large document
   */
  async processDocument(
    content: string,
    metadata: RAGDocument['metadata'],
    config?: Partial<DocumentProcessingConfig>
  ): Promise<RAGDocument[]> {
    try {
      // Configure splitter
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: config?.chunkSize || this.config.processing.chunkSize,
        chunkOverlap: config?.chunkOverlap || this.config.processing.chunkOverlap
      });

      // Split content
      const chunks = await splitter.splitText(content);
      const documents: RAGDocument[] = [];

      // Create documents for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await this.generateEmbedding(chunks[i]);
        
        documents.push({
          id: `${metadata.contentId || 'doc'}_chunk_${i}`,
          content: chunks[i],
          metadata: {
            ...metadata,
            chunkIndex: i,
            totalChunks: chunks.length
          },
          embedding
        });
      }

      this.logger.info({ count: documents.length }, 'Document processed into chunks');
      return documents;
    } catch (error) {
      this.logger.error({ error }, 'Failed to process document');
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      this.logger.error({ error }, 'Failed to generate embedding');
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build context from search results for LLM
   */
  async buildContext(
    query: string,
    searchResults: RAGSearchResult[]
  ): Promise<RAGContext> {
    try {
      // Sort by relevance score
      const sortedResults = searchResults.sort((a, b) => b.score - a.score);

      // Extract documents
      const retrievedDocuments = sortedResults.map(r => r.document);

      // Build context summary
      const contextParts = sortedResults.map((result, index) => {
        const doc = result.document;
        const source = doc.metadata.source || 'Unknown';
        return `[${index + 1}] (Score: ${result.score.toFixed(2)}) Source: ${source}\n${doc.content}`;
      });

      const summary = contextParts.join('\n\n---\n\n');

      // Extract key insights
      const insights = sortedResults
        .slice(0, 3)
        .map(r => r.document.content.substring(0, 200) + '...');

      return {
        query,
        retrievedDocuments,
        summary,
        relevantInsights: insights
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to build context');
      throw new Error(`Failed to build context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<CollectionStats> {
    this.ensureInitialized();

    try {
      const aggregate = await this.client
        .graphql
        .aggregate()
        .withClassName(this.collectionName)
        .withFields('meta { count }')
        .do();

      const count = aggregate.data.Aggregate[this.collectionName]?.[0]?.meta?.count || 0;

      return {
        documentCount: count,
        vectorCount: count,
        indexStatus: 'ready',
        lastUpdated: new Date()
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to get stats');
      throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clear all documents from collection
   */
  async clearCollection(): Promise<void> {
    this.ensureInitialized();

    try {
      await this.client
        .batch
        .objectsBatchDeleter()
        .withClassName(this.collectionName)
        .withWhere({
          path: ['id'],
          operator: 'Like',
          valueText: '*'
        })
        .do();

      this.logger.info('Collection cleared');
    } catch (error) {
      this.logger.error({ error }, 'Failed to clear collection');
      throw new Error(`Failed to clear collection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reindex the entire collection
   */
  async reindex(): Promise<void> {
    this.ensureInitialized();

    try {
      // Weaviate handles indexing automatically
      // This is a placeholder for any custom reindexing logic
      this.logger.info('Reindexing triggered (handled by Weaviate)');
    } catch (error) {
      this.logger.error({ error }, 'Failed to reindex');
      throw new Error(`Failed to reindex: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('RAG service not initialized. Call initialize() first.');
    }
  }

  private async collectionExists(): Promise<boolean> {
    try {
      const schema = await this.client.schema.getter().do();
      return schema.classes?.some(c => c.class === this.collectionName) || false;
    } catch (error) {
      return false;
    }
  }

  private async createCollection(): Promise<void> {
    const schemaConfig = {
      class: this.collectionName,
      vectorizer: 'none', // We provide our own vectors
      vectorIndexType: this.config.collection.vectorIndexType || 'hnsw',
      vectorIndexConfig: {
        distance: this.config.collection.distance || 'cosine'
      },
      properties: [
        {
          name: 'content',
          dataType: ['text'],
          description: 'The main content of the document'
        },
        {
          name: 'title',
          dataType: ['string'],
          description: 'Document title'
        },
        {
          name: 'type',
          dataType: ['string'],
          description: 'Content type'
        },
        {
          name: 'source',
          dataType: ['string'],
          description: 'Source of the document'
        },
        {
          name: 'author',
          dataType: ['string'],
          description: 'Author of the document'
        },
        {
          name: 'contentId',
          dataType: ['string'],
          description: 'Original content ID'
        },
        {
          name: 'tags',
          dataType: ['string[]'],
          description: 'Document tags'
        },
        {
          name: 'chunkIndex',
          dataType: ['int'],
          description: 'Index of the chunk'
        },
        {
          name: 'totalChunks',
          dataType: ['int'],
          description: 'Total number of chunks'
        },
        {
          name: 'createdAt',
          dataType: ['date'],
          description: 'Creation timestamp'
        }
      ]
    };

    await this.client.schema.classCreator().withClass(schemaConfig).do();
  }
}