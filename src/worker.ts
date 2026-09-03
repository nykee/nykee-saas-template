import startWorker from '@tanstack/react-start/server-entry';
import type { ApplicationEvent } from '@/lib/server/cloudflare';
import { processApplicationQueue } from '@/lib/server/events.server';
import { AppCoordinator } from '@/server/durable-objects/app-coordinator';

/**
 * Custom Worker entrypoint.
 *
 * TanStack Start remains responsible for HTTP fetch handling. This wrapper
 * adds Cloudflare Queue consumption and exports the Durable Object class that
 * Wrangler references, while keeping those concerns out of route components.
 */
const worker = {
  fetch: startWorker.fetch,
  async queue(
    batch: MessageBatch<ApplicationEvent>,
    _env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    await processApplicationQueue(batch);
  },
};

export { AppCoordinator };
export default worker;
