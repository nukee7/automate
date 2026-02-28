import prisma from '../config/prisma';
import { WorkflowExecutor } from '../core/engine/workflow.executor';
import { WorkflowDefinition } from '../core/types/workflow';
import { SocketWorkflowEmitter } from '../core/runtime/socketEmitter';

export class ExecutionService {
  private executor: WorkflowExecutor;

  constructor() {
    const emitter = new SocketWorkflowEmitter();
    this.executor = new WorkflowExecutor(emitter);
  }

  async start(workflowId: string, userId: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (!workflow.isActive) {
      throw new Error('Workflow is inactive');
    }

    const definition =
      workflow.definition as unknown as WorkflowDefinition;

    // 1️⃣ Create execution record first
    const execution = await prisma.execution.create({
      data: {
        workflowId,
        userId,
        status: 'RUNNING',
      },
    });

    // 2️⃣ Fire background execution (non-blocking)
    setImmediate(async () => {
      try {
        const result = await this.executor.execute(
          definition,
          userId
        );

        await prisma.execution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            data: result.data,
            logs: result.logs,
            completedAt: new Date(),
          },
        });

      } catch (error: any) {
        await prisma.execution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            logs: { error: error.message },
            completedAt: new Date(),
          },
        });
      }
    });

    // 3️⃣ Return immediately
    return execution.id;
  }
}