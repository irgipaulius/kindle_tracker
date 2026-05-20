import type { BookRow } from '../db';
import { COVER_NONE_SENTINEL, needsCoverLookup } from './coverConstants';

const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';
const USER_AGENT = 'HyperReader/1.0 (cover enrichment; contact: hyperreader.eu)';

export type CoverEnrichmentResult =
  | { status: 'idle' }
  | { status: 'found'; bookId: string; coverUrl: string }
  | { status: 'none'; bookId: string }
  | { status: 'error'; message: string };

export async function lookupOpenLibraryCover(
  title: string,
  author?: string | null
): Promise<string | null> {
  const params = new URLSearchParams();
  params.set('title', title.trim());
  if (author?.trim()) params.set('author', author.trim());
  params.set('limit', '1');

  const res = await fetch(`${OPEN_LIBRARY_SEARCH}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`open_library_${res.status}`);
  }

  const json = (await res.json()) as { docs?: { cover_i?: number }[] };
  const coverId = json.docs?.[0]?.cover_i;
  if (typeof coverId !== 'number') return null;

  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
}

export type EnrichBookCoverOutcome = 'found' | 'none' | 'skipped';

export async function enrichBookCover(
  db: D1Database,
  row: BookRow
): Promise<{ book: BookRow; outcome: EnrichBookCoverOutcome }> {
  if (!row.title?.trim() || !needsCoverLookup(row.cover_url)) {
    return { book: row, outcome: 'skipped' };
  }

  const coverUrl = await lookupOpenLibraryCover(row.title, row.author);

  await db
    .prepare(`UPDATE books SET cover_url = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(coverUrl ?? COVER_NONE_SENTINEL, row.id)
    .run();

  const updated = await db.prepare('SELECT * FROM books WHERE id = ?').bind(row.id).first<BookRow>();

  if (!updated) {
    return { book: row, outcome: 'skipped' };
  }

  return {
    book: updated,
    outcome: coverUrl ? 'found' : 'none',
  };
}

export async function enrichNextBookCover(db: D1Database): Promise<CoverEnrichmentResult> {
  const row = await db
    .prepare(
      `SELECT * FROM books
       WHERE (cover_url IS NULL OR trim(cover_url) = '')
         AND title IS NOT NULL AND trim(title) != ''
       ORDER BY updated_at ASC
       LIMIT 1`
    )
    .first<BookRow>();

  if (!row?.id || !row.title?.trim()) {
    return { status: 'idle' };
  }

  if (!needsCoverLookup(row.cover_url)) {
    return { status: 'idle' };
  }

  try {
    const { book, outcome } = await enrichBookCover(db, row);

    if (outcome === 'found' && book.cover_url) {
      return { status: 'found', bookId: book.id, coverUrl: book.cover_url };
    }
    if (outcome === 'none') {
      return { status: 'none', bookId: book.id };
    }
    return { status: 'idle' };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'cover_enrichment_failed';
    return { status: 'error', message };
  }
}
