import type { BookRow } from '../db';

export function serializeBook(row: BookRow) {
  return {
    _id: row.id,
    userId: row.user_id,
    index: row.sort_index,
    title: row.title ?? undefined,
    author: row.author ?? undefined,
    coverUrl: row.cover_url,
    status: row.status as 'to_read' | 'reading' | 'read',
    downloaded: Boolean(row.downloaded),
    rating: row.rating,
    date: row.date ?? undefined,
    finishedDate: row.finished_at,
    genre: row.genre ?? undefined,
    language: row.language ?? undefined,
    comment: row.comment ?? undefined,
  };
}
