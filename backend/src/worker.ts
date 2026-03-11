import { Worker, Job } from "bullmq";
import { redisConnection } from "./core/queue/redis";
import { processExecution } from "./core/engine/execution.processor";

console.log("Worker started...");

const worker = new Worker(
  "workflow-queue",
  async (job: Job) => {
    const { workflowId, userId, executionId } = job.data;

    console.log(`Processing execution ${executionId}`);

    await processExecution(workflowId, userId, executionId);
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});