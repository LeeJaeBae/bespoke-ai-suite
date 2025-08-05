import { AIGeneratedContent, GenerateContentRequest } from '../dto/ContentDTO.js';

export interface CrewAIService {
  generateContent(request: GenerateContentRequest): Promise<AIGeneratedContent>;
  improveContent(content: string, suggestions: string[]): Promise<string>;
  validateContent(content: string): Promise<{ isValid: boolean; issues: string[] }>;
  translateContent(content: string, targetLanguage: string): Promise<string>;
}

export interface CrewAIAgent {
  name: string;
  role: string;
  execute(input: any): Promise<any>;
}