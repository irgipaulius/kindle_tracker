import type { UserRow } from '../db';

export type BooksSorting = { id: string; desc: boolean };

export function parseJsonArray<T>(raw: string, fallback: T[]): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function serializeUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email ?? undefined,
    name: row.name,
    picture: row.picture ?? undefined,
    preferredLocale: row.preferred_locale as 'en' | 'fr',
    genres: parseJsonArray<string>(row.genres_json, []),
    booksSorting: parseJsonArray<BooksSorting>(row.books_sorting_json, [
      { id: 'index', desc: false },
    ]),
  };
}
