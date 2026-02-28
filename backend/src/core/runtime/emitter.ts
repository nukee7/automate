// this is used by websocket to show real time updates
export interface WorkflowExecutionEmitter {
  emit(
    executionId: string,
    event: {
      nodeId: string;
      status: 'STARTED' | 'SUCCESS' | 'FAILED';
      output?: any;
      error?: string;
    }
  ): void;
}