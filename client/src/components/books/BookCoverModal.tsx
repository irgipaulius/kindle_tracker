import React from 'react';
import { motion } from 'framer-motion';
import { Book } from '../../lib/api';

interface BookCoverModalProps {
  book: Book;
  onClose: () => void;
  onSelectCover: (url: string | null) => void;
  t: (key: string) => string;
}

export function BookCoverModal({ book, onClose, onSelectCover, t }: BookCoverModalProps) {
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
            <div className="text-xs text-slate-400">{t('cover')}</div>
            <div className="truncate text-sm font-medium text-slate-100">{book.title || t('title')}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 text-sm hover:bg-slate-900/55 transition"
          >
            {t('close')}
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto px-4 py-3 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('coverOptions')}</div>
            {loading ? (
              <div className="mt-2 text-sm text-slate-300">{t('loading')}</div>
            ) : options.length === 0 ? (
              <div className="mt-2 text-sm text-slate-400">{t('noCoversFound')}</div>
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
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{t('manualCoverUrl')}</div>
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
                {t('save')}
              </button>
              <button
                type="button"
                onClick={() => onSelectCover(null)}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/35 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/55"
              >
                {t('removeCover')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
