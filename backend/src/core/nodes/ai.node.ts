import { BaseNode } from './base.node';
import { resolveExpressions } from '../expressions/resolver';
import { ExecutionContext } from '../runtime/context';
import axios from 'axios';

interface ProviderResponse {
  text: string;
}

const PROVIDERS: Record<string, {
  label: string;
  models: string[];
  defaultModel: string;
  call: (apiKey: string, model: string, prompt: string) => Promise<ProviderResponse>;
}> = {
  gemini: {
    label: 'Google Gemini',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    defaultModel: 'gemini-2.5-flash',
    call: async (apiKey, model, prompt) => {
      const { GoogleGenAI } = await import('@google/genai');
      const client = new GoogleGenAI({ apiKey });
      const response = await client.models.generateContent({ model, contents: prompt });
      if (!response.text) throw new Error('Gemini returned empty response');
      return { text: response.text };
    },
  },
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    call: async (apiKey, model, prompt) => {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        { model, messages: [{ role: 'user', content: prompt }] },
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
      );
      const text = res.data.choices?.[0]?.message?.content;
      if (!text) throw new Error('OpenAI returned empty response');
      return { text };
    },
  },
  anthropic: {
    label: 'Anthropic Claude',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414', 'claude-3-5-sonnet-20241022'],
    defaultModel: 'claude-sonnet-4-20250514',
    call: async (apiKey, model, prompt) => {
      const res = await axios.post(
        'https://api.anthropic.com/v1/messages',
        { model, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] },
        { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } }
      );
      const text = res.data.content?.[0]?.text;
      if (!text) throw new Error('Anthropic returned empty response');
      return { text };
    },
  },
};

export class AINode implements BaseNode {
  async run(context: ExecutionContext, config: Record<string, any>): Promise<string> {
    const provider = config.provider || 'gemini';
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    const providerDef = PROVIDERS[provider];

    if (!providerDef) {
      throw new Error(`AI Node: Unknown provider "${provider}"`);
    }

    if (!apiKey) {
      throw new Error(`AI Node: No API key provided for ${providerDef.label}`);
    }

    const model = config.model || providerDef.defaultModel;
    const prompt = this.buildPrompt(context, config);

    context.logs.push(`AI Node: Calling ${providerDef.label} (${model})`);

    try {
      const result = await providerDef.call(apiKey, model, prompt);
      return result.text;
    } catch (error: any) {
      context.logs.push(`AI Node Error: ${error.message}`);
      throw new Error(`${providerDef.label} failed: ${error.message}`);
    }
  }

  private buildPrompt(context: ExecutionContext, config: Record<string, any>): string {
    const prompt = (config.prompt || '').trim();
    const upstreamIds: string[] = config._upstreamNodeIds || [];

    if (prompt && /\{\{.+?\}\}/.test(prompt)) {
      return resolveExpressions(prompt, context.data);
    }

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

    if (prompt && upstreamData) {
      return `${prompt}\n\nHere is the data from the previous step(s):\n\n${upstreamData}`;
    }

    if (upstreamData) {
      return `Process the following data:\n\n${upstreamData}`;
    }

    return prompt;
  }
}

// Export provider info for frontend
export const AI_PROVIDERS = Object.entries(PROVIDERS).map(([key, val]) => ({
  key,
  label: val.label,
  models: val.models,
  defaultModel: val.defaultModel,
}));
