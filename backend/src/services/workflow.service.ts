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

export async function getWorkflowByToken(token: string) {
  return prisma.workflow.findUnique({
    where: { webhookToken: token }
  });
}