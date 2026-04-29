import api from "./axios";
import type { WorkflowDefinition } from "@/types/workflow";

export const createWorkflow = async (name: string, description: string, definition: WorkflowDefinition) => {
  const { data } = await api.post("/workflows", { name, description, definition });
  return data;
};

export const updateWorkflow = async (id: string, name: string, description: string, definition: WorkflowDefinition) => {
  const { data } = await api.put(`/workflows/${id}`, { name, description, definition });
  return data;
};

export const deleteWorkflow = async (id: string) => {
  const { data } = await api.delete(`/workflows/${id}`);
  return data;
};

export const getUserWorkflows = async () => {
  const { data } = await api.get("/workflows");
  return data as Array<{
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    webhookToken: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export const getWorkflow = async (id: string) => {
  const { data } = await api.get(`/workflows/${id}`);
  return data as {
    id: string;
    name: string;
    description: string | null;
    definition: { nodes: any[]; edges: any[] };
    isActive: boolean;
    webhookToken: string | null;
  };
};
