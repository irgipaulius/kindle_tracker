import { Hono } from 'hono';

import type { AppVariables, Env } from './env';
import { enrichNextBookCover } from './lib/coverEnrichment';
import { authRoutes } from './routes/auth';
import { booksRoutes } from './routes/books';
import { importRoutes } from './routes/import';
import { shelfRoutes } from './routes/shelf';
import { devAuthRoutes } from './routes/devAuth';
import { healthRoutes } from './routes/health';
import { meRoutes } from './routes/me';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.route('/', healthRoutes);
app.route('/', devAuthRoutes);
app.route('/', authRoutes);
app.route('/', meRoutes);
app.route('/', booksRoutes);
app.route('/', importRoutes);
app.route('/', shelfRoutes);

app.notFound(async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

async function handleScheduled(env: Env) {
  const result = await enrichNextBookCover(env.DB);
  if (result.status !== 'idle') {
    console.log('[cover-cron]', result);
  }
}

export default {
  fetch: app.fetch,
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    ctx.waitUntil(handleScheduled(env));
  },
};
