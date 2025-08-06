/**
 * LLM Service Interface
 * Application Layer - Port Interface for LLM integrations
 */

export interface LLMConfig {
  provider: 'claude' | 'openai' | 'local';
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface LLMStreamResponse {
  chunk: string;
  done: boolean;
}

export interface LLMService {
  /**
   * Generate completion from messages
   */
  complete(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse>;
  
  /**
   * Stream completion response
   */
  streamComplete(
    messages: LLMMessage[], 
    onChunk: (chunk: LLMStreamResponse) => void,
    config?: Partial<LLMConfig>
  ): Promise<void>;
  
  /**
   * Check if service is available
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get provider name
   */
  getProvider(): string;
  
  /**
   * Calculate estimated cost
   */
  estimateCost(promptTokens: number, completionTokens: number): number;
}