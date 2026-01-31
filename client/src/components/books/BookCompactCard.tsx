import React from 'react';
import { motion } from 'framer-motion';
import { Book } from '../../lib/api';
import { StarRating } from '../StarRating';
import { StatusBadge } from './StatusBadge';

interface BookCompactCardProps {
  book: Book;
  index: number;
  onPatchBook: (id: string, patch: Partial<Book>) => void;
  onDelete: (id: string) => void;
  onOpenDetails: (id: string) => void;
  t: (key: string) => string;
}

export function BookCompactCard({ book, index, onPatchBook, onDelete, onOpenDetails, t }: BookCompactCardProps) {
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
                onPatchBook(book._id, { status: o.id });
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
        onClick={() => onOpenDetails(book._id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpenDetails(book._id);
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
                    onDelete(book._id);
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
                    onPatchBook(book._id, { downloaded: !book.downloaded });
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
                  <StarRating value={book.rating || 0} onChange={(v) => onPatchBook(book._id, { rating: v })} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
