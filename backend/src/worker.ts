import "./core/registry/register.node";
import { Worker } from "bullmq";
import { redisConnection } from "./core/queue/redis";
import { processExecution } from "./core/engine/execution.processor";

console.log("Worker started");

const worker = new Worker(
  "workflow-queue",
  async (job) => {
    const { workflowId, userId, executionId, triggerPayload } = job.data;

    console.log("Processing execution:", executionId);

    await processExecution(workflowId, userId, executionId, job, triggerPayload);
  },
  { connection: redisConnection }
);

worker.on("failed", (job, err) => {
  console.error("Job failed:", job?.id);
  console.error(err);
});

worker.on("completed", (job) => {
  console.log("Job completed:", job.id);
});