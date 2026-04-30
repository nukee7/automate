import { useEffect, useState } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import { useExecutionStore } from "@/store/executionStore";
import { getWorkflowExecutions, deleteExecution } from "@/api/executions";
import { getUserWorkflows, getWorkflow, deleteWorkflow } from "@/api/workflows";
import {
  RefreshCw, CheckCircle2, XCircle, Loader2,
  FolderOpen, Plus, ChevronDown, ChevronRight, Trash2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────

interface Execution {
  id: string;
  executionId: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  data: Record<string, any> | null;
  logs: string[] | null;
  startedAt: string;
  completedAt: string | null;
}

interface WorkflowSummary {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  webhookToken: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Component ───────────────────────────────────────

const RightSidebar = () => {
  const workflowId = useWorkflowStore((s) => s.workflowId);
  const { setNodes, setEdges, setWorkflowName, setWorkflowId, setWebhookToken } = useWorkflowStore();
  const { setNodeOutput, setNodeStatus, setExecutionId, addLog, clearExecution } = useExecutionStore();

  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [wfLoading, setWfLoading] = useState(false);
  const [expandedWfId, setExpandedWfId] = useState<string | null>(null);
  const [wfExecutions, setWfExecutions] = useState<Record<string, Execution[]>>({});
  const [execLoading, setExecLoading] = useState<string | null>(null);
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null);

  // ─── Fetch workflows ──────────────────────────────

  const fetchWorkflows = async () => {
    setWfLoading(true);
    try {
      const data = await getUserWorkflows();
      setWorkflows(data);
    } catch {
      // silent
    } finally {
      setWfLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [workflowId]);

  // ─── Toggle workflow dropdown ─────────────────────

  const toggleWorkflow = async (wf: WorkflowSummary) => {
    // If already expanded, just collapse
    if (expandedWfId === wf.id) {
      setExpandedWfId(null);
      return;
    }

    // Load workflow onto canvas + expand executions
    setExpandedWfId(wf.id);
    await Promise.all([
      handleLoadWorkflow(wf),
      fetchExecutionsFor(wf.id),
    ]);
  };

  const fetchExecutionsFor = async (wfId: string) => {
    setExecLoading(wfId);
    try {
      const data = await getWorkflowExecutions(wfId);
      setWfExecutions((prev) => ({ ...prev, [wfId]: data }));
    } catch {
      // silent
    } finally {
      setExecLoading(null);
    }
  };

  // ─── Load workflow onto canvas ────────────────────

  const handleLoadWorkflow = async (wf: WorkflowSummary) => {
    try {
      const full = await getWorkflow(wf.id);
      const def = full.definition;

      const rfNodes = def.nodes.map((n: any, i: number) => ({
        id: n.id,
        type: n.type,
        position: n.position || { x: 100 + i * 300, y: 200 },
        data: {
          label: { email: "Email Node", webhook_trigger: "Webhook Trigger", github_trigger: "GitHub Trigger", slack_trigger: "Slack Trigger", ai: "AI Node" }[n.type] || n.type,
          config: n.config || {},
        },
      }));

      const rfEdges = def.edges.map((e: any, i: number) => ({
        id: `edge_${i}`,
        source: e.from,
        target: e.to,
        animated: true,
      }));

      clearExecution();
      setSelectedExecId(null);
      setNodes(rfNodes);
      setEdges(rfEdges);
      setWorkflowName(full.name);
      setWorkflowId(full.id);
      setWebhookToken(full.webhookToken);
    } catch {
      // silent
    }
  };

  // ─── Select execution ─────────────────────────────

  const handleSelectExec = (exec: Execution) => {
    clearExecution();
    setSelectedExecId(exec.executionId);
    setExecutionId(exec.executionId);

    // Load node outputs onto canvas
    if (exec.data && typeof exec.data === "object") {
      for (const [nodeId, output] of Object.entries(exec.data)) {
        setNodeOutput(nodeId, output);
        setNodeStatus(nodeId, exec.status === "FAILED" ? "FAILED" : "SUCCESS");
      }
    }

    // Load logs into execution log panel
    const timestamp = new Date(exec.startedAt);
    if (Array.isArray(exec.logs) && exec.logs.length > 0) {
      for (const log of exec.logs) {
        addLog({
          timestamp,
          type: log.includes("Node") || log.includes("node") ? "node" : "execution",
          message: log,
          status: log.includes("failed") || log.includes("Error") ? "FAILED" : log.includes("completed") ? "SUCCESS" : "STARTED",
        });
      }
    }

    // Always add final status
    addLog({
      timestamp: exec.completedAt ? new Date(exec.completedAt) : timestamp,
      type: "execution",
      message: `Execution ${exec.status}`,
      status: exec.status,
    });
  };

  // ─── Delete handlers ──────────────────────────────

  const handleDeleteExec = async (e: React.MouseEvent, executionId: string, wfId: string) => {
    e.stopPropagation();
    try {
      await deleteExecution(executionId);
      setWfExecutions((prev) => ({
        ...prev,
        [wfId]: (prev[wfId] || []).filter((ex) => ex.executionId !== executionId),
      }));
      if (selectedExecId === executionId) {
        clearExecution();
        setSelectedExecId(null);
      }
    } catch {
      // silent
    }
  };

  const handleDeleteWorkflow = async (e: React.MouseEvent, wfId: string) => {
    e.stopPropagation();
    try {
      await deleteWorkflow(wfId);
      setWorkflows((prev) => prev.filter((w) => w.id !== wfId));
      setWfExecutions((prev) => {
        const next = { ...prev };
        delete next[wfId];
        return next;
      });
      if (workflowId === wfId) {
        clearExecution();
        setSelectedExecId(null);
        setNodes([]);
        setEdges([]);
        setWorkflowName("Untitled Workflow");
        setWorkflowId(null);
        setWebhookToken(null);
      }
    } catch {
      // silent
    }
  };

  const handleNewWorkflow = () => {
    clearExecution();
    setSelectedExecId(null);
    setExpandedWfId(null);
    setNodes([]);
    setEdges([]);
    setWorkflowName("Untitled Workflow");
    setWorkflowId(null);
    setWebhookToken(null);
  };

  // ─── Helpers ───────────────────────────────────────

  const statusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="w-3 h-3 text-status-success" />;
      case "FAILED":
        return <XCircle className="w-3 h-3 text-status-error" />;
      default:
        return <Loader2 className="w-3 h-3 text-status-running animate-spin" />;
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── Render ────────────────────────────────────────

  return (
    <div className="w-60 bg-panel border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Workflows</h2>
        </div>
        <button
          onClick={fetchWorkflows}
          disabled={wfLoading}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${wfLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Workflow list with nested executions */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          <button
            onClick={handleNewWorkflow}
            className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-primary hover:bg-secondary/50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Workflow
          </button>

          {workflows.map((wf) => {
            const isExpanded = expandedWfId === wf.id;
            const execs = wfExecutions[wf.id] || [];
            const isLoadingExecs = execLoading === wf.id;
            const isActive = workflowId === wf.id;

            return (
              <div key={wf.id}>
                {/* Workflow row */}
                <div
                  onClick={() => toggleWorkflow(wf)}
                  className={`w-full text-left p-2 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? "bg-secondary border border-primary/30"
                      : "hover:bg-secondary/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isExpanded
                      ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                      : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    }
                    <p className="text-xs font-medium text-foreground truncate flex-1">{wf.name}</p>
                    <span
                      role="button"
                      onClick={(e) => handleDeleteWorkflow(e, wf.id)}
                      className="shrink-0 text-muted-foreground/40 hover:text-status-error transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 ml-[18px]">
                    {new Date(wf.updatedAt).toLocaleDateString()}
                    {wf.webhookToken && " \u00B7 webhook"}
                  </p>
                </div>

                {/* Executions dropdown */}
                {isExpanded && (
                  <div onClick={(e) => e.stopPropagation()} className="ml-3 pl-3 border-l border-border/50 mt-1 mb-2 space-y-1">
                    {isLoadingExecs ? (
                      <div className="flex items-center gap-2 p-2">
                        <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                        <span className="text-[10px] text-muted-foreground">Loading...</span>
                      </div>
                    ) : execs.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground/50 p-2">No executions</p>
                    ) : (
                      execs.map((exec) => (
                        <button
                          key={exec.executionId}
                          onClick={() => handleSelectExec(exec)}
                          className={`w-full text-left p-2 rounded-md transition-all ${
                            selectedExecId === exec.executionId
                              ? "bg-secondary border border-primary/30"
                              : "hover:bg-secondary/50 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {statusIcon(exec.status)}
                            <span className="text-[10px] font-medium text-foreground">{exec.status}</span>
                            <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto">
                              {exec.executionId.slice(0, 6)}
                            </span>
                            <span
                              role="button"
                              onClick={(e) => handleDeleteExec(e, exec.executionId, wf.id)}
                              className="shrink-0 text-muted-foreground/30 hover:text-status-error transition-colors"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </span>
                          </div>
                          <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                            {formatTime(exec.startedAt)}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
