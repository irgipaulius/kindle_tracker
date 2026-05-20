import type { TFunction } from 'i18next';

const COLUMN_KEYS = [
  'title',
  'author',
  'status',
  'downloaded',
  'rating',
  'finishedDate',
  'genre',
  'language',
  'comment',
] as const;

export type BookColumnId = (typeof COLUMN_KEYS)[number];

export function bookColumnLabel(t: TFunction, id: string): string {
  if ((COLUMN_KEYS as readonly string[]).includes(id)) {
    return t(id);
  }
  return id;
}

export function bookColumnOptions(t: TFunction) {
  return COLUMN_KEYS.map((id) => ({ id, label: t(id) }));
}
