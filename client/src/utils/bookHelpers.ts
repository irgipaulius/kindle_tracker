import { Book } from '../lib/api';

export function statusLabel(t: (k: string) => string, s: Book['status']) {
  if (s === 'to_read') return t('toRead');
  if (s === 'reading') return t('reading');
  return t('read');
}
