import { McpClient, McpServerConfig } from './mcp-client';
import type { McpTool, McpToolResult } from './tool-converter';

export class McpManager {
  private clients: Map<string, McpClient> = new Map();
  private toolToServer: Map<string, string> = new Map();

  async connectAll(servers: McpServerConfig[]): Promise<void> {
    const results = await Promise.allSettled(
      servers.map(async (config) => {
        const client = new McpClient(config);
        await client.connect();
        return { key: config.url, client };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { key, client } = result.value;
        this.clients.set(key, client);
      }
      // Failed servers are silently skipped — caller checks tool count
    }

    this.buildToolMap();
  }

  private buildToolMap(): void {
    this.toolToServer.clear();
    const seenNames = new Set<string>();

    for (const [serverUrl, client] of this.clients) {
      for (const tool of client.getTools()) {
        // Handle name collisions by prefixing with server name
        let toolName = tool.name;
        if (seenNames.has(toolName)) {
          toolName = `${client.getServerName()}__${tool.name}`;
          tool.name = toolName;
        }
        seenNames.add(toolName);
        this.toolToServer.set(toolName, serverUrl);
      }
    }
  }

  getAllTools(): McpTool[] {
    const tools: McpTool[] = [];
    for (const client of this.clients.values()) {
      tools.push(...client.getTools());
    }
    return tools;
  }

  async callTool(name: string, args: Record<string, any>): Promise<McpToolResult> {
    const serverUrl = this.toolToServer.get(name);
    if (!serverUrl) {
      throw new Error(`No MCP server found for tool "${name}"`);
    }

    const client = this.clients.get(serverUrl);
    if (!client) {
      throw new Error(`MCP client for "${serverUrl}" not available`);
    }

    return client.callTool(name, args);
  }

  async disconnectAll(): Promise<void> {
    const disconnects = Array.from(this.clients.values()).map((c) =>
      c.disconnect().catch(() => {})
    );
    await Promise.allSettled(disconnects);
    this.clients.clear();
    this.toolToServer.clear();
  }

  getConnectedServerCount(): number {
    return this.clients.size;
  }
}
