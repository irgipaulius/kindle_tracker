import React from 'react';
import { motion } from 'framer-motion';
import { Book } from '../../lib/api';
import { BookTitleAutocomplete } from '../BookTitleAutocomplete';
import { CommentPopover } from '../CommentPopover';
import { DatePickerPopover } from '../DatePickerPopover';
import { GenreInput } from '../GenreInput';
import { StarRating } from '../StarRating';
import { InlineText } from '../table/InlineText';
import { statusLabel } from '../../utils/bookHelpers';

interface BookDetailsSheetProps {
  book: Book;
  onClose: () => void;
  onPatchBook: (id: string, patch: Partial<Book>) => void;
  onDelete: (id: string) => void;
  onOpenCoverModal: () => void;
  genreOptions: string[];
  onAddGenre: (value: string) => void;
  t: (key: string) => string;
}

export function BookDetailsSheet({ 
  book, 
  onClose, 
  onPatchBook, 
  onDelete, 
  onOpenCoverModal, 
  genreOptions, 
  onAddGenre, 
  t 
}: BookDetailsSheetProps) {
  const [coverUrl, setCoverUrl] = React.useState<string | null>(book.coverUrl || null);

  React.useEffect(() => {
    setCoverUrl(book.coverUrl || null);
  }, [book.coverUrl]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
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
            <div className="text-xs text-slate-400">{t('book')}</div>
            <div className="truncate text-sm font-medium text-slate-100">{book.title || t('title')}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDelete(book._id)}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/15 transition"
            >
              {t('delete')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 text-sm hover:bg-slate-900/55 transition"
            >
              {t('close')}
            </button>
          </div>
        </div>

        <div className="h-[calc(100vh-56px)] sm:h-auto sm:max-h-[70vh] overflow-auto p-4">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <button
                type="button"
                onClick={onOpenCoverModal}
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
                    <div className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">{t('cover')}</div>
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
                    onApply={(patch) => onPatchBook(book._id, patch)}
                    placeholder={t('title')}
                  />
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('author')}</div>
                <div className="mt-1">
                  <InlineText value={book.author || ''} onCommit={(next) => onPatchBook(book._id, { author: next })} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('status')}</div>
              <select
                value={book.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onPatchBook(book._id, { status: e.target.value as Book['status'] })}
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
                onClick={() => onPatchBook(book._id, { downloaded: !book.downloaded })}
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
                <StarRating value={book.rating || 0} onChange={(v) => onPatchBook(book._id, { rating: v })} />
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('finishedDate')}</div>
              <div className="mt-1">
                <DatePickerPopover value={book.finishedDate || null} onChange={(v) => onPatchBook(book._id, { finishedDate: v })} />
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('genre')}</div>
              <div className="mt-1">
                <GenreInput
                  value={book.genre || ''}
                  options={genreOptions}
                  onChange={(v) => onPatchBook(book._id, { genre: v })}
                  onAddOption={(v) => onAddGenre(v)}
                />
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('language')}</div>
              <div className="mt-1">
                <InlineText value={book.language || ''} onCommit={(next) => onPatchBook(book._id, { language: next })} />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('comment')}</div>
            <div className="mt-1">
              <CommentPopover value={book.comment || ''} onChange={(next) => onPatchBook(book._id, { comment: next })} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
