export type ImportBookPayload = {
  title: string;
  author?: string;
  status: 'to_read' | 'reading' | 'read';
  downloaded?: boolean;
  rating?: number;
  finishedDate?: string;
  genre?: string;
  language?: string;
  comment?: string;
};

const VALID_STATUS = new Set(['to_read', 'reading', 'read']);

export function normalizeImportBooks(raw: unknown): ImportBookPayload[] {
  if (!Array.isArray(raw)) throw new Error('invalid_books');

  const books: ImportBookPayload[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const title = typeof row.title === 'string' ? row.title.trim() : '';
    if (!title || /^[☆★\s]+$/.test(title)) continue;

    const status =
      typeof row.status === 'string' && VALID_STATUS.has(row.status)
        ? (row.status as ImportBookPayload['status'])
        : 'to_read';

    const rating = Number(row.rating);
    books.push({
      title,
      author: typeof row.author === 'string' ? row.author.trim() || undefined : undefined,
      status,
      downloaded: Boolean(row.downloaded),
      rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0,
      finishedDate:
        typeof row.finishedDate === 'string'
          ? row.finishedDate.trim() || undefined
          : typeof row.date === 'string'
            ? row.date.trim() || undefined
            : undefined,
      genre: typeof row.genre === 'string' ? row.genre.trim() || undefined : undefined,
      language: typeof row.language === 'string' ? row.language.trim() || undefined : undefined,
      comment: typeof row.comment === 'string' ? row.comment.trim() || undefined : undefined,
    });
  }

  if (!books.length) throw new Error('no_books');
  if (books.length > 2000) throw new Error('too_many_books');

  return books;
}
