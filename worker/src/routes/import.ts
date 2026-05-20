import { Hono } from 'hono';

import { findUserById } from '../db';
import { normalizeImportBooks } from '../lib/importAccess';
import type { AppVariables, Env } from '../env';
import { requireAuth } from '../middleware/requireAuth';

export const importRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

importRoutes.use('/api/books/import', requireAuth);

importRoutes.post('/api/books/import', async (c) => {
  const userId = c.get('userId');
  const user = await findUserById(c.env.DB, userId);
  if (!user) return c.json({ error: 'unauthorized' }, 401);

  const body = await c.req.json<{ books?: unknown; replace?: boolean }>();
  let books;
  try {
    books = normalizeImportBooks(body.books);
  } catch (e) {
    const code = e instanceof Error ? e.message : 'invalid_import';
    return c.json({ error: code }, 400);
  }

  if (body.replace) {
    await c.env.DB.prepare('DELETE FROM books WHERE user_id = ?').bind(userId).run();
  }

  const last = await c.env.DB.prepare(
    'SELECT sort_index FROM books WHERE user_id = ? ORDER BY sort_index DESC LIMIT 1'
  )
    .bind(userId)
    .first<{ sort_index: number }>();

  let nextIndex = last?.sort_index ?? 0;
  const statements = books.map((book) => {
    nextIndex += 1;
    const id = crypto.randomUUID();
    let finishedAt: string | null = null;
    if (book.finishedDate) {
      const d = new Date(book.finishedDate);
      if (!Number.isNaN(d.getTime())) finishedAt = d.toISOString();
    }
    return c.env.DB.prepare(
      `INSERT INTO books (
        id, user_id, sort_index, title, author, cover_url, status, downloaded, rating,
        date, finished_at, genre, language, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      userId,
      nextIndex,
      book.title,
      book.author ?? null,
      null,
      book.status,
      book.downloaded ? 1 : 0,
      book.rating ?? 0,
      null,
      finishedAt,
      book.genre ?? null,
      book.language ?? null,
      book.comment ?? null
    );
  });

  const chunkSize = 50;
  for (let i = 0; i < statements.length; i += chunkSize) {
    await c.env.DB.batch(statements.slice(i, i + chunkSize));
  }

  const genres = Array.from(
    new Set(books.map((b) => b.genre?.trim()).filter((g): g is string => Boolean(g)))
  ).slice(0, 200);

  if (genres.length) {
    let existing: string[] = [];
    try {
      existing = JSON.parse(user.genres_json) as string[];
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
    const merged = Array.from(new Set([...existing, ...genres])).slice(0, 200);
    await c.env.DB.prepare(
      `UPDATE users SET genres_json = ?, updated_at = datetime('now') WHERE id = ?`
    )
      .bind(JSON.stringify(merged), userId)
      .run();
  }

  return c.json({ ok: true, imported: books.length, genresAdded: genres.length });
});
