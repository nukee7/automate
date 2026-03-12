import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useWorkflowStore } from "@/store/workflowStore";
import { useExecutionStore } from "@/store/executionStore";
import { createWorkflow } from "@/api/workflows";
import { executeWorkflow } from "@/api/executions";
import { getSocket, subscribeToExecution, disconnectSocket } from "@/socket/socket";
import type { ExecutionSocketEvent } from "@/types/execution";
import NodePalette from "@/components/NodePalette";
import WorkflowCanvas from "@/components/WorkflowCanvas";
import NodeConfigPanel from "@/components/NodeConfigPanel";
import ExecutionLogs from "@/components/ExecutionLogs";
import { Zap, Play, Save, LogOut } from "lucide-react";
import { toast } from "sonner";

const AutomationPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const { nodes, edges, selectedNodeId, workflowName, setWorkflowName } = useWorkflowStore();
  const { setExecutionId, setIsRunning, setNodeStatus, addLog, clearExecution } = useExecutionStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Socket listener
  useEffect(() => {
    const socket = getSocket();

    const handler = (event: ExecutionSocketEvent) => {
      if (event.kind === "node") {
        setNodeStatus(event.nodeId, event.status);
        addLog({
          timestamp: new Date(),
          type: "node",
          message: `Node ${event.nodeId}: ${event.status}${event.error ? ` - ${event.error}` : ""}`,
          status: event.status,
          nodeId: event.nodeId,
        });
      } else if (event.kind === "execution") {
        if (event.status === "COMPLETED" || event.status === "FAILED") {
          setIsRunning(false);
        }
        addLog({
          timestamp: new Date(),
          type: "execution",
          message: `Execution ${event.status}`,
          status: event.status,
        });
      }
    };

    socket.on("execution:event", handler);
    return () => {
      socket.off("execution:event", handler);
    };
  }, []);

  const buildDefinition = () => ({
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type || "ai",
      config: n.data.config || {},
    })),
    edges: edges.map((e) => ({
      from: e.source,
      to: e.target,
    })),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await createWorkflow(workflowName, "", buildDefinition());
      toast.success("Workflow saved");
    } catch {
      toast.error("Failed to save workflow");
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    clearExecution();
    setIsRunning(true);
    try {
      // Save first, then execute
      const wf = await createWorkflow(workflowName, "", buildDefinition());
      const { executionId } = await executeWorkflow(wf.id);
      setExecutionId(executionId);
      subscribeToExecution(executionId);
      addLog({ timestamp: new Date(), type: "execution", message: "Execution started", status: "STARTED" });
    } catch {
      setIsRunning(false);
      toast.error("Failed to run workflow");
    }
  };

  const handleLogout = () => {
    logout();
    disconnectSocket();
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-12 bg-panel border-b border-border flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Automate</span>
        </div>

        <div className="h-5 w-px bg-border mx-2" />

        <input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="bg-transparent text-sm text-foreground font-medium focus:outline-none border-b border-transparent focus:border-primary/50 transition-colors px-1"
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors border border-border"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Run
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2 h-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        <NodePalette />
        <div className="flex flex-col flex-1 min-w-0">
          <WorkflowCanvas />
          <ExecutionLogs />
        </div>
        {selectedNodeId && <NodeConfigPanel />}
      </div>
    </div>
  );
};

export default AutomationPage;
