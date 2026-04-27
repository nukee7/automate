import { useWorkflowStore } from "@/store/workflowStore";
import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

const NodeConfigPanel = () => {
  const { nodes, selectedNodeId, updateNodeConfig, selectNode, webhookToken } = useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const [copied, setCopied] = useState(false);

  if (!selectedNode) return null;

  const config = selectedNode.data.config || {};
  const isEmailNode = selectedNode.type === "email";
  const isWebhookTrigger = selectedNode.type === "webhook_trigger";

  const webhookUrl = webhookToken
    ? `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_API_PORT || 8000}/api/webhooks/${webhookToken}`
    : null;

  const handleCopyUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-72 bg-panel border-l border-border flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Configuration</h2>
        <button onClick={() => selectNode(null)} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Node ID</label>
          <p className="text-sm text-foreground font-mono bg-secondary rounded-md px-2.5 py-1.5 border border-border">{selectedNode.id}</p>
        </div>
        {isWebhookTrigger ? (
          <>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Webhook URL</label>
              {webhookUrl ? (
                <div className="flex items-center gap-1.5">
                  <p className="flex-1 text-xs text-foreground font-mono bg-secondary rounded-md px-2.5 py-1.5 border border-border break-all">
                    {webhookUrl}
                  </p>
                  <button
                    onClick={handleCopyUrl}
                    className="shrink-0 p-1.5 rounded-md bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/60 bg-secondary rounded-md px-2.5 py-1.5 border border-border">
                  Save the workflow to generate a webhook URL
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Usage</label>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Send a POST request with a JSON body to the webhook URL. The payload is available in downstream nodes via{" "}
                <code className="text-xs bg-secondary px-1 py-0.5 rounded border border-border">
                  {"{{node.<id>.payload}}"}
                </code>
              </p>
            </div>
          </>
        ) : isEmailNode ? (
          <>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">To</label>
              <input
                value={config.to || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { to: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">From</label>
              <input
                value={config.from || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { from: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Optional. Falls back to EMAIL_FROM"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cc</label>
              <input
                value={config.cc || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { cc: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Comma-separated recipients"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bcc</label>
              <input
                value={config.bcc || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { bcc: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Comma-separated recipients"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subject</label>
              <input
                value={config.subject || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { subject: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Taskpilot notification"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Message</label>
              <textarea
                value={config.message || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none placeholder:text-muted-foreground"
                placeholder="Supports {{node.node_1}} style placeholders"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">HTML</label>
              <textarea
                value={config.html || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { html: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none placeholder:text-muted-foreground"
                placeholder="<p>Optional HTML body</p>"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Prompt</label>
              <textarea
                value={config.prompt || ""}
                onChange={(e) => updateNodeConfig(selectedNode.id, { prompt: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none placeholder:text-muted-foreground"
                placeholder="Enter AI prompt..."
              />
            </div>
          </>
        )}
        {!isWebhookTrigger && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Retries</label>
            <input
              type="number"
              min={0}
              max={5}
              value={config.retries ?? 0}
              onChange={(e) => updateNodeConfig(selectedNode.id, { retries: parseInt(e.target.value) || 0 })}
              className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeConfigPanel;
