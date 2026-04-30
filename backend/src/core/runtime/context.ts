export interface ExecutionContext {
  executionId: string;
  userId: string;

  data: Record<string, any>;
  logs: string[];

  triggerPayload?: Record<string, any>;
  triggerHeaders?: Record<string, string>;
}