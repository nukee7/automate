export type ExecutionEvent =
  | {
      kind: "execution";
      status: "STARTED" | "COMPLETED" | "FAILED";
      executionId: string;
      error?: string;
    }
  | {
      kind: "node";
      nodeId: string;
      status: "STARTED" | "SUCCESS" | "FAILED";
      output?: any;
      error?: string;
    };