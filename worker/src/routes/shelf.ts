import { Hono, type Context } from 'hono';

import type { BookRow } from '../db';
import { coverUrlForClient } from '../lib/coverConstants';
import type { AppVariables, Env } from '../env';
import { requireAuth } from '../middleware/requireAuth';

export type ShelfBookPayload = {
  id: string;
  title: string;
  author?: string;
  coverUrl: string | null;
  rating: number;
  finishedDate: string | null;
  genre?: string;
};

export const shelfRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

shelfRoutes.use('/api/books/shelf', requireAuth);
shelfRoutes.use('/api/books/library', requireAuth);

async function readBooksLibrary(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, author, cover_url, rating, finished_at, genre
     FROM books
     WHERE user_id = ? AND status = 'read'
     ORDER BY finished_at IS NULL, finished_at DESC, title ASC`
  )
    .bind(c.get('userId'))
    .all<Pick<BookRow, 'id' | 'title' | 'author' | 'cover_url' | 'rating' | 'finished_at' | 'genre'>>();

  const books: ShelfBookPayload[] = (results || []).map((row) => ({
    id: row.id,
    title: row.title?.trim() || '',
    author: row.author?.trim() || undefined,
    coverUrl: coverUrlForClient(row.cover_url),
    rating: Number(row.rating) || 0,
    finishedDate: row.finished_at,
    genre: row.genre?.trim() || undefined,
  }));

  const rated = books.filter((b) => b.rating > 0);
  const avgRating =
    rated.length > 0 ? rated.reduce((sum, b) => sum + b.rating, 0) / rated.length : 0;
  const withCover = books.filter((b) => b.coverUrl).length;

  return c.json({
    books,
    stats: {
      totalRead: books.length,
      withCover,
      avgRating: Math.round(avgRating * 10) / 10,
    },
  });
}

shelfRoutes.get('/api/books/shelf', readBooksLibrary);
shelfRoutes.get('/api/books/library', readBooksLibrary);
