import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { api, Book } from '../lib/api';
import { BookTitleAutocomplete } from '../components/BookTitleAutocomplete';
import { CommentPopover } from '../components/CommentPopover';
import { DatePickerPopover } from '../components/DatePickerPopover';
import { GenreInput } from '../components/GenreInput';
import { Popover } from '../components/Popover';
import { StarRating } from '../components/StarRating';
import { TableFilters } from '../components/TableFilters';

function statusLabel(t: (k: string) => string, s: Book['status']) {
  if (s === 'to_read') return t('toRead');
  if (s === 'reading') return t('reading');
  return t('read');
}

export function BooksScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>(() => {
    const saved = window.localStorage.getItem('books.viewMode');
    return saved === 'list' || saved === 'grid' ? saved : 'grid';
  });

  React.useEffect(() => {
    window.localStorage.setItem('books.viewMode', viewMode);
  }, [viewMode]);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: api.getMe,
  });

  const saveSortingMutation = useMutation({
    mutationFn: (booksSorting: { id: string; desc: boolean }[]) => api.setBooksSorting(booksSorting),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const booksQuery = useQuery({
    queryKey: ['books'],
    queryFn: api.listBooks,
  });

  const createBookMutation = useMutation({
    mutationFn: (payload: { title: string }) => api.createBook(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Book> }) => api.updateBook(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['books'] });
      const previous = queryClient.getQueryData<Book[]>(['books']);

      queryClient.setQueryData<Book[]>(['books'], (cur) => {
        const list = cur || [];
        return list.map((b) => (b._id === id ? { ...b, ...patch } : b));
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['books'], ctx.previous);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Book[]>(['books'], (cur) => {
        const list = cur || [];
        return list.map((b) => (b._id === updated._id ? { ...b, ...updated } : b));
      });
    },
  });

  const setGenresMutation = useMutation({
    mutationFn: (genres: string[]) => api.setGenres(genres),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: (id: string) => api.deleteBook(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const books = booksQuery.data || [];
  const genreOptions = meQuery.data?.genres || [];

  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const [coverModalId, setCoverModalId] = React.useState<string | null>(null);

  const detailsBook = React.useMemo(() => books.find((b) => b._id === detailsId) || null, [books, detailsId]);
  const coverModalBook = React.useMemo(() => books.find((b) => b._id === coverModalId) || null, [books, coverModalId]);

  function onAddBook() {
    createBookMutation.mutate({ title: 'New book' });
  }

  function patchBook(id: string, patch: Partial<Book>) {
    updateBookMutation.mutate({ id, patch });
  }

  function upsertGenreOption(value: string) {
    const v = value.trim();
    if (!v) return;
    const merged = Array.from(new Set([...(genreOptions || []), v]));
    setGenresMutation.mutate(merged);
  }

  function SortableHeader({
    label,
    column,
  }: {
    label: string;
    column: { getCanSort: () => boolean; getIsSorted: () => false | 'asc' | 'desc'; getToggleSortingHandler: () => (() => void) | undefined };
  }) {
    const canSort = column.getCanSort();
    const sorted = column.getIsSorted();
    return (
      <button
        type="button"
        onClick={column.getToggleSortingHandler()}
        className={`group inline-flex items-center gap-2 ${canSort ? 'hover:text-white transition' : ''}`}
      >
        <span>{label}</span>
        {canSort ? (
          <span className="opacity-60 group-hover:opacity-100 transition">
            <ArrowUpDown className="h-4 w-4" />
          </span>
        ) : null}
        {sorted ? (
          <span className="text-[10px] text-slate-400">{sorted === 'asc' ? '▲' : '▼'}</span>
        ) : null}
      </button>
    );
  }

  function InlineText({
    value,
    onCommit,
    placeholder = '—',
  }: {
    value: string;
    onCommit: (next: string) => void;
    placeholder?: string;
  }) {
    const [draft, setDraft] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
      const el = inputRef.current;
      const focused = typeof document !== 'undefined' ? document.activeElement === el : false;
      if (!focused) setDraft(value);
    }, [value]);

    const commitIfChanged = React.useCallback(() => {
      if (draft !== value) onCommit(draft);
    }, [draft, value, onCommit]);

    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        onBlur={() => {
          commitIfChanged();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitIfChanged();
            inputRef.current?.blur();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value);
            inputRef.current?.blur();
          }
        }}
        className="w-full rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/40"
        placeholder={placeholder}
      />
    );
  }

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  React.useEffect(() => {
    const pref = meQuery.data?.booksSorting;
    if (!pref || pref.length === 0) return;
    setSorting((cur) => (cur.length ? cur : (pref as SortingState)));
  }, [meQuery.data?.booksSorting]);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      if (sorting.length === 0) return;
      saveSortingMutation.mutate(sorting.map((s) => ({ id: s.id, desc: Boolean(s.desc) })));
    }, 500);
    return () => window.clearTimeout(handle);
  }, [sorting]);

  const columns = useMemo<ColumnDef<Book>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => <SortableHeader label={t('title')} column={column as any} />,
        cell: ({ row }) => (
          <BookTitleAutocomplete
            value={row.original.title}
            author={row.original.author}
            onApply={(patch) => patchBook(row.original._id, patch)}
            placeholder={t('title')}
          />
        ),
      },
      {
        accessorKey: 'author',
        header: ({ column }) => <SortableHeader label={t('author')} column={column as any} />,
        cell: ({ row }) => (
          <InlineText
            value={row.original.author || ''}
            onCommit={(next) => patchBook(row.original._id, { author: next })}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <SortableHeader label={t('status')} column={column as any} />,
        cell: ({ row }) => (
          <select
            value={row.original.status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              patchBook(row.original._id, { status: e.target.value as Book['status'] })
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="to_read">{statusLabel(t, 'to_read')}</option>
            <option value="reading">{statusLabel(t, 'reading')}</option>
            <option value="read">{statusLabel(t, 'read')}</option>
          </select>
        ),
      },
      {
        accessorKey: 'downloaded',
        header: ({ column }) => <SortableHeader label={t('downloaded')} column={column as any} />,
        cell: ({ row }) => (
          <button
            onClick={() => patchBook(row.original._id, { downloaded: !row.original.downloaded })}
            className={`w-full rounded-lg border px-2 py-1 transition ${
              row.original.downloaded
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                : 'border-slate-800 bg-slate-950/30 text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            {row.original.downloaded ? t('yes') : t('no')}
          </button>
        ),
      },
      {
        accessorKey: 'rating',
        header: ({ column }) => <SortableHeader label={t('rating')} column={column as any} />,
        cell: ({ row }) => (
          <StarRating
            value={row.original.rating || 0}
            onChange={(v) => patchBook(row.original._id, { rating: v })}
          />
        ),
      },
      {
        accessorKey: 'finishedDate',
        header: ({ column }) => <SortableHeader label={t('finishedDate')} column={column as any} />,
        cell: ({ row }) => (
          <DatePickerPopover
            value={row.original.finishedDate || null}
            onChange={(v) => patchBook(row.original._id, { finishedDate: v })}
          />
        ),
      },
      {
        accessorKey: 'genre',
        header: ({ column }) => <SortableHeader label={t('genre')} column={column as any} />,
        cell: ({ row }) => (
          <GenreInput
            value={row.original.genre || ''}
            options={genreOptions}
            onChange={(v) => patchBook(row.original._id, { genre: v })}
            onAddOption={(v) => upsertGenreOption(v)}
          />
        ),
      },
      {
        accessorKey: 'language',
        header: ({ column }) => <SortableHeader label={t('language')} column={column as any} />,
        cell: ({ row }) => (
          <InlineText
            value={row.original.language || ''}
            onCommit={(next) => patchBook(row.original._id, { language: next })}
          />
        ),
      },
      {
        accessorKey: 'comment',
        header: ({ column }) => <SortableHeader label={t('comment')} column={column as any} />,
        cell: ({ row }) => (
          <CommentPopover
            value={row.original.comment || ''}
            onChange={(next) => patchBook(row.original._id, { comment: next })}
          />
        ),
      },
    ],
    [t, genreOptions]
  );

  const table = useReactTable({
    data: books,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue || '').trim().toLowerCase();
      if (!q) return true;
      const b = row.original;
      return (
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.genre || '').toLowerCase().includes(q) ||
        (b.language || '').toLowerCase().includes(q) ||
        (b.comment || '').toLowerCase().includes(q)
      );
    },
  });

  const rows = table.getRowModel().rows;

  function SortControl() {
    const [open, setOpen] = React.useState(false);
    const sortables = table
      .getAllLeafColumns()
      .filter((c) => c.getCanSort())
      .map((c) => ({ id: c.id, label: typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id }));

    const active = sorting;
    const primary = active[0];
    const primaryCol = sortables.find((s) => s.id === primary?.id);
    const primaryDir = primary?.desc ? 'desc' : 'asc';

    function updateClause(i: number, patch: Partial<{ id: string; desc: boolean }>) {
      setSorting((prev) => {
        const next = [...prev];
        const cur = next[i] || { id: sortables[0]?.id || 'title', desc: false };
        next[i] = { ...cur, ...patch } as any;
        return next;
      });
    }

    function removeClause(i: number) {
      setSorting((prev) => prev.filter((_, idx) => idx !== i));
    }

    function addClause() {
      const defaultId = sortables.find((s) => !sorting.some((x) => x.id === s.id))?.id || sortables[0]?.id;
      if (!defaultId) return;
      setSorting((prev) => [...prev, { id: defaultId, desc: false }]);
    }

    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        align="left"
        widthClassName="w-[calc(100vw-24px)] sm:w-[360px]"
        trigger={
          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 text-sm hover:bg-slate-900/55 transition shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
          >
            <span className="text-slate-300">{t('sort', { defaultValue: 'Sort' })}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-200">{primaryCol?.label || t('title')}</span>
            <span className="text-slate-400">{primaryDir === 'desc' ? '▼' : '▲'}</span>
          </button>
        }
      >
        <div className="p-3">
          <div className="text-xs text-slate-400">{t('sort', { defaultValue: 'Sort' })}</div>

          <div className="mt-2 grid grid-cols-1 gap-3">
            {active.map((clause, idx) => {
              const dir = clause.desc ? 'desc' : 'asc';
              return (
                <div key={`${clause.id}-${idx}`} className="rounded-2xl border border-slate-800/80 bg-slate-950/20 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-400">#{idx + 1}</div>
                    {idx > 0 ? (
                      <button
                        type="button"
                        onClick={() => removeClause(idx)}
                        className="rounded-xl border border-slate-800 bg-slate-900/35 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900/55 transition"
                      >
                        −
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <select
                      value={clause.id}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateClause(idx, { id: e.target.value })}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                    >
                      {sortables.map((s) => (
                        <option key={s.id} value={s.id}>
                          {String(s.label)}
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateClause(idx, { desc: false })}
                        className={`rounded-2xl border px-3 py-2 text-sm transition ${
                          dir === 'asc'
                            ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200'
                            : 'border-slate-800 bg-slate-900/35 text-slate-200 hover:bg-slate-900/55'
                        }`}
                      >
                        {t('ascending', { defaultValue: 'Ascending' })}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateClause(idx, { desc: true })}
                        className={`rounded-2xl border px-3 py-2 text-sm transition ${
                          dir === 'desc'
                            ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200'
                            : 'border-slate-800 bg-slate-900/35 text-slate-200 hover:bg-slate-900/55'
                        }`}
                      >
                        {t('descending', { defaultValue: 'Descending' })}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addClause}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 text-sm hover:bg-slate-900/55 transition"
            >
              + {t('addSort', { defaultValue: 'Add sort' })}
            </button>
          </div>
        </div>
      </Popover>
    );
  }

  function ViewToggle() {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
            viewMode === 'grid' ? 'bg-slate-950/40 text-white' : 'text-slate-300 hover:bg-slate-900/50'
          }`}
          aria-label="Grid"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:block">{t('grid', { defaultValue: 'Grid' })}</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
            viewMode === 'list' ? 'bg-slate-950/40 text-white' : 'text-slate-300 hover:bg-slate-900/50'
          }`}
          aria-label="List"
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:block">{t('list', { defaultValue: 'List' })}</span>
        </button>
      </div>
    );
  }

  function DetailsSheet({ book }: { book: Book }) {
    const [coverUrl, setCoverUrl] = React.useState<string | null>(book.coverUrl || null);

    React.useEffect(() => {
      setCoverUrl(book.coverUrl || null);
    }, [book.coverUrl]);

    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/60" onClick={() => setDetailsId(null)} />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.99 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute left-1/2 top-0 sm:top-6 w-full sm:w-[calc(100%-24px)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-none sm:rounded-3xl border border-slate-800/80 bg-slate-950/80 backdrop-blur shadow-2xl h-[100vh] sm:h-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
            <div className="min-w-0">
              <div className="text-xs text-slate-400">{t('book', { defaultValue: 'Book' })}</div>
              <div className="truncate text-sm font-medium text-slate-100">{book.title || t('title')}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => deleteBookMutation.mutate(book._id)}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/15 transition"
              >
                {t('delete', { defaultValue: 'Delete' })}
              </button>
              <button
                type="button"
                onClick={() => setDetailsId(null)}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 text-sm hover:bg-slate-900/55 transition"
              >
                {t('close', { defaultValue: 'Close' })}
              </button>
            </div>
          </div>

          <div className="h-[calc(100vh-56px)] sm:h-auto sm:max-h-[70vh] overflow-auto p-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setCoverModalId(book._id)}
                  className="h-[168px] w-[116px] overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/30 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  {coverUrl ? (
                    <img
                      key={coverUrl}
                      src={coverUrl}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full p-3">
                      <div className="h-full w-full rounded-xl bg-gradient-to-br from-slate-900/60 to-slate-950/30" />
                      <div className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">{t('cover', { defaultValue: 'Cover' })}</div>
                    </div>
                  )}
                </button>
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('title')}</div>
                  <div className="mt-1">
                    <BookTitleAutocomplete
                      value={book.title}
                      author={book.author}
                      onApply={(patch) => patchBook(book._id, patch)}
                      placeholder={t('title')}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('author')}</div>
                  <div className="mt-1">
                    <InlineText value={book.author || ''} onCommit={(next) => patchBook(book._id, { author: next })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('status')}</div>
                <select
                  value={book.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => patchBook(book._id, { status: e.target.value as Book['status'] })}
                  className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="to_read">{statusLabel(t, 'to_read')}</option>
                  <option value="reading">{statusLabel(t, 'reading')}</option>
                  <option value="read">{statusLabel(t, 'read')}</option>
                </select>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('downloaded')}</div>
                <button
                  onClick={() => patchBook(book._id, { downloaded: !book.downloaded })}
                  className={`mt-1 w-full rounded-2xl border px-3 py-2 text-sm transition ${
                    book.downloaded
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                      : 'border-slate-800 bg-slate-950/30 text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  {book.downloaded ? t('yes') : t('no')}
                </button>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('rating')}</div>
                <div className="mt-1 rounded-2xl border border-slate-800 bg-slate-950/20 px-2 py-2">
                  <StarRating value={book.rating || 0} onChange={(v) => patchBook(book._id, { rating: v })} />
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('finishedDate')}</div>
                <div className="mt-1">
                  <DatePickerPopover value={book.finishedDate || null} onChange={(v) => patchBook(book._id, { finishedDate: v })} />
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('genre')}</div>
                <div className="mt-1">
                  <GenreInput
                    value={book.genre || ''}
                    options={genreOptions}
                    onChange={(v) => patchBook(book._id, { genre: v })}
                    onAddOption={(v) => upsertGenreOption(v)}
                  />
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('language')}</div>
                <div className="mt-1">
                  <InlineText value={book.language || ''} onCommit={(next) => patchBook(book._id, { language: next })} />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('comment')}</div>
              <div className="mt-1">
                <CommentPopover value={book.comment || ''} onChange={(next) => patchBook(book._id, { comment: next })} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  function CoverModal({
    book,
    onClose,
    onSelectCover,
  }: {
    book: Book;
    onClose: () => void;
    onSelectCover: (url: string | null) => void;
  }) {
    const { t } = useTranslation();
    const [options, setOptions] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [manualUrl, setManualUrl] = React.useState(book.coverUrl || '');
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      let cancelled = false;
      const controller = new AbortController();
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams();
          params.set('title', book.title || '');
          if (book.author) params.set('author', book.author);
          params.set('limit', '10');

          const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`cover_lookup_failed_${res.status}`);
          const json = (await res.json()) as any;
          const docs: any[] = Array.isArray(json?.docs) ? json.docs : [];
          const urls = docs
            .map((d) => (typeof d?.cover_i === 'number' ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null))
            .filter(Boolean) as string[];
          if (!cancelled) setOptions(urls);
        } catch (e: any) {
          if (!cancelled) setError(e?.message || 'cover_lookup_failed');
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      load();
      return () => {
        cancelled = true;
        controller.abort();
      };
    }, [book.title, book.author]);

    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.99 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute left-1/2 top-8 w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/90 backdrop-blur shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
            <div className="min-w-0">
              <div className="text-xs text-slate-400">{t('cover', { defaultValue: 'Cover' })}</div>
              <div className="truncate text-sm font-medium text-slate-100">{book.title || t('title')}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 text-sm hover:bg-slate-900/55 transition"
            >
              {t('close', { defaultValue: 'Close' })}
            </button>
          </div>

          <div className="max-h-[70vh] overflow-auto px-4 py-3 space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('coverOptions', { defaultValue: 'Cover options' })}</div>
              {loading ? (
                <div className="mt-2 text-sm text-slate-300">{t('loading', { defaultValue: 'Loading…' })}</div>
              ) : options.length === 0 ? (
                <div className="mt-2 text-sm text-slate-400">{t('noCoversFound', { defaultValue: 'No covers found' })}</div>
              ) : (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {options.map((url: string) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => onSelectCover(url)}
                      className="group overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
                    >
                      <img src={url} alt={book.title} className="h-40 w-full object-cover transition group-hover:opacity-90" />
                    </button>
                  ))}
                </div>
              )}
              {error ? <div className="mt-2 text-sm text-rose-300">{error}</div> : null}
            </div>

            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('manualCoverUrl', { defaultValue: 'Manual URL' })}</div>
              <input
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectCover(manualUrl || null)}
                  className="rounded-2xl bg-indigo-500/80 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-indigo-500"
                >
                  {t('save', { defaultValue: 'Save' })}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectCover(null)}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/35 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/55"
                >
                  {t('removeCover', { defaultValue: 'Remove cover' })}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  function StatusBadge({ label }: { label: string }) {
    return <span className="rounded-full border border-slate-800 bg-slate-950/30 px-2 py-1 text-[11px] text-slate-200">{label}</span>;
  }

  function BookCompactCard({ book, index }: { book: Book; index: number }) {
    const finishedLabel = React.useMemo(() => {
      if (!book.finishedDate) return null;
      const d = new Date(book.finishedDate);
      if (Number.isNaN(d.getTime())) return null;
      try {
        return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(d);
      } catch {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${yyyy}-${mm}`;
      }
    }, [book.finishedDate]);

    function StatusToggle() {
      const options: { id: Book['status']; label: string }[] = [
        { id: 'to_read', label: t('toRead') },
        { id: 'reading', label: t('reading') },
        { id: 'read', label: t('read') },
      ];

      return (
        <div className="inline-flex overflow-hidden rounded-full border border-slate-800 bg-slate-950/25">
          {options.map((o) => {
            const active = book.status === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  patchBook(book._id, { status: o.id });
                }}
                className={`px-2 py-1 text-[11px] transition ${
                  active
                    ? 'bg-indigo-500/20 text-indigo-100'
                    : 'text-slate-300 hover:bg-slate-900/40'
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut', delay: Math.min(index * 0.02, 0.12) }}
        className="rounded-3xl border border-slate-800/80 bg-slate-900/20 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] hover:bg-slate-900/30 transition"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setDetailsId(book._id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setDetailsId(book._id);
          }}
          className="block w-full text-left cursor-pointer"
          aria-label="Open details"
        >
          <div className="p-2.5">
            <div className="flex items-start gap-3">
              <div className="relative h-20 w-14 overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900/40 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-900/60 via-slate-950/50 to-slate-900/30" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold tracking-tight">{book.title || t('title')}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-400">{book.author || '—'}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBookMutation.mutate(book._id);
                    }}
                    className="shrink-0 rounded-2xl border border-slate-800 bg-slate-950/30 px-2 py-1 text-xs hover:bg-rose-500/20 hover:border-rose-500/40 transition"
                    aria-label="Delete"
                    type="button"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusToggle />

                  {finishedLabel ? <StatusBadge label={finishedLabel} /> : null}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      patchBook(book._id, { downloaded: !book.downloaded });
                    }}
                    className={`rounded-full border px-2 py-1 text-[11px] transition ${
                      book.downloaded
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                        : 'border-slate-800 bg-slate-950/30 text-slate-200 hover:bg-slate-900/50'
                    }`}
                    type="button"
                  >
                    {t('downloaded')}: {book.downloaded ? t('yes') : t('no')}
                  </button>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    role="group"
                    aria-label={t('rating')}
                    className="rounded-full border border-slate-800 bg-slate-950/20 px-2 py-1"
                  >
                    <StarRating value={book.rating || 0} onChange={(v) => patchBook(book._id, { rating: v })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 overflow-x-hidden">
      <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-slate-400">{t('books')}</div>
          <div className="mt-1 text-xs text-slate-500">{t('manageBooksSubtitle')}</div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onAddBook}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_50px_rgba(99,102,241,0.25)] hover:opacity-95 transition disabled:opacity-50 sm:w-auto"
        >
          {t('addBook')}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <TableFilters globalFilter={globalFilter} onGlobalFilterChange={setGlobalFilter} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
          <div className="min-w-0">
            <SortControl />
          </div>
          <div className="min-w-0">
            <ViewToggle />
          </div>
        </div>
      </div>

      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
            : 'grid grid-cols-1 gap-3'
        }
      >
        {rows.map((row, idx) => (
          <BookCompactCard key={row.original._id} book={row.original} index={idx} />
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/20 p-8 text-center text-slate-400">
          {t('addBook')}
        </div>
      ) : null}

      {booksQuery.isError ? (
        <div className="text-sm text-rose-300">{String(booksQuery.error)}</div>
      ) : null}

      <AnimatePresence>
        {detailsBook ? <DetailsSheet book={detailsBook} /> : null}
        {coverModalBook ? (
          <CoverModal
            book={coverModalBook}
            onClose={() => setCoverModalId(null)}
            onSelectCover={(url) => {
              patchBook(coverModalBook._id, { coverUrl: url || null });
              setCoverModalId(null);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
