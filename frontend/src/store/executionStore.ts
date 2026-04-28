import { create } from "zustand";
import type { LogEntry, NodeStatus } from "@/types/execution";

interface ExecutionState {
  executionId: string | null;
  isRunning: boolean;
  nodeStatuses: Record<string, NodeStatus>;
  nodeOutputs: Record<string, any>;
  logs: LogEntry[];
  setExecutionId: (id: string | null) => void;
  setIsRunning: (running: boolean) => void;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  setNodeOutput: (nodeId: string, output: any) => void;
  addLog: (log: LogEntry) => void;
  clearExecution: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  executionId: null,
  isRunning: false,
  nodeStatuses: {},
  nodeOutputs: {},
  logs: [],
  setExecutionId: (id) => set({ executionId: id }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setNodeStatus: (nodeId, status) =>
    set((s) => ({ nodeStatuses: { ...s.nodeStatuses, [nodeId]: status } })),
  setNodeOutput: (nodeId, output) =>
    set((s) => ({ nodeOutputs: { ...s.nodeOutputs, [nodeId]: output } })),
  addLog: (log) => set((s) => ({ logs: [...s.logs, log] })),
  clearExecution: () => set({ executionId: null, isRunning: false, nodeStatuses: {}, nodeOutputs: {}, logs: [] }),
}));
