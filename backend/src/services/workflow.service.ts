import prisma from '../config/prisma';
import { randomUUID } from 'crypto';

function hasWebhookTrigger(definition: any): boolean {
  return Array.isArray(definition?.nodes) &&
    definition.nodes.some((n: any) => n.type === 'webhook_trigger');
}

export async function createWorkflow(data: any, userId: string) {
  const webhookToken = hasWebhookTrigger(data.definition)
    ? randomUUID()
    : null;

  return prisma.workflow.create({
    data: {
      name: data.name,
      description: data.description,
      definition: data.definition,
      webhookToken,
      userId
    }
  });
}

export async function getWorkflow(id: string) {
  return prisma.workflow.findUnique({
    where: { id }
  });
}

export async function updateWorkflow(id: string, data: any, userId: string) {
  const existing = await prisma.workflow.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error('Workflow not found');
  }

  const needsToken = hasWebhookTrigger(data.definition);
  const webhookToken = needsToken
    ? existing.webhookToken || randomUUID()
    : null;

  return prisma.workflow.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      definition: data.definition,
      webhookToken,
    }
  });
}

export async function getUserWorkflows(userId: string) {
  return prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      webhookToken: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}

export async function deleteWorkflow(id: string, userId: string) {
  const existing = await prisma.workflow.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error('Workflow not found');
  }
  // Delete executions first (foreign key constraint)
  await prisma.execution.deleteMany({ where: { workflowId: id } });
  return prisma.workflow.delete({ where: { id } });
}

export async function getWorkflowByToken(token: string) {
  return prisma.workflow.findUnique({
    where: { webhookToken: token }
  });
}