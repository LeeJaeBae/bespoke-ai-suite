import axios, { AxiosInstance } from 'axios';
import type { LLMService, LLMConfig, LLMMessage, LLMResponse, LLMStreamResponse } from '../../application/interfaces/LLMService.js';
import type { FastifyBaseLogger } from 'fastify';

export class ClaudeLLMService implements LLMService {
  private client: AxiosInstance;
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
    
    this.client = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': this.config.apiKey || ''
      },
      timeout: this.config.timeout
    });
  }
  
  async complete(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const mergedConfig = { ...this.config, ...config };
    
    try {
      const systemMessage = messages.find(m => m.role === 'system');
      const otherMessages = messages.filter(m => m.role !== 'system');
      
      const response = await this.client.post('/messages', {
        model: mergedConfig.model,
        messages: otherMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        system: systemMessage?.content,
        max_tokens: mergedConfig.maxTokens,
        temperature: mergedConfig.temperature
      });
      
      const data = response.data;
      
      return {
        content: data.content[0].text,
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        },
        finishReason: data.stop_reason
      };
    } catch (error) {
      this.logger.error('Claude API error:', error);
      throw new Error(`Claude API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async streamComplete(
    messages: LLMMessage[],
    onChunk: (chunk: LLMStreamResponse) => void,
    config?: Partial<LLMConfig>
  ): Promise<void> {
    const mergedConfig = { ...this.config, ...config };
    
    try {
      const systemMessage = messages.find(m => m.role === 'system');
      const otherMessages = messages.filter(m => m.role !== 'system');
      
      const response = await this.client.post('/messages', {
        model: mergedConfig.model,
        messages: otherMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        system: systemMessage?.content,
        max_tokens: mergedConfig.maxTokens,
        temperature: mergedConfig.temperature,
        stream: true
      }, {
        responseType: 'stream'
      });
      
      const stream = response.data;
      let buffer = '';
      
      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onChunk({ chunk: '', done: true });
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.delta?.text) {
                onChunk({ chunk: parsed.delta.text, done: false });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      });
      
      return new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error('Claude streaming error:', error);
      throw new Error(`Claude streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/models', {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
  
  getProvider(): string {
    return 'claude';
  }
  
  estimateCost(promptTokens: number, completionTokens: number): number {
    // Claude pricing (approximate)
    const model = this.config.model.toLowerCase();
    let promptPrice = 0;
    let completionPrice = 0;
    
    if (model.includes('claude-3-opus')) {
      promptPrice = 0.015 / 1000; // $15 per 1M tokens
      completionPrice = 0.075 / 1000; // $75 per 1M tokens
    } else if (model.includes('claude-3-sonnet')) {
      promptPrice = 0.003 / 1000; // $3 per 1M tokens
      completionPrice = 0.015 / 1000; // $15 per 1M tokens
    } else if (model.includes('claude-3-haiku')) {
      promptPrice = 0.00025 / 1000; // $0.25 per 1M tokens
      completionPrice = 0.00125 / 1000; // $1.25 per 1M tokens
    }
    
    return (promptTokens * promptPrice) + (completionTokens * completionPrice);
  }
}