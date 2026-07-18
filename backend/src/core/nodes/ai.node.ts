import { BaseNode } from './base.node';
import { resolveExpressions } from '../expressions/resolver';
import { ExecutionContext } from '../runtime/context';
import axios from 'axios';
import {
  McpManager,
  toOpenAITools,
  toAnthropicTools,
  toGeminiTools,
  extractOpenAIToolCalls,
  extractAnthropicToolCalls,
  extractGeminiToolCalls,
  formatOpenAIToolResult,
  formatAnthropicToolResult,
  formatGeminiToolResult,
} from '../mcp';
import type { McpServerConfig, McpTool, ToolCall, McpToolResult } from '../mcp';

// ── Types ──

interface ProviderResponse {
  text: string | null;
  toolCalls: ToolCall[];
  rawAssistantMessage: any;
}

const PROVIDERS: Record<string, {
  label: string;
  models: string[];
  defaultModel: string;
  call: (apiKey: string, model: string, messages: any[], tools?: any[]) => Promise<ProviderResponse>;
  formatToolResult: (tc: ToolCall, result: McpToolResult) => any;
}> = {

  // ── Gemini ──

  gemini: {
    label: 'Google Gemini',
    models: ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-2.5-pro', 'gemini-3.1-flash-lite'],
    defaultModel: 'gemini-flash-latest',
    formatToolResult: formatGeminiToolResult,
    call: async (apiKey, model, messages, tools) => {
      const { GoogleGenAI } = await import('@google/genai');
      const client = new GoogleGenAI({ apiKey });

      const systemMsg = messages.find((m: any) => m.role === 'system');
      const nonSystemMsgs = messages.filter((m: any) => m.role !== 'system');

      // Build contents for multi-turn conversation
      const contents = nonSystemMsgs.map((m: any) => {
        // Already in Gemini parts format (from agentic loop)
        if (m.parts) return m;

        const role = m.role === 'assistant' ? 'model' : 'user';
        return { role, parts: [{ text: m.content }] };
      });

      const config: any = {};
      if (systemMsg) config.systemInstruction = systemMsg.content;
      if (tools && tools.length > 0) {
        config.tools = [{ functionDeclarations: tools }];
      }

      const response = await client.models.generateContent({
        model,
        contents,
        config,
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text);
      const text = textParts.join('') || null;
      const toolCalls = extractGeminiToolCalls(parts);

      return {
        text,
        toolCalls,
        rawAssistantMessage: { role: 'model', parts },
      };
    },
  },

  // ── OpenAI ──

  openai: {
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    formatToolResult: formatOpenAIToolResult,
    call: async (apiKey, model, messages, tools) => {
      const body: any = { model, messages };
      if (tools && tools.length > 0) {
        body.tools = tools;
      }

      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        body,
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
      );

      const message = res.data.choices?.[0]?.message;
      const text = message?.content || null;
      const toolCalls = extractOpenAIToolCalls(message?.tool_calls);

      return {
        text,
        toolCalls,
        rawAssistantMessage: { role: 'assistant', content: message?.content || null, tool_calls: message?.tool_calls },
      };
    },
  },

  // ── Anthropic ──

  anthropic: {
    label: 'Anthropic Claude',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414', 'claude-3-5-sonnet-20241022'],
    defaultModel: 'claude-sonnet-4-20250514',
    formatToolResult: formatAnthropicToolResult,
    call: async (apiKey, model, messages, tools) => {
      const systemMsg = messages.find((m: any) => m.role === 'system');
      const nonSystemMsgs = messages.filter((m: any) => m.role !== 'system');

      const body: any = {
        model,
        max_tokens: 4096,
        system: systemMsg?.content || undefined,
        messages: nonSystemMsgs,
      };
      if (tools && tools.length > 0) {
        body.tools = tools;
      }

      const res = await axios.post(
        'https://api.anthropic.com/v1/messages',
        body,
        { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } }
      );

      const content = res.data.content || [];
      const textBlocks = content.filter((b: any) => b.type === 'text');
      const text = textBlocks.map((b: any) => b.text).join('') || null;
      const toolCalls = extractAnthropicToolCalls(content);

      return {
        text,
        toolCalls,
        rawAssistantMessage: { role: 'assistant', content },
      };
    },
  },
};

// ── Auto-generated system prompt ──

const BASE_SYSTEM_PROMPT = `You are an AI assistant executing a step in an automation workflow.
Be concise and action-oriented. Return a clear summary when done.`;

const TOOL_SYSTEM_PROMPT = `You are an AI assistant executing a step in an automation workflow.
You have access to tools — use them as needed to fulfill the request.
Always call the relevant tools before providing your final answer.
Be concise and action-oriented. Return a clear summary when done.`;

// ── AI Node ──

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

    // ── MCP Setup ──
    const mcpServers: McpServerConfig[] = config.mcpServers || [];
    let mcpManager: McpManager | null = null;
    let mcpTools: McpTool[] = [];
    let providerTools: any[] | undefined;

    if (mcpServers.length > 0) {
      mcpManager = new McpManager();
      try {
        await mcpManager.connectAll(mcpServers);
        mcpTools = mcpManager.getAllTools();
        context.logs.push(
          `MCP: Connected to ${mcpManager.getConnectedServerCount()} server(s), discovered ${mcpTools.length} tool(s)`
        );

        if (mcpTools.length > 0) {
          if (provider === 'openai') providerTools = toOpenAITools(mcpTools);
          else if (provider === 'anthropic') providerTools = toAnthropicTools(mcpTools);
          else if (provider === 'gemini') providerTools = toGeminiTools(mcpTools);
        }
      } catch (err: any) {
        context.logs.push(`MCP connection warning: ${err.message}`);
      }
    }

    const hasTools = providerTools && providerTools.length > 0;
    const messages = this.buildMessages(context, config, hasTools || false);
    const maxIterations = config.maxToolRounds ?? 10;
    let iterations = 0;

    try {
      // ── Agentic Loop ──
      while (iterations < maxIterations) {
        iterations++;
        context.logs.push(`AI Node: Round ${iterations} — Calling ${providerDef.label} (${model})`);

        const result = await providerDef.call(apiKey, model, messages, providerTools);

        // No tool calls — we're done
        if (result.toolCalls.length === 0 || !mcpManager) {
          if (!result.text) throw new Error('AI returned empty response with no tool calls');
          return result.text;
        }

        // Append assistant's tool-calling message to conversation
        messages.push(result.rawAssistantMessage);

        // Execute each tool call via MCP
        for (const tc of result.toolCalls) {
          context.logs.push(`MCP Tool Call: ${tc.name}(${JSON.stringify(tc.arguments).slice(0, 200)})`);

          let toolResult: McpToolResult;
          try {
            toolResult = await mcpManager.callTool(tc.name, tc.arguments);
            context.logs.push(`MCP Tool Result: ${tc.name} → success`);
          } catch (toolErr: any) {
            context.logs.push(`MCP Tool Error: ${tc.name} → ${toolErr.message}`);
            toolResult = {
              content: [{ type: 'text', text: `Error: ${toolErr.message}` }],
              isError: true,
            };
          }

          // Format result in provider-native format and append
          messages.push(providerDef.formatToolResult(tc, toolResult));
        }
      }

      // Max iterations reached — force a final text answer
      context.logs.push(`AI Node: Max iterations (${maxIterations}) reached, requesting final answer`);
      const finalResult = await providerDef.call(apiKey, model, messages);
      return finalResult.text || 'AI did not produce a final response after max tool rounds.';

    } catch (error: any) {
      context.logs.push(`AI Node Error: ${error.message}`);
      throw new Error(`${providerDef.label} failed: ${error.message}`);
    } finally {
      if (mcpManager) {
        await mcpManager.disconnectAll().catch(() => {});
      }
    }
  }

  private buildMessages(context: ExecutionContext, config: Record<string, any>, hasTools: boolean): any[] {
    const userPrompt = (config.prompt || '').trim();
    const upstreamIds: string[] = config._upstreamNodeIds || [];

    // Auto-generate system prompt based on whether tools are available
    const systemContent = hasTools ? TOOL_SYSTEM_PROMPT : BASE_SYSTEM_PROMPT;

    // Build user content
    let userContent: string;

    if (userPrompt && /\{\{.+?\}\}/.test(userPrompt)) {
      userContent = resolveExpressions(userPrompt, context.data);
    } else {
      const upstreamData = upstreamIds
        .filter((id: string) => context.data[id] !== undefined)
        .map((id: string) => {
          const output = context.data[id];
          const formatted = typeof output === 'object' ? JSON.stringify(output, null, 2) : String(output);
          return `--- Output from node "${id}" ---\n${formatted}`;
        })
        .join('\n\n');

      if (userPrompt && upstreamData) {
        userContent = `${userPrompt}\n\nHere is the data from the previous step(s):\n\n${upstreamData}`;
      } else if (upstreamData) {
        userContent = `Process the following data:\n\n${upstreamData}`;
      } else if (userPrompt) {
        userContent = userPrompt;
      } else {
        throw new Error('AI Node: No prompt and no upstream data');
      }
    }

    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ];
  }
}

export const AI_PROVIDERS = Object.entries(PROVIDERS).map(([key, val]) => ({
  key,
  label: val.label,
  models: val.models,
  defaultModel: val.defaultModel,
}));
