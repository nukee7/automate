import { create } from "zustand";
import { Node, Edge } from "reactflow";

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  workflowName: string;
  workflowDescription: string;
  webhookToken: string | null;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, any>) => void;
  selectNode: (nodeId: string | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (desc: string) => void;
  setWebhookToken: (token: string | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowName: "Untitled Workflow",
  workflowDescription: "",
  webhookToken: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
  updateNodeConfig: (nodeId, config) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } } : n
      ),
    })),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setWorkflowName: (workflowName) => set({ workflowName }),
  setWorkflowDescription: (workflowDescription) => set({ workflowDescription }),
  setWebhookToken: (webhookToken) => set({ webhookToken }),
}));
