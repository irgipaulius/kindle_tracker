/** Stored in `books.cover_url` when Open Library has no cover — skips future cron runs. */
export const COVER_NONE_SENTINEL = '__no_cover__';

/** True when cron should try to resolve a cover. */
export function needsCoverLookup(coverUrl: string | null | undefined): boolean {
  if (!coverUrl?.trim()) return true;
  return coverUrl !== COVER_NONE_SENTINEL;
}

export function coverUrlForClient(coverUrl: string | null): string | null {
  if (!coverUrl || coverUrl === COVER_NONE_SENTINEL) return null;
  return coverUrl;
}
