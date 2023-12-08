import { Worker } from "bullmq";
import { Constraints, logger } from "@1kv/common";
import { processConstraintsJob } from "../jobs/ConstraintsJob";

export const createConstraintsWorker = async (
  host,
  port,
  constraints: Constraints.OTV
) => {
  logger.info(`Creating constraints worker...`);
  const worker = await new Worker(
    "constraints",
    (job) => processConstraintsJob(job, constraints),
    {
      connection: {
        host: host,
        port: port,
      },
      concurrency: 4,
      lockDuration: 3000000,
    }
  );
  return worker;
};
