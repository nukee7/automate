import { create } from "zustand";
import type { LogEntry, NodeStatus } from "@/types/execution";

interface ExecutionState {
  executionId: string | null;
  isRunning: boolean;
  nodeStatuses: Record<string, NodeStatus>;
  logs: LogEntry[];
  setExecutionId: (id: string | null) => void;
  setIsRunning: (running: boolean) => void;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  addLog: (log: LogEntry) => void;
  clearExecution: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  executionId: null,
  isRunning: false,
  nodeStatuses: {},
  logs: [],
  setExecutionId: (id) => set({ executionId: id }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setNodeStatus: (nodeId, status) =>
    set((s) => ({ nodeStatuses: { ...s.nodeStatuses, [nodeId]: status } })),
  addLog: (log) => set((s) => ({ logs: [...s.logs, log] })),
  clearExecution: () => set({ executionId: null, isRunning: false, nodeStatuses: {}, logs: [] }),
}));
