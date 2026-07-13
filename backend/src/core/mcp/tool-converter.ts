/**
 * Converts MCP tool schemas to provider-native formats and handles
 * tool call extraction / result formatting for each provider.
 */

// ── Shared Types ──

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: Record<string, any>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface McpToolResult {
  content: Array<{ type: string; text?: string; [key: string]: any }>;
  isError?: boolean;
}

// ── MCP → Provider Tool Schema Conversion ──

export function toOpenAITools(tools: McpTool[]) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description || '',
      parameters: t.inputSchema,
    },
  }));
}

export function toAnthropicTools(tools: McpTool[]) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description || '',
    input_schema: t.inputSchema,
  }));
}

export function toGeminiTools(tools: McpTool[]) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description || '',
    parameters: stripUnsupportedJsonSchema(t.inputSchema),
  }));
}

/**
 * Gemini doesn't support some JSON Schema features.
 * Strip $ref, $defs, allOf, anyOf, oneOf for compatibility.
 */
function stripUnsupportedJsonSchema(schema: Record<string, any>): Record<string, any> {
  const stripped: Record<string, any> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (['$ref', '$defs', 'allOf', 'anyOf', 'oneOf', 'additionalProperties'].includes(key)) {
      continue;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      stripped[key] = stripUnsupportedJsonSchema(value);
    } else {
      stripped[key] = value;
    }
  }
  return stripped;
}

// ── Extract Tool Calls from Provider Responses ──

export function extractOpenAIToolCalls(toolCalls: any[]): ToolCall[] {
  if (!toolCalls || !Array.isArray(toolCalls)) return [];
  return toolCalls.map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: typeof tc.function.arguments === 'string'
      ? JSON.parse(tc.function.arguments)
      : tc.function.arguments,
  }));
}

export function extractAnthropicToolCalls(contentBlocks: any[]): ToolCall[] {
  if (!contentBlocks || !Array.isArray(contentBlocks)) return [];
  return contentBlocks
    .filter((b: any) => b.type === 'tool_use')
    .map((b: any) => ({
      id: b.id,
      name: b.name,
      arguments: b.input || {},
    }));
}

export function extractGeminiToolCalls(parts: any[]): ToolCall[] {
  if (!parts || !Array.isArray(parts)) return [];
  return parts
    .filter((p: any) => p.functionCall)
    .map((p: any, i: number) => ({
      id: `gemini-tc-${i}`,
      name: p.functionCall.name,
      arguments: p.functionCall.args || {},
    }));
}

// ── Format Tool Results Back to Provider Message Format ──

function mcpResultToText(result: McpToolResult): string {
  const textParts = result.content
    .map((c) => c.text || JSON.stringify(c))
    .join('\n');

  // Truncate to ~100KB to prevent token overflow
  const MAX_LEN = 100_000;
  return textParts.length > MAX_LEN
    ? textParts.slice(0, MAX_LEN) + '\n...(truncated)'
    : textParts;
}

export function formatOpenAIToolResult(tc: ToolCall, result: McpToolResult): any {
  return {
    role: 'tool',
    tool_call_id: tc.id,
    content: mcpResultToText(result),
  };
}

export function formatAnthropicToolResult(tc: ToolCall, result: McpToolResult): any {
  return {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: tc.id,
        content: mcpResultToText(result),
        is_error: result.isError || false,
      },
    ],
  };
}

export function formatGeminiToolResult(tc: ToolCall, result: McpToolResult): any {
  return {
    functionResponse: {
      name: tc.name,
      response: { result: mcpResultToText(result) },
    },
  };
}
