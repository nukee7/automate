import api from "./axios";

export const executeWorkflow = async (workflowId: string) => {
  const { data } = await api.post(`/executions/${workflowId}/run`);
  return data as { executionId: string };
};

export const getExecutionStatus = async (executionId: string) => {
  const { data } = await api.get(`/executions/${executionId}`);
  return data;
};

export const getAllExecutions = async () => {
  const { data } = await api.get("/executions/all");
  return data as Array<{
    id: string;
    executionId: string;
    workflowId: string;
    status: "RUNNING" | "COMPLETED" | "FAILED";
    data: Record<string, any> | null;
    logs: string[] | null;
    startedAt: string;
    completedAt: string | null;
    workflow: { name: string };
  }>;
};

export const deleteExecution = async (executionId: string) => {
  const { data } = await api.delete(`/executions/${executionId}`);
  return data;
};

export const getWorkflowExecutions = async (workflowId: string) => {
  const { data } = await api.get(`/executions/workflow/${workflowId}`);
  return data as Array<{
    id: string;
    executionId: string;
    status: "RUNNING" | "COMPLETED" | "FAILED";
    data: Record<string, any> | null;
    logs: string[] | null;
    startedAt: string;
    completedAt: string | null;
  }>;
};
