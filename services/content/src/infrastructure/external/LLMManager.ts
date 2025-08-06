import type { LLMService, LLMConfig, LLMMessage, LLMResponse } from '../../application/interfaces/LLMService.js';
import { ClaudeLLMService } from './ClaudeLLMService.js';
import { OpenAILLMService } from './OpenAILLMService.js';
import type { FastifyBaseLogger } from 'fastify';

export interface LLMManagerConfig {
  primary: LLMConfig;
  fallback?: LLMConfig;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * LLM Manager with fallback strategy
 * Infrastructure Layer - Manages multiple LLM providers
 */
export class LLMManager implements LLMService {
  private primaryService: LLMService;
  private fallbackService?: LLMService;
  private retryAttempts: number;
  private retryDelay: number;
  
  constructor(
    config: LLMManagerConfig,
    private logger: FastifyBaseLogger
  ) {
    this.retryAttempts = config.retryAttempts ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    
    // Initialize primary service
    this.primaryService = this.createService(config.primary);
    
    // Initialize fallback service if configured
    if (config.fallback) {
      this.fallbackService = this.createService(config.fallback);
    }
    
    this.logger.info(`LLM Manager initialized with primary: ${config.primary.provider}${
      config.fallback ? `, fallback: ${config.fallback.provider}` : ''
    }`);
  }
  
  private createService(config: LLMConfig): LLMService {
    switch (config.provider) {
      case 'claude':
        return new ClaudeLLMService(config, this.logger);
      case 'openai':
        return new OpenAILLMService(config, this.logger);
      default:
        throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
  }
  
  async complete(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    // Try primary service first
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        this.logger.debug(`Attempting primary LLM (attempt ${attempt}/${this.retryAttempts})`);
        const response = await this.primaryService.complete(messages, config);
        
        // Log token usage and cost
        if (response.usage) {
          const cost = this.primaryService.estimateCost(
            response.usage.promptTokens,
            response.usage.completionTokens
          );
          this.logger.info(`LLM completion successful`, {
            provider: this.primaryService.getProvider(),
            model: response.model,
            tokens: response.usage.totalTokens,
            estimatedCost: cost.toFixed(4)
          });
        }
        
        return response;
      } catch (error) {
        this.logger.warn(`Primary LLM attempt ${attempt} failed:`, error);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    // Try fallback service if available
    if (this.fallbackService) {
      this.logger.info('Switching to fallback LLM service');
      
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          const response = await this.fallbackService.complete(messages, config);
          
          if (response.usage) {
            const cost = this.fallbackService.estimateCost(
              response.usage.promptTokens,
              response.usage.completionTokens
            );
            this.logger.info(`Fallback LLM completion successful`, {
              provider: this.fallbackService.getProvider(),
              model: response.model,
              tokens: response.usage.totalTokens,
              estimatedCost: cost.toFixed(4)
            });
          }
          
          return response;
        } catch (error) {
          this.logger.warn(`Fallback LLM attempt ${attempt} failed:`, error);
          
          if (attempt < this.retryAttempts) {
            await this.delay(this.retryDelay * attempt);
          }
        }
      }
    }
    
    // All attempts failed
    throw new Error('All LLM services failed after retries');
  }
  
  async streamComplete(
    messages: LLMMessage[],
    onChunk: (chunk: import('../../application/interfaces/LLMService.js').LLMStreamResponse) => void,
    config?: Partial<LLMConfig>
  ): Promise<void> {
    try {
      await this.primaryService.streamComplete(messages, onChunk, config);
    } catch (error) {
      if (this.fallbackService) {
        this.logger.info('Primary streaming failed, trying fallback');
        await this.fallbackService.streamComplete(messages, onChunk, config);
      } else {
        throw error;
      }
    }
  }
  
  async isAvailable(): Promise<boolean> {
    const primaryAvailable = await this.primaryService.isAvailable();
    if (primaryAvailable) return true;
    
    if (this.fallbackService) {
      return await this.fallbackService.isAvailable();
    }
    
    return false;
  }
  
  getProvider(): string {
    return `manager(primary: ${this.primaryService.getProvider()}${
      this.fallbackService ? `, fallback: ${this.fallbackService.getProvider()}` : ''
    })`;
  }
  
  estimateCost(promptTokens: number, completionTokens: number): number {
    return this.primaryService.estimateCost(promptTokens, completionTokens);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}