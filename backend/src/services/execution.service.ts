import prisma from '../config/prisma';
import { randomUUID } from 'crypto';
import { workflowQueue } from '../core/queue/workflow';
import { SocketWorkflowEmitter } from '../core/runtime/socketEmitter';

const emitter = new SocketWorkflowEmitter();

export class ExecutionService {

  async start(workflowId: string, userId: string) {

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

    emitter.emit(executionId, {
      kind: "execution",
      status: "STARTED",
      executionId
    });

    await workflowQueue.add(
      "workflow-execution",
      { workflowId, userId, executionId },
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