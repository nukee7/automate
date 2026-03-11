import prisma from '../../config/prisma';
import { WorkflowExecutor } from './workflow.executor';
import { SocketWorkflowEmitter } from '../runtime/socketEmitter';
import { WorkflowDefinition } from '../types/workflow';

const emitter = new SocketWorkflowEmitter();
const executor = new WorkflowExecutor(emitter);

export async function processExecution(
  workflowId: string,
  userId: string,
  executionId: string
) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const definition =
      workflow.definition as unknown as WorkflowDefinition;

    const result = await executor.execute(
      definition,
      userId,
      executionId
    );

    await prisma.execution.update({
      where: { executionId },
      data: {
        status: 'COMPLETED',
        data: result.data as any,
        logs: result.logs as any,
        completedAt: new Date()
      }
    });

    emitter.emit(executionId, {
      kind: "execution",
      status: "COMPLETED",
      executionId
    });

  } catch (error: any) {

    await prisma.execution.update({
      where: { executionId },
      data: {
        status: 'FAILED',
        logs: { error: error.message } as any,
        completedAt: new Date()
      }
    });

    emitter.emit(executionId, {
      kind: "execution",
      status: "FAILED",
      executionId,
      error: error.message
    });

    throw error;
  }
}