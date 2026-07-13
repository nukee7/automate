import type { McpTool, McpToolResult } from './tool-converter';

export interface McpServerConfig {
  url: string;
  name?: string;
  headers?: Record<string, string>;
}

const CONNECTION_TIMEOUT = 10_000;

export class McpClient {
  private client: any = null;
  private tools: McpTool[] = [];
  private connected = false;

  constructor(private config: McpServerConfig) {}

  async connect(): Promise<void> {
    const url = new URL(this.config.url);
    const headers = this.config.headers || {};

    // Dynamic imports to work with CommonJS moduleResolution
    const { Client } = require('@modelcontextprotocol/sdk/client');
    const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp');
    const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse');

    this.client = new Client({
      name: 'taskpilot',
      version: '1.0.0',
    });

    // Try StreamableHTTP first, fall back to SSE
    try {
      const transport = new StreamableHTTPClientTransport(url, {
        requestInit: { headers },
      });
      await this.connectWithTimeout(transport);
    } catch {
      // Re-create client for fresh state on fallback
      this.client = new Client({
        name: 'taskpilot',
        version: '1.0.0',
      });
      const transport = new SSEClientTransport(url, {
        requestInit: { headers },
      });
      await this.connectWithTimeout(transport);
    }

    this.connected = true;
    await this.discoverTools();
  }

  private async connectWithTimeout(transport: any): Promise<void> {
    await Promise.race([
      this.client.connect(transport),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`MCP connection timeout after ${CONNECTION_TIMEOUT}ms`)), CONNECTION_TIMEOUT)
      ),
    ]);
  }

  private async discoverTools(): Promise<void> {
    if (!this.client) throw new Error('MCP client not connected');

    const result = await this.client.listTools();
    this.tools = (result.tools || []).map((t: any) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as Record<string, any>,
    }));
  }

  async callTool(name: string, args: Record<string, any>): Promise<McpToolResult> {
    if (!this.client || !this.connected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({ name, arguments: args });
    return {
      content: (result.content || []) as McpToolResult['content'],
      isError: result.isError as boolean | undefined,
    };
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      try {
        await this.client.close();
      } catch {
        // Ignore disconnect errors
      }
    }
    this.connected = false;
    this.client = null;
  }

  getTools(): McpTool[] {
    return this.tools;
  }

  getServerName(): string {
    return this.config.name || this.config.url;
  }
}
