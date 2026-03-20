export interface NodeConfig {
  prompt?: string;
  model?: string;
  retries: number;
  to?: string;
  from?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  message?: string;
  html?: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  config: NodeConfig;
}

export interface WorkflowEdge {
  from: string;
  to: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  definition: WorkflowDefinition;
  createdAt?: string;
  updatedAt?: string;
}
