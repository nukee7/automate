import prisma from '../config/prisma';
import { WorkflowExecutor } from '../core/engine/workflow.executor';
import { WorkflowDefinition } from '../core/types/workflow';
import { SocketEmitter } from '../core/runtime/socketEmitter';

export class ExecutionService {
  private executor: WorkflowExecutor;

  constructor() {
    const emitter = new SocketEmitter();
    this.executor = new WorkflowExecutor(emitter);
  }

  async start(workflowId: string, userId: string) {
    // 1️⃣ Fetch workflow
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

    // 2️⃣ Create execution record (RUNNING)
    const execution = await prisma.execution.create({
      data: {
        workflowId,
        userId,
        status: 'RUNNING',
      },
    });

    try {
      // 3️⃣ Execute workflow
      const result = await this.executor.execute(
        definition,
        userId
      );

      // 4️⃣ Update execution as COMPLETED
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          data: result.data,
          logs: result.logs,
          completedAt: new Date(),
        },
      });

      return execution.id;

    } catch (error: any) {

      // 5️⃣ Update execution as FAILED
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          logs: { error: error.message },
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }
}