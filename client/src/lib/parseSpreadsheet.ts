export type ImportBookRow = {
  title: string;
  author?: string;
  status: 'to_read' | 'reading' | 'read';
  downloaded: boolean;
  rating: number;
  /** ISO 8601 date for when the book was finished (from spreadsheet Date column). */
  finishedDate?: string;
  genre?: string;
  language?: string;
  comment?: string;
};

const HEADER_ALIASES: Record<string, keyof ImportBookRow | 'skip'> = {
  'nom du livre': 'title',
  title: 'title',
  book: 'title',
  auteur: 'author',
  author: 'author',
  statut: 'status',
  status: 'status',
  downloaded: 'downloaded',
  téléchargé: 'downloaded',
  telecharge: 'downloaded',
  note: 'rating',
  rating: 'rating',
  date: 'finishedDate',
  'date de fin': 'finishedDate',
  'date fin': 'finishedDate',
  finished: 'finishedDate',
  'finished date': 'finishedDate',
  genre: 'genre',
  langue: 'language',
  language: 'language',
  commentaire: 'comment',
  comment: 'comment',
};

function normalizeHeader(cell: string) {
  return cell.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseRating(raw: string): number {
  const filled = (raw.match(/★/g) || []).length;
  if (filled > 0) return Math.min(5, filled);
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0;
}

function parseDownloaded(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  return s === 'oui' || s === 'yes' || s === 'true' || s === '1' || s === 'y';
}

function parseStatus(raw: string): ImportBookRow['status'] {
  const s = raw.trim().toLowerCase();
  if (s === 'lu' || s === 'read' || s === 'luu' || s === 'finished' || s === 'done') return 'read';
  if (s === 'à lire' || s === 'a lire' || s === 'to read' || s === 'to_read' || s === 'unread') {
    return 'to_read';
  }
  if (s === 'en cours' || s === 'reading' || s === 'pas terminé' || s === 'pas termine' || s === 'dnf') {
    return 'reading';
  }
  return 'to_read';
}

function splitRow(line: string, delimiter: string): string[] {
  if (delimiter === '\t') return line.split('\t');
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur);
  return cells;
}

function detectDelimiter(headerLine: string): string {
  const tabs = (headerLine.match(/\t/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return tabs >= commas ? '\t' : ',';
}

const MONTH_INDEX: Record<string, number> = {
  january: 0,
  jan: 0,
  janvier: 0,
  february: 1,
  feb: 1,
  fevrier: 1,
  fev: 1,
  mars: 2,
  mar: 2,
  march: 2,
  avril: 3,
  apr: 3,
  april: 3,
  mai: 4,
  may: 4,
  juin: 5,
  jun: 5,
  june: 5,
  juillet: 6,
  jul: 6,
  july: 6,
  aout: 7,
  aug: 7,
  august: 7,
  août: 7,
  septembre: 8,
  sep: 8,
  sept: 8,
  september: 8,
  octobre: 9,
  oct: 9,
  october: 9,
  novembre: 10,
  nov: 10,
  november: 10,
  decembre: 11,
  dec: 11,
  december: 11,
  décembre: 11,
};

function stripAccents(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Parses spreadsheet date cells (e.g. "janvier 2026", "2026-02-15") to ISO date at UTC noon. */
export function parseSpreadsheetDate(raw: string): string | undefined {
  const s = raw.trim();
  if (!s) return undefined;

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12));
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const d = new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]), 12));
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  const monthYear = s.match(/^([a-zA-ZéèêëàâäùûüôöîïçÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ.]+)\s+(\d{4})$/);
  if (monthYear) {
    const monthKey = stripAccents(monthYear[1].replace(/\./g, ''));
    const month = MONTH_INDEX[monthKey];
    const year = Number.parseInt(monthYear[2], 10);
    if (month !== undefined && Number.isFinite(year)) {
      const d = new Date(Date.UTC(year, month, 1, 12));
      return d.toISOString();
    }
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(
      Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12)
    ).toISOString();
  }

  return undefined;
}

function isEmptyTitle(title: string) {
  const t = title.trim();
  if (!t) return true;
  if (/^[☆★\s]+$/.test(t)) return true;
  return false;
}

export function parseSpreadsheetText(text: string): ImportBookRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\r$/, ''));
  const firstContent = lines.findIndex((l) => l.trim().length > 0);
  if (firstContent === -1) return [];

  const headerLine = lines[firstContent];
  const delimiter = detectDelimiter(headerLine);
  const headers = splitRow(headerLine, delimiter).map(normalizeHeader);

  const columnMap: Partial<Record<keyof ImportBookRow, number>> = {};
  headers.forEach((h, i) => {
    const key = HEADER_ALIASES[h];
    if (key && key !== 'skip') columnMap[key] = i;
  });

  if (columnMap.title === undefined) {
    throw new Error('missing_title_column');
  }

  const rows: ImportBookRow[] = [];

  for (let li = firstContent + 1; li < lines.length; li++) {
    const line = lines[li];
    if (!line.trim()) continue;

    const cells = splitRow(line, delimiter);
    const pick = (key: keyof ImportBookRow) => {
      const idx = columnMap[key];
      return idx === undefined ? '' : (cells[idx] ?? '').trim();
    };

    const title = pick('title');
    if (isEmptyTitle(title)) continue;

    const rawFinished = pick('finishedDate');
    const finishedDate = parseSpreadsheetDate(rawFinished);

    rows.push({
      title,
      author: pick('author') || undefined,
      status: parseStatus(pick('status')),
      downloaded: parseDownloaded(pick('downloaded')),
      rating: parseRating(pick('rating')),
      finishedDate,
      genre: pick('genre') || undefined,
      language: pick('language') || undefined,
      comment: pick('comment') || undefined,
    });
  }

  return rows;
}
