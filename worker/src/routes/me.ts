import { Hono } from 'hono';

import { findUserById } from '../db';
import type { AppVariables, Env } from '../env';
import { requireAuth } from '../middleware/requireAuth';
import { serializeUser, type BooksSorting } from '../serializers/user';

const ALLOWED_SORT_COLUMNS = new Set([
  'title',
  'author',
  'status',
  'downloaded',
  'rating',
  'finishedDate',
  'genre',
  'language',
  'comment',
]);

function normalizeBooksSorting(raw: unknown): BooksSorting[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof (s as { id?: string }).id === 'string')
    .map((s) => ({
      id: String((s as { id: string }).id),
      desc: Boolean((s as { desc?: boolean }).desc),
    }))
    .filter((s) => ALLOWED_SORT_COLUMNS.has(s.id))
    .slice(0, 5);
}

export const meRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

meRoutes.use('/api/me/*', requireAuth);
meRoutes.use('/api/me', requireAuth);

meRoutes.get('/api/me', async (c) => {
  const user = await findUserById(c.env.DB, c.get('userId'));
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  return c.json(serializeUser(user));
});

meRoutes.patch('/api/me/preferences', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    preferredLocale?: string;
    booksSorting?: unknown;
    booksFilter?: unknown;
  }>();

  const sets: string[] = [];
  const binds: unknown[] = [];

  if (body.preferredLocale !== undefined) {
    if (!['en', 'fr'].includes(body.preferredLocale)) {
      return c.json({ error: 'invalid_preferredLocale' }, 400);
    }
    sets.push('preferred_locale = ?');
    binds.push(body.preferredLocale);
  }

  if (body.booksSorting !== undefined) {
    if (!Array.isArray(body.booksSorting)) {
      return c.json({ error: 'invalid_booksSorting' }, 400);
    }
    const normalized = normalizeBooksSorting(body.booksSorting);
    sets.push('books_sorting_json = ?');
    binds.push(JSON.stringify(normalized));
  }

  if (body.booksFilter !== undefined) {
    if (typeof body.booksFilter !== 'string') {
      return c.json({ error: 'invalid_booksFilter' }, 400);
    }
    const normalized = body.booksFilter.trim().slice(0, 200);
    sets.push('books_filter_json = ?');
    binds.push(normalized);
  }

  if (sets.length === 0) {
    const user = await findUserById(c.env.DB, userId);
    if (!user) return c.json({ error: 'unauthorized' }, 401);
    const serialized = serializeUser(user);
    return c.json({
      id: serialized.id,
      preferredLocale: serialized.preferredLocale,
      booksSorting: serialized.booksSorting,
      booksFilter: serialized.booksFilter,
    });
  }

  sets.push("updated_at = datetime('now')");
  binds.push(userId);

  await c.env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...binds)
    .run();

  const user = await findUserById(c.env.DB, userId);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  const serialized = serializeUser(user);
  return c.json({
    id: serialized.id,
    preferredLocale: serialized.preferredLocale,
    booksSorting: serialized.booksSorting,
    booksFilter: serialized.booksFilter,
  });
});

meRoutes.patch('/api/me/genres', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ genres?: unknown }>();

  if (!Array.isArray(body.genres)) {
    return c.json({ error: 'invalid_genres' }, 400);
  }

  const normalized = Array.from(
    new Set(
      body.genres
        .filter((g): g is string => typeof g === 'string')
        .map((g) => g.trim())
        .filter(Boolean)
    )
  ).slice(0, 200);

  await c.env.DB.prepare(
    `UPDATE users SET genres_json = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(JSON.stringify(normalized), userId)
    .run();

  return c.json({ id: userId, genres: normalized });
});
