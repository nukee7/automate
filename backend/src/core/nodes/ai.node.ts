import { BaseNode } from './base.node';
import { GoogleGenAI } from '@google/genai';
import { resolveExpressions } from '../expressions/resolver';

export class AINode implements BaseNode {
  private client: GoogleGenAI;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found');
    }

    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async run(context: any, config: any): Promise<string> {
    try {
      const input = this.resolveInput(context, config);

      context.logs.push('AI Node: Calling Gemini v1');

      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: input,
      });

      const text = response.text;

if (!text) {
  throw new Error('Gemini returned empty response');
}

return text;

    } catch (error: any) {
      context.logs.push(`AI Node Error: ${error.message}`);
      throw new Error(`Gemini execution failed: ${error.message}`);
    }
  }

  private resolveInput(context: any, config: any): string {
    if (config.prompt) {
      return resolveExpressions(config.prompt, context.data);
    }

    if (config.inputNodeId) {
      return context.data[config.inputNodeId];
    }

    throw new Error('AI Node: No input source');
  }
}