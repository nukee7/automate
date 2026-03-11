import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const workflowQueue = new Queue(
  "workflow-queue",
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: 1000, // Keep last 1000 completed jobs
      removeOnFail: 5000,    // Keep last 5000 failed jobs
    }
  }
);