import OpenAI from 'openai';
import type { LLMService, LLMConfig, LLMMessage, LLMResponse, LLMStreamResponse } from '../../application/interfaces/LLMService.js';
import type { FastifyBaseLogger } from 'fastify';

export class OpenAILLMService implements LLMService {
  private client: OpenAI;
  private config: LLMConfig;
  
  constructor(
    config: LLMConfig,
    private logger: FastifyBaseLogger
  ) {
    this.config = {
      ...config,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4000,
      timeout: config.timeout ?? 30000
    };
    
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
      maxRetries: 3
    });
  }
  
  async complete(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const mergedConfig = { ...this.config, ...config };
    
    try {
      const completion = await this.client.chat.completions.create({
        model: mergedConfig.model,
        messages: messages as any,
        temperature: mergedConfig.temperature,
        max_tokens: mergedConfig.maxTokens
      });
      
      const choice = completion.choices[0];
      
      return {
        content: choice.message.content || '',
        model: completion.model,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined,
        finishReason: choice.finish_reason || undefined
      };
    } catch (error) {
      this.logger.error('OpenAI API error:', error);
      throw new Error(`OpenAI API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async streamComplete(
    messages: LLMMessage[],
    onChunk: (chunk: LLMStreamResponse) => void,
    config?: Partial<LLMConfig>
  ): Promise<void> {
    const mergedConfig = { ...this.config, ...config };
    
    try {
      const stream = await this.client.chat.completions.create({
        model: mergedConfig.model,
        messages: messages as any,
        temperature: mergedConfig.temperature,
        max_tokens: mergedConfig.maxTokens,
        stream: true
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onChunk({ chunk: content, done: false });
        }
        
        if (chunk.choices[0]?.finish_reason) {
          onChunk({ chunk: '', done: true });
        }
      }
    } catch (error) {
      this.logger.error('OpenAI streaming error:', error);
      throw new Error(`OpenAI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const models = await this.client.models.list();
      return models.data.length > 0;
    } catch {
      return false;
    }
  }
  
  getProvider(): string {
    return 'openai';
  }
  
  estimateCost(promptTokens: number, completionTokens: number): number {
    // OpenAI pricing (approximate)
    const model = this.config.model.toLowerCase();
    let promptPrice = 0;
    let completionPrice = 0;
    
    if (model.includes('gpt-4-turbo') || model.includes('gpt-4-1106')) {
      promptPrice = 0.01 / 1000; // $10 per 1M tokens
      completionPrice = 0.03 / 1000; // $30 per 1M tokens
    } else if (model.includes('gpt-4')) {
      promptPrice = 0.03 / 1000; // $30 per 1M tokens
      completionPrice = 0.06 / 1000; // $60 per 1M tokens
    } else if (model.includes('gpt-3.5-turbo')) {
      promptPrice = 0.0005 / 1000; // $0.50 per 1M tokens
      completionPrice = 0.0015 / 1000; // $1.50 per 1M tokens
    }
    
    return (promptTokens * promptPrice) + (completionTokens * completionPrice);
  }
}