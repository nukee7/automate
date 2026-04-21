import { QueueEvents } from "bullmq";
import { redisConnection } from "./redis";
import { getIO } from "../../config/socket";

export const initSocketBridge = () => {
  const queueEvents = new QueueEvents("workflow-queue", {
    connection: redisConnection,
  });

  // Relay job progress events (node status + execution COMPLETED) to socket.io
  queueEvents.on("progress", ({ jobId, data }: { jobId: string; data: any }) => {
    const io = getIO();
    const executionId = jobId;

    if (data.executionStepId) {
      // Node-level event
      io.to(executionId).emit("execution:event", {
        kind: "node",
        nodeId: data.executionStepId,
        status: data.executionStatus,
        output: data.output,
        error: data.error,
      });
    } else if (data.executionStatus) {
      // Execution-level event (COMPLETED)
      io.to(executionId).emit("execution:event", {
        kind: "execution",
        status: data.executionStatus,
        executionId,
      });
    }
  });

  // Relay final job failure (after all BullMQ retries exhausted) to socket.io
  queueEvents.on("failed", ({ jobId }: { jobId: string }) => {
    const io = getIO();
    io.to(jobId).emit("execution:event", {
      kind: "execution",
      status: "FAILED",
      executionId: jobId,
    });
  });

  console.log("Socket bridge initialized");
};
