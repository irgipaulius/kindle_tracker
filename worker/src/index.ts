import { Hono } from 'hono';

import type { AppVariables, Env } from './env';
import { authRoutes } from './routes/auth';
import { booksRoutes } from './routes/books';
import { devAuthRoutes } from './routes/devAuth';
import { healthRoutes } from './routes/health';
import { meRoutes } from './routes/me';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.route('/', healthRoutes);
app.route('/', devAuthRoutes);
app.route('/', authRoutes);
app.route('/', meRoutes);
app.route('/', booksRoutes);

app.notFound(async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;
