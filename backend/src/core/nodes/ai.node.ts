import { BaseNode } from './base.node';
import { GoogleGenAI } from '@google/genai';
import { resolveExpressions } from '../expressions/resolver';
import { ExecutionContext } from '../runtime/context';

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

  async run(context: ExecutionContext, config: Record<string, any>): Promise<string> {
    try {
      const input = this.buildPrompt(context, config);

      context.logs.push('AI Node: Calling Gemini');

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

  private buildPrompt(context: ExecutionContext, config: Record<string, any>): string {
    const prompt = (config.prompt || '').trim();
    const upstreamIds: string[] = config._upstreamNodeIds || [];

    // If prompt has {{ }} expressions, resolve them manually (legacy mode)
    if (prompt && /\{\{.+?\}\}/.test(prompt)) {
      return resolveExpressions(prompt, context.data);
    }

    // Auto-detect: gather all upstream node outputs
    const upstreamData = upstreamIds
      .filter((id: string) => context.data[id] !== undefined)
      .map((id: string) => {
        const output = context.data[id];
        const formatted = typeof output === 'object' ? JSON.stringify(output, null, 2) : String(output);
        return `--- Output from node "${id}" ---\n${formatted}`;
      })
      .join('\n\n');

    if (!prompt && !upstreamData) {
      throw new Error('AI Node: No prompt and no upstream data');
    }

    // Combine prompt + upstream data
    if (prompt && upstreamData) {
      return `${prompt}\n\nHere is the data from the previous step(s):\n\n${upstreamData}`;
    }

    // Just upstream data, no user prompt
    if (upstreamData) {
      return `Process the following data:\n\n${upstreamData}`;
    }

    // Just prompt, no upstream data
    return prompt;
  }
}
