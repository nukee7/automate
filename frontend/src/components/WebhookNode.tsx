import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Webhook } from "lucide-react";
import { useExecutionStore } from "@/store/executionStore";

const WebhookNode = ({ id, data, selected }: NodeProps) => {
  const nodeStatus = useExecutionStore((s) => s.nodeStatuses[id]);

  const statusClasses = {
    STARTED: "ring-2 ring-status-running animate-pulse-glow",
    SUCCESS: "ring-2 ring-status-success",
    FAILED: "ring-2 ring-status-error",
  };

  return (
    <div
      className={`
        min-w-[220px] rounded-xl bg-card border border-node-border shadow-lg shadow-black/20 overflow-hidden transition-all
        ${selected ? "border-node-selected ring-1 ring-node-selected/30" : ""}
        ${nodeStatus ? statusClasses[nodeStatus] : ""}
      `}
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border-b border-border">
        <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center">
          <Webhook className="w-3.5 h-3.5 text-accent" />
        </div>
        <span className="text-xs font-semibold text-foreground">Webhook Trigger</span>
        {nodeStatus && (
          <span className={`ml-auto text-[10px] font-mono font-medium ${
            nodeStatus === "STARTED" ? "text-status-running" :
            nodeStatus === "SUCCESS" ? "text-status-success" : "text-status-error"
          }`}>
            {nodeStatus}
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
          {data.config?.webhookUrl
            ? "URL configured"
            : "Save workflow to get URL"}
        </p>
      </div>
      <Handle type="source" position={Position.Right} className="!-right-[5px]" />
    </div>
  );
};

export default memo(WebhookNode);
