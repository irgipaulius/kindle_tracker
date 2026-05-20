import type { ShelfBook } from '../../lib/api';

export const LIBRARY_UNCATEGORIZED = '__uncategorized__';

/** How books are grouped into labeled bookcases (reshuffles on change). */
export type LibraryOrganizeBy = 'genre' | 'year' | 'month' | 'rating' | 'author';

export type LibraryCase = {
  caseKey: string;
  label: string;
  books: ShelfBook[];
  sortRank: number;
};

export type LibraryLabels = {
  uncategorized: string;
  unfinished: string;
  noStars: string;
  stars: string;
};

function hasValidFinishedDate(finishedDate: string | null | undefined): boolean {
  if (!finishedDate?.trim()) return false;
  const t = new Date(finishedDate).getTime();
  return Number.isFinite(t);
}

function normalizedStarRating(rating: unknown): number {
  const r = Math.round(Number(rating));
  if (!Number.isFinite(r) || r <= 0) return 0;
  return Math.min(5, r);
}

export function spineColorFromTitle(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = title.charCodeAt(i) + ((h << 5) - h);
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 36%, 30%)`;
}

/** Desktop: only nudge the shelf row when the spine sits near the visible scroll edges. */
export function shouldAutoScrollShelfForPreview(slotEl: HTMLElement, flipWidthPx: number): boolean {
  const bay = slotEl.closest('.study-shelf-bay');
  if (!bay) return false;

  const slot = slotEl.getBoundingClientRect();
  const bayRect = bay.getBoundingClientRect();
  const threshold = Math.min(72, Math.max(40, bayRect.width * 0.12));

  const nearShelfLeft = slot.left - bayRect.left < threshold;
  const nearShelfRight = bayRect.right - slot.right < threshold;

  const centerX = slot.left + slot.width / 2;
  const flipLeft = centerX - flipWidthPx / 2;
  const flipRight = flipLeft + flipWidthPx;
  const viewportPad = 12;
  const flipOffScreen =
    flipLeft < viewportPad || flipRight > window.innerWidth - viewportPad;

  return nearShelfLeft || nearShelfRight || flipOffScreen;
}

export function spineHeightScale(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return 0.92 + (n % 9) * 0.01;
}

/** Visual length along the spine (vertical axis) — wide glyphs count more than narrow ones. */
export function spineTextUnits(title: string): number {
  const text = title.trim();
  if (!text) return 0;

  let units = 0;
  for (const ch of text) {
    if (/[mwMW@%]/.test(ch)) units += 1.38;
    else if (/[iljtf1.,!|'"`:;]/.test(ch)) units += 0.62;
    else if (ch === ' ') units += 0.32;
    else if (/[A-ZÀ-ÖØ-Þ]/.test(ch)) units += 1.12;
    else units += 1;
  }
  return units;
}

export type SpineTitleLayout = {
  columns: string[];
  fontSize: string;
  letterSpacing: string;
  lineHeight: number;
};

/** Split title into 1–3 vertical columns (sequential phrases, not scrambled words). */
export function splitSpineTitleColumns(title: string): string[] {
  const text = title.trim();
  if (!text) return [''];

  const units = spineTextUnits(text);
  const colCount = units <= 13 ? 1 : units <= 24 ? 2 : 3;
  if (colCount === 1) return [text];

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= colCount) {
    return words.concat(Array(Math.max(0, colCount - words.length)).fill('')).slice(0, colCount);
  }

  const columns: string[] = [];
  const targetUnits = units / colCount;
  let chunk = '';
  let chunkUnits = 0;

  for (const word of words) {
    const wu = spineTextUnits(word);

    if (chunk && chunkUnits >= targetUnits * 0.88 && columns.length < colCount - 1) {
      columns.push(chunk);
      chunk = word;
      chunkUnits = wu;
      continue;
    }

    if (columns.length >= colCount - 1) {
      chunk = chunk ? `${chunk} ${word}` : word;
      chunkUnits = spineTextUnits(chunk);
      continue;
    }

    chunk = chunk ? `${chunk} ${word}` : word;
    chunkUnits = spineTextUnits(chunk);
  }
  if (chunk) columns.push(chunk);
  return columns;
}

/** Largest readable type per column; uses 2–3 columns instead of shrinking one line. */
export function spineTitleLayout(title: string, options?: { tallSpine?: boolean }): SpineTitleLayout {
  const columns = splitSpineTitleColumns(title);
  const lineHeight = 1.08;
  const capacityRem = options?.tallSpine ? 7.35 : 6.5;
  const maxRem = options?.tallSpine ? 0.76 : 0.72;
  const minRem = 0.58;

  const tallest = Math.max(...columns.map((c) => spineTextUnits(c)), 1);
  let fontSizeRem = capacityRem / (tallest * lineHeight);
  fontSizeRem = Math.min(maxRem, fontSizeRem);
  if (fontSizeRem < minRem) fontSizeRem = minRem;

  const widthBudgetRem = options?.tallSpine ? 2.35 : 2.1;
  const gapRem = 0.06;
  const needed =
    columns.length * fontSizeRem * 0.92 + Math.max(0, columns.length - 1) * gapRem;
  if (needed > widthBudgetRem) {
    fontSizeRem = Math.max(minRem, fontSizeRem * (widthBudgetRem / needed));
  }

  const totalUnits = spineTextUnits(title);
  const letterSpacing =
    totalUnits > 28 ? '0.02em' : totalUnits > 16 ? '0.04em' : '0.07em';

  return {
    columns,
    fontSize: `${fontSizeRem.toFixed(3)}rem`,
    letterSpacing,
    lineHeight,
  };
}

export function filterLibraryBooks(books: ShelfBook[], query: string): ShelfBook[] {
  const q = query.trim().toLowerCase();
  if (!q) return books;
  return books.filter(
    (b) =>
      (b.title || '').toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q) ||
      (b.genre || '').toLowerCase().includes(q)
  );
}

function sortBooksWithinCase(books: ShelfBook[]): ShelfBook[] {
  return [...books].sort((a, b) => {
    const db = b.finishedDate ? new Date(b.finishedDate).getTime() : 0;
    const da = a.finishedDate ? new Date(a.finishedDate).getTime() : 0;
    if (db !== da) return db - da;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
  });
}

function groupKeyForBook(
  book: ShelfBook,
  organizeBy: LibraryOrganizeBy,
  labels: LibraryLabels,
  locale: string
): { key: string; label: string; sortRank: number } {
  switch (organizeBy) {
    case 'genre': {
      const g = book.genre?.trim();
      if (!g) {
        return { key: LIBRARY_UNCATEGORIZED, label: labels.uncategorized, sortRank: 9999 };
      }
      return { key: `genre:${g}`, label: g, sortRank: 0 };
    }
    case 'year': {
      if (!hasValidFinishedDate(book.finishedDate)) {
        return { key: 'year:none', label: labels.unfinished, sortRank: 0 };
      }
      const y = new Date(book.finishedDate!).getFullYear();
      return { key: `year:${y}`, label: String(y), sortRank: y };
    }
    case 'month': {
      if (!hasValidFinishedDate(book.finishedDate)) {
        return { key: 'month:none', label: labels.unfinished, sortRank: 0 };
      }
      const d = new Date(book.finishedDate!);
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      return { key: `month:${y}-${m}`, label, sortRank: y * 12 + m };
    }
    case 'rating': {
      const r = normalizedStarRating(book.rating);
      if (r === 0) {
        return { key: 'rating:0', label: labels.noStars, sortRank: 0 };
      }
      return {
        key: `rating:${r}`,
        label: `${r} ${labels.stars}`,
        sortRank: r,
      };
    }
    case 'author': {
      const a = book.author?.trim();
      if (!a) {
        return { key: 'author:none', label: labels.uncategorized, sortRank: 9999 };
      }
      return { key: `author:${a}`, label: a, sortRank: 0 };
    }
    default:
      return { key: LIBRARY_UNCATEGORIZED, label: labels.uncategorized, sortRank: 9999 };
  }
}

export function buildLibraryCases(
  books: ShelfBook[],
  organizeBy: LibraryOrganizeBy,
  genreOrder: string[],
  labels: LibraryLabels,
  locale: string
): LibraryCase[] {
  const grouped = new Map<string, { label: string; sortRank: number; books: ShelfBook[] }>();

  for (const book of books) {
    const { key, label, sortRank } = groupKeyForBook(book, organizeBy, labels, locale);
    const entry = grouped.get(key) || { label, sortRank, books: [] };
    entry.books.push(book);
    grouped.set(key, entry);
  }

  const genreIndex = new Map(genreOrder.map((g, i) => [g.trim(), i]));

  const cases: LibraryCase[] = [];

  if (organizeBy === 'rating' && !grouped.has('rating:0')) {
    grouped.set('rating:0', { label: labels.noStars, sortRank: 0, books: [] });
  }
  if (organizeBy === 'year' && !grouped.has('year:none')) {
    grouped.set('year:none', { label: labels.unfinished, sortRank: 0, books: [] });
  }
  if (organizeBy === 'month' && !grouped.has('month:none')) {
    grouped.set('month:none', { label: labels.unfinished, sortRank: 0, books: [] });
  }

  for (const [caseKey, entry] of grouped.entries()) {
    let sortRank = entry.sortRank;
    if (organizeBy === 'genre') {
      const genreName = caseKey.replace(/^genre:/, '');
      sortRank = genreIndex.get(genreName) ?? (caseKey.includes(LIBRARY_UNCATEGORIZED) ? 9999 : 5000);
    }
    if (organizeBy === 'author') {
      sortRank = 0;
    }

    cases.push({
      caseKey,
      label: entry.label,
      books: sortBooksWithinCase(entry.books),
      sortRank,
    });
  }

  cases.sort((a, b) => {
    if (organizeBy === 'genre') {
      if (a.sortRank !== b.sortRank) return a.sortRank - b.sortRank;
      return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
    }
    if (organizeBy === 'author') {
      return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
    }
    if (organizeBy === 'rating' || organizeBy === 'year' || organizeBy === 'month') {
      return b.sortRank - a.sortRank;
    }
    if (a.sortRank !== b.sortRank) return b.sortRank - a.sortRank;
    return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
  });

  return cases;
}
