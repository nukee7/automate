import prisma from "../../config/prisma";
import { WorkflowExecutor } from "./workflow.executor";
import { WorkflowDefinition } from "../types/workflow";
import { Job } from "bullmq";

const executor = new WorkflowExecutor();

export async function processExecution(
  workflowId: string,
  userId: string,
  executionId: string,
  job: Job
) {

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  const definition =
    workflow.definition as unknown as WorkflowDefinition;

  try {
    const result = await executor.execute(
      definition,
      userId,
      executionId,
      job
    );

    await prisma.execution.update({
      where: { executionId },
      data: {
        status: "COMPLETED",
        data: result.data as any,
        logs: result.logs as any,
        completedAt: new Date()
      }
    });

    // Emit COMPLETED — relayed to socket.io via socketBridge
    await job.updateProgress({ executionStatus: "COMPLETED", executionId });

    return result;
  } catch (error) {
    await prisma.execution.update({
      where: { executionId },
      data: {
        status: "FAILED",
        completedAt: new Date()
      }
    }).catch(() => {});

    // Re-throw so BullMQ can retry or mark as failed
    throw error;
  }
}