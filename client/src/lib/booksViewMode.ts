export type BooksViewMode = 'grid' | 'list' | 'library';

const STORAGE_KEY = 'books.viewMode';

export function loadBooksViewMode(): BooksViewMode {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'library' || saved === 'bookshelf') return 'library';
  if (saved === 'grid' || saved === 'list') return saved;
  return 'grid';
}

export function saveBooksViewMode(mode: BooksViewMode) {
  window.localStorage.setItem(STORAGE_KEY, mode);
}
