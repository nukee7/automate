import prisma from '../config/prisma';
import { randomUUID } from 'crypto';
import { workflowQueue } from '../core/queue/workflow';

export class ExecutionService {

  async start(workflowId: string, userId: string, triggerPayload?: Record<string, any>) {

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const executionId = randomUUID();

    await prisma.execution.create({
      data: {
        workflowId,
        userId,
        executionId,
        status: 'RUNNING'
      }
    });

    // NOTE: No socket emit here — the client subscribes after receiving
    // the executionId, and real events arrive via the socketBridge
    // (which relays BullMQ worker progress events to socket.io).

    await workflowQueue.add(
      "workflow-execution",
      { workflowId, userId, executionId, triggerPayload },
      { jobId: executionId }
    );

    return executionId;
  }

  async getExecution(executionId: string) {
    return prisma.execution.findUnique({
      where: { executionId }
    });
  }

  async getWorkflowExecutions(workflowId: string) {
    return prisma.execution.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' }
    });
  }
}

export const executionService = new ExecutionService();