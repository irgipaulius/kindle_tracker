import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';

import { Book } from '../lib/api';
import { BookTitleAutocomplete } from '../components/BookTitleAutocomplete';
import { CommentPopover } from '../components/CommentPopover';
import { DatePickerPopover } from '../components/DatePickerPopover';
import { GenreInput } from '../components/GenreInput';
import { StarRating } from '../components/StarRating';
import { TableFilters } from '../components/TableFilters';
import { ViewToggle } from '../components/ViewToggle';
import { SortControl } from '../components/table/SortControl';
import { SortableHeader } from '../components/table/SortableHeader';
import { InlineText } from '../components/table/InlineText';
import { BookCompactCard } from '../components/books/BookCompactCard';
import { BookDetailsSheet } from '../components/books/BookDetailsSheet';
import { useBookQueries } from '../hooks/useBookQueries';
import { useBookMutations } from '../hooks/useBookMutations';

export function BooksScreen() {
  const { t } = useTranslation();
  const { books, genreOptions, isLoading, isError, error } = useBookQueries();
  const { patchBook, createBook, deleteBook, upsertGenre, saveSorting } = useBookMutations();

  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>(() => {
    const saved = window.localStorage.getItem('books.viewMode');
    return saved === 'list' || saved === 'grid' ? saved : 'grid';
  });

  React.useEffect(() => {
    window.localStorage.setItem('books.viewMode', viewMode);
  }, [viewMode]);

  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const detailsBook = React.useMemo(() => books.find((b) => b._id === detailsId) || null, [books, detailsId]);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      if (sorting.length === 0) return;
      saveSorting(sorting.map((s) => ({ id: s.id, desc: Boolean(s.desc) })));
    }, 500);
    return () => window.clearTimeout(handle);
  }, [sorting, saveSorting]);

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
            <option value="to_read">{t('toRead')}</option>
            <option value="reading">{t('reading')}</option>
            <option value="read">{t('read')}</option>
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
            onAddOption={(v) => upsertGenre(v)}
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
    [t, genreOptions, patchBook, upsertGenre]
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

  async function onAddBook() {
    const newBook = await createBook({ title: '' });
    if (newBook?._id) {
      setDetailsId(newBook._id);
    }
  }

  const availableColumns = useMemo(() => {
    return table
      .getAllLeafColumns()
      .filter((c) => c.getCanSort())
      .map((c) => ({ id: c.id, label: typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id }));
  }, [table]);

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
            <SortControl sorting={sorting} onSortingChange={setSorting} availableColumns={availableColumns} />
          </div>
          <div className="min-w-0">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
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
          <BookCompactCard
            key={row.original._id}
            book={row.original}
            index={idx}
            onPatchBook={patchBook}
            onDelete={deleteBook}
            onOpenDetails={setDetailsId}
            t={t}
          />
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/20 p-8 text-center text-slate-400">
          {t('addBook')}
        </div>
      ) : null}

      {isError ? (
        <div className="text-sm text-rose-300">{String(error)}</div>
      ) : null}

      <motion.div>
        {detailsBook ? (
          <BookDetailsSheet
            book={detailsBook}
            onClose={() => setDetailsId(null)}
            onPatchBook={patchBook}
            onDelete={deleteBook}
            genreOptions={genreOptions}
            onAddGenre={upsertGenre}
            t={t}
          />
        ) : null}
      </motion.div>
    </div>
  );
}
