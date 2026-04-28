export type NodeStatus = "STARTED" | "SUCCESS" | "FAILED";
export type ExecutionStatus = "STARTED" | "COMPLETED" | "FAILED";

export interface NodeEvent {
  kind: "node";
  nodeId: string;
  status: NodeStatus;
  output?: any;
  error?: string;
}

export interface ExecutionEvent {
  kind: "execution";
  status: ExecutionStatus;
  executionId: string;
}

export type ExecutionSocketEvent = NodeEvent | ExecutionEvent;

export interface LogEntry {
  timestamp: Date;
  type: "node" | "execution";
  message: string;
  status: string;
  nodeId?: string;
  output?: any;
}
