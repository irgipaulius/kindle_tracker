import { Hono } from 'hono';

import type { BookRow } from '../db';
import type { AppVariables, Env } from '../env';
import { enrichBookCover } from '../lib/coverEnrichment';
import { requireAuth } from '../middleware/requireAuth';
import { serializeBook } from '../serializers/book';

const ALLOWED_PATCH = new Set([
  'index',
  'title',
  'author',
  'coverUrl',
  'status',
  'downloaded',
  'rating',
  'date',
  'finishedDate',
  'genre',
  'language',
  'comment',
]);

const PATCH_COLUMN: Record<string, string> = {
  index: 'sort_index',
  title: 'title',
  author: 'author',
  coverUrl: 'cover_url',
  status: 'status',
  downloaded: 'downloaded',
  rating: 'rating',
  date: 'date',
  finishedDate: 'finished_at',
  genre: 'genre',
  language: 'language',
  comment: 'comment',
};

export const booksRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

booksRoutes.use('/api/books', requireAuth);
booksRoutes.use('/api/books/*', requireAuth);

booksRoutes.get('/api/books', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC'
  )
    .bind(c.get('userId'))
    .all<BookRow>();

  return c.json((results || []).map(serializeBook));
});

booksRoutes.post('/api/books', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Record<string, unknown>>();

  const last = await c.env.DB.prepare(
    'SELECT sort_index FROM books WHERE user_id = ? ORDER BY sort_index DESC LIMIT 1'
  )
    .bind(userId)
    .first<{ sort_index: number }>();

  const nextIndex = (last?.sort_index ?? 0) + 1;
  const id = crypto.randomUUID();
  const title = typeof body.title === 'string' ? body.title : '';
  const rating = typeof body.rating === 'number' ? body.rating : 0;
  const downloaded = body.downloaded ? 1 : 0;
  const finishedAt =
    body.finishedDate && typeof body.finishedDate === 'string'
      ? new Date(body.finishedDate).toISOString()
      : null;

  await c.env.DB.prepare(
    `INSERT INTO books (
      id, user_id, sort_index, title, author, cover_url, status, downloaded, rating,
      date, finished_at, genre, language, comment
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      nextIndex,
      title,
      typeof body.author === 'string' ? body.author : null,
      typeof body.coverUrl === 'string' ? body.coverUrl : body.coverUrl === null ? null : null,
      typeof body.status === 'string' ? body.status : 'to_read',
      downloaded,
      rating,
      typeof body.date === 'string' ? body.date : null,
      finishedAt,
      typeof body.genre === 'string' ? body.genre : null,
      typeof body.language === 'string' ? body.language : null,
      typeof body.comment === 'string' ? body.comment : null
    )
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM books WHERE id = ?')
    .bind(id)
    .first<BookRow>();

  return c.json(serializeBook(row!), 201);
});

booksRoutes.post('/api/books/:id/fetch-cover', async (c) => {
  const userId = c.get('userId');
  const bookId = c.req.param('id');

  const row = await c.env.DB.prepare('SELECT * FROM books WHERE id = ? AND user_id = ?')
    .bind(bookId, userId)
    .first<BookRow>();

  if (!row) return c.json({ error: 'not_found' }, 404);
  if (!row.title?.trim()) return c.json({ error: 'title_required' }, 400);

  try {
    const { book, outcome } = await enrichBookCover(c.env.DB, row);
    return c.json({ book: serializeBook(book), outcome });
  } catch {
    return c.json({ error: 'cover_lookup_failed' }, 502);
  }
});

booksRoutes.patch('/api/books/:id', async (c) => {
  const userId = c.get('userId');
  const bookId = c.req.param('id');
  const body = await c.req.json<Record<string, unknown>>();

  const sets: string[] = [];
  const binds: unknown[] = [];

  for (const key of Object.keys(body)) {
    if (!ALLOWED_PATCH.has(key)) continue;

    const column = PATCH_COLUMN[key];
    if (!column) continue;

    if (key === 'downloaded') {
      sets.push(`${column} = ?`);
      binds.push(body.downloaded ? 1 : 0);
      continue;
    }

    if (key === 'rating') {
      const r = Number(body.rating);
      sets.push(`${column} = ?`);
      binds.push(Number.isFinite(r) ? r : 0);
      continue;
    }

    if (key === 'index') {
      const n = Number(body.index);
      sets.push(`${column} = ?`);
      binds.push(Number.isFinite(n) ? n : 0);
      continue;
    }

    if (key === 'finishedDate') {
      if (!body.finishedDate) {
        sets.push(`${column} = ?`);
        binds.push(null);
      } else {
        const d = new Date(String(body.finishedDate));
        if (Number.isNaN(d.getTime())) {
          return c.json({ error: 'invalid_finishedDate' }, 400);
        }
        sets.push(`${column} = ?`);
        binds.push(d.toISOString());
      }
      continue;
    }

    sets.push(`${column} = ?`);
    binds.push(body[key] ?? null);
  }

  if (sets.length === 0) {
    const existing = await c.env.DB.prepare('SELECT * FROM books WHERE id = ? AND user_id = ?')
      .bind(bookId, userId)
      .first<BookRow>();
    if (!existing) return c.json({ error: 'not_found' }, 404);
    return c.json(serializeBook(existing));
  }

  sets.push("updated_at = datetime('now')");
  binds.push(bookId, userId);

  await c.env.DB.prepare(`UPDATE books SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...binds)
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM books WHERE id = ? AND user_id = ?')
    .bind(bookId, userId)
    .first<BookRow>();

  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json(serializeBook(row));
});

booksRoutes.delete('/api/books/:id', async (c) => {
  const userId = c.get('userId');
  const bookId = c.req.param('id');

  const result = await c.env.DB.prepare('DELETE FROM books WHERE id = ? AND user_id = ?')
    .bind(bookId, userId)
    .run();

  if (!result.meta.changes) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});
