import { useWorkflowStore } from "@/store/workflowStore";
import { useExecutionStore } from "@/store/executionStore";
import { subscribeToExecution } from "@/socket/socket";
import { X, Copy, Check, Play, Settings, ArrowDownToLine, ArrowUpFromLine, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import axios from "axios";

type Tab = "settings" | "input" | "output";

const NodeConfigPanel = () => {
  const { nodes, edges, selectedNodeId, updateNodeConfig, selectNode, webhookToken } = useWorkflowStore();
  const { setExecutionId, setIsRunning, clearExecution, nodeOutputs } = useExecutionStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const [copied, setCopied] = useState(false);
  const [testPayload, setTestPayload] = useState('{\n  "event": "test",\n  "data": "hello"\n}');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [mcpExpanded, setMcpExpanded] = useState(false);

  if (!selectedNode) return null;

  const config = selectedNode.data.config || {};
  const isEmailNode = selectedNode.type === "email";
  const TRIGGER_TYPES = ["webhook_trigger", "github_trigger", "slack_trigger"];
  const isTriggerNode = TRIGGER_TYPES.includes(selectedNode.type || "");
  const isAINode = selectedNode.type === "ai";
  const triggerType = selectedNode.type;

  const webhookUrl = webhookToken
    ? `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_API_PORT || 8000}/api/webhooks/${webhookToken}`
    : null;

  // Find upstream nodes
  const upstreamNodeIds = edges.filter((e) => e.target === selectedNode.id).map((e) => e.source);
  const upstreamOutputs = upstreamNodeIds
    .filter((id) => nodeOutputs[id] !== undefined)
    .map((id) => ({ id, output: nodeOutputs[id] }));

  // Current node output
  const currentOutput = nodeOutputs[selectedNode.id];

  const nodeLabel: Record<string, string> = {
    ai: "AI Node",
    email: "Email Node",
    webhook_trigger: "Webhook Trigger",
    github_trigger: "GitHub Trigger",
    slack_trigger: "Slack Trigger",
  };

  const handleCopyUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setTestLoading(true);
    setTestResult(null);
    clearExecution();
    setIsRunning(true);
    try {
      let body: any;
      try {
        body = JSON.parse(testPayload);
      } catch {
        setTestResult("Invalid JSON");
        setTestLoading(false);
        setIsRunning(false);
        return;
      }
      const res = await axios.post(webhookUrl, body);
      const { executionId } = res.data;
      subscribeToExecution(executionId);
      setExecutionId(executionId);
      setTestResult(`Triggered: ${executionId.slice(0, 8)}...`);
    } catch {
      setTestResult("Failed to send");
      setIsRunning(false);
    } finally {
      setTestLoading(false);
    }
  };

  const inputClass = "w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";
  const textareaClass = "w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none placeholder:text-muted-foreground";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";

  // ─── Settings tab content ──────────────────────────

  const renderSettings = () => {
    if (isTriggerNode) {
      return (
        <>
          <div>
            <label className={labelClass}>Webhook URL</label>
            {webhookUrl ? (
              <div className="flex items-center gap-1.5">
                <p className="flex-1 text-xs text-foreground font-mono bg-secondary rounded-md px-2.5 py-1.5 border border-border break-all">
                  {webhookUrl}
                </p>
                <button onClick={handleCopyUrl} className="shrink-0 p-1.5 rounded-md bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 bg-secondary rounded-md px-2.5 py-1.5 border border-border">
                Save the workflow to generate a webhook URL
              </p>
            )}
          </div>
          {triggerType === "github_trigger" && (
            <div>
              <label className={labelClass}>Setup</label>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Paste the URL in GitHub repo → Settings → Webhooks. Content type: <code className="text-[10px] bg-secondary px-1 py-0.5 rounded border border-border">application/json</code>
              </p>
            </div>
          )}
          {triggerType === "slack_trigger" && (
            <div>
              <label className={labelClass}>Setup</label>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Use as Request URL in Slack app → Event Subscriptions.
              </p>
            </div>
          )}
          {webhookUrl && (
            <div>
              <label className={labelClass}>Test</label>
              <textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={4}
                className={`${textareaClass} font-mono text-xs`}
                placeholder='{"key": "value"}'
              />
              <button
                onClick={handleTestWebhook}
                disabled={testLoading}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Play className="w-3 h-3" />
                {testLoading ? "Sending..." : "Send Test"}
              </button>
              {testResult && (
                <p className={`mt-1.5 text-[10px] font-mono ${testResult.startsWith("Triggered") ? "text-status-success" : "text-status-error"}`}>
                  {testResult}
                </p>
              )}
            </div>
          )}
        </>
      );
    }

    if (isAINode) {
      const mcpServers: Array<{ url: string; name?: string; headers?: Record<string, string> }> =
        config.mcpServers || [];

      const addMcpServer = () => {
        updateNodeConfig(selectedNode.id, {
          mcpServers: [...mcpServers, { url: "", name: "" }],
        });
      };

      const updateMcpServer = (index: number, field: string, value: string) => {
        const updated = mcpServers.map((s, i) =>
          i === index ? { ...s, [field]: value } : s
        );
        updateNodeConfig(selectedNode.id, { mcpServers: updated });
      };

      const updateMcpServerToken = (index: number, token: string) => {
        const updated = mcpServers.map((s, i) => {
          if (i !== index) return s;
          const { headers: _drop, ...rest } = s;
          return token.trim()
            ? { ...rest, headers: { Authorization: `Bearer ${token.trim()}` } }
            : rest;
        });
        updateNodeConfig(selectedNode.id, { mcpServers: updated });
      };

      const removeMcpServer = (index: number) => {
        updateNodeConfig(selectedNode.id, {
          mcpServers: mcpServers.filter((_, i) => i !== index),
        });
      };

      return (
        <>
          <div>
            <label className={labelClass}>AI Provider</label>
            <select
              value={config.provider || "gemini"}
              onChange={(e) => {
                const provider = e.target.value;
                const defaults: Record<string, string> = { gemini: "gemini-2.5-flash", openai: "gpt-4o-mini", anthropic: "claude-sonnet-4-20250514" };
                updateNodeConfig(selectedNode.id, { provider, model: defaults[provider] || "" });
              }}
              className={inputClass}
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Model</label>
            <select
              value={config.model || ""}
              onChange={(e) => updateNodeConfig(selectedNode.id, { model: e.target.value })}
              className={inputClass}
            >
              {(config.provider === "openai" ? ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] :
                config.provider === "anthropic" ? ["claude-sonnet-4-20250514", "claude-haiku-4-20250414", "claude-3-5-sonnet-20241022"] :
                ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"]
              ).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>API Key</label>
            <input
              type="password"
              value={config.apiKey || ""}
              onChange={(e) => updateNodeConfig(selectedNode.id, { apiKey: e.target.value })}
              className={inputClass}
              placeholder={config.provider === "openai" ? "sk-..." : config.provider === "anthropic" ? "sk-ant-..." : "AIza..."}
            />
          </div>
          <div>
            <label className={labelClass}>Prompt</label>
            <textarea
              value={config.prompt || ""}
              onChange={(e) => updateNodeConfig(selectedNode.id, { prompt: e.target.value })}
              rows={4}
              className={textareaClass}
              placeholder="e.g. Triage this GitHub issue, check for duplicates, assign priority"
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1.5">
              Your instruction. Data from the previous node is automatically included.
            </p>
          </div>

          {/* MCP Tool Servers */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setMcpExpanded(!mcpExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <span className="text-xs font-medium text-muted-foreground">
                MCP Tool Servers
                {mcpServers.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px]">
                    {mcpServers.length}
                  </span>
                )}
              </span>
              {mcpExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>

            {mcpExpanded && (
              <div className="p-3 space-y-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground/60">
                  Connect MCP servers to give the AI access to external tools (GitHub, Slack, databases, etc.)
                </p>

                {mcpServers.map((server, index) => (
                  <div key={index} className="space-y-2 p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground mb-1">Server URL</label>
                      <input
                        value={server.url || ""}
                        onChange={(e) => updateMcpServer(index, "url", e.target.value)}
                        className={inputClass}
                        placeholder="https://api.githubcopilot.com/mcp"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                        Auth Token (optional)
                      </label>
                      <input
                        type="password"
                        value={(server.headers?.Authorization || "").replace(/^Bearer /, "")}
                        onChange={(e) => updateMcpServerToken(index, e.target.value)}
                        className={inputClass}
                        placeholder="github_pat_... — sent as Authorization: Bearer"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-medium text-muted-foreground mb-1">Name (optional)</label>
                        <input
                          value={server.name || ""}
                          onChange={(e) => updateMcpServer(index, "name", e.target.value)}
                          className={inputClass}
                          placeholder="e.g. github"
                        />
                      </div>
                      <button
                        onClick={() => removeMcpServer(index)}
                        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-status-error hover:border-status-error/50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addMcpServer}
                  className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg border border-dashed border-border text-muted-foreground text-xs hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Server
                </button>

                {mcpServers.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground mb-1">Max Tool Rounds</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={config.maxToolRounds ?? 10}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { maxToolRounds: parseInt(e.target.value) || 10 })}
                      className={inputClass}
                    />
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Maximum number of tool call rounds before forcing a final answer.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      );
    }

    if (isEmailNode) {
      return (
        <>
          {[
            { key: "to", label: "To", placeholder: "user@example.com" },
            { key: "from", label: "From", placeholder: "Optional. Falls back to EMAIL_FROM" },
            { key: "cc", label: "Cc", placeholder: "Comma-separated" },
            { key: "bcc", label: "Bcc", placeholder: "Comma-separated" },
            { key: "subject", label: "Subject", placeholder: "Taskpilot notification" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input
                value={config[key] || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { [key]: e.target.value })}
                className={inputClass}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div>
            <label className={labelClass}>Message</label>
            <textarea
              value={config.message || ""}
              onChange={(e) => updateNodeConfig(selectedNode.id, { message: e.target.value })}
              rows={4}
              className={textareaClass}
              placeholder="Email body text"
            />
          </div>
          <div>
            <label className={labelClass}>HTML</label>
            <textarea
              value={config.html || ""}
              onChange={(e) => updateNodeConfig(selectedNode.id, { html: e.target.value })}
              rows={3}
              className={textareaClass}
              placeholder="<p>Optional HTML body</p>"
            />
          </div>
        </>
      );
    }

    return null;
  };

  // ─── Input tab content ─────────────────────────────

  const renderInput = () => {
    if (isTriggerNode) {
      return (
        <div className="text-xs text-muted-foreground/60 py-4 text-center">
          Trigger nodes receive data from external webhooks.
        </div>
      );
    }

    if (upstreamOutputs.length === 0) {
      return (
        <div className="text-xs text-muted-foreground/60 py-4 text-center">
          No input data yet. Connect an upstream node and run the workflow.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {upstreamOutputs.map(({ id, output }) => (
          <div key={id}>
            <p className="text-[10px] font-medium text-muted-foreground mb-1">From: {id}</p>
            <pre className="text-[11px] text-foreground/80 bg-secondary rounded-lg border border-border p-3 max-h-[300px] overflow-auto whitespace-pre-wrap break-words font-mono">
              {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    );
  };

  // ─── Output tab content ────────────────────────────

  const renderOutput = () => {
    if (!currentOutput) {
      return (
        <div className="text-xs text-muted-foreground/60 py-4 text-center">
          No output yet. Run the workflow to see results.
        </div>
      );
    }

    return (
      <pre className="text-[11px] text-foreground/80 bg-secondary rounded-lg border border-border p-3 max-h-[400px] overflow-auto whitespace-pre-wrap break-words font-mono">
        {typeof currentOutput === "string" ? currentOutput : JSON.stringify(currentOutput, null, 2)}
      </pre>
    );
  };

  // ─── Render ────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => selectNode(null)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none">
        <div className="bg-panel border border-border rounded-2xl shadow-2xl shadow-black/40 w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-foreground">
                {nodeLabel[selectedNode.type || ""] || selectedNode.type}
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground/60 bg-secondary px-2 py-0.5 rounded border border-border">
                {selectedNode.id}
              </span>
            </div>
            <button
              onClick={() => selectNode(null)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {([
              { key: "settings" as Tab, label: "Settings", icon: Settings },
              { key: "input" as Tab, label: "Input", icon: ArrowDownToLine },
              { key: "output" as Tab, label: "Output", icon: ArrowUpFromLine },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === key
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {key === "input" && upstreamOutputs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center">
                    {upstreamOutputs.length}
                  </span>
                )}
                {key === "output" && currentOutput && (
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
            {activeTab === "settings" && renderSettings()}
            {activeTab === "input" && renderInput()}
            {activeTab === "output" && renderOutput()}
          </div>
        </div>
      </div>
    </>
  );
};

export default NodeConfigPanel;
