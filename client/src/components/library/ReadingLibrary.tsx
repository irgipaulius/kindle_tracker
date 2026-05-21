import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LampDesk } from 'lucide-react';

import { api } from '../../lib/api';
import {
  buildLibraryCases,
  filterLibraryBooks,
  type LibraryOrganizeBy,
} from './libraryLayout';
import { LibraryBookcase } from './LibraryBookcase';
import { useTouchLikeUI } from './useLibraryCaseCapacity';
import { useMobileBackClose } from '../../hooks/useMobileBackClose';

const ORGANIZE_STORAGE_KEY = 'library.organizeBy';

function loadOrganizeBy(): LibraryOrganizeBy {
  const saved = window.localStorage.getItem(ORGANIZE_STORAGE_KEY);
  if (saved === 'genre' || saved === 'year' || saved === 'month' || saved === 'rating' || saved === 'author') {
    return saved;
  }
  return 'genre';
}

type Props = {
  onBookSelect?: (bookId: string) => void;
  searchQuery?: string;
  genreOrder?: string[];
};

export function ReadingLibrary({ onBookSelect, searchQuery = '', genreOrder = [] }: Props) {
  const { t, i18n } = useTranslation();
  const [organizeBy, setOrganizeBy] = React.useState<LibraryOrganizeBy>(loadOrganizeBy);
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const touchLike = useTouchLikeUI();

  useMobileBackClose(
    touchLike && previewId !== null,
    () => setPreviewId(null),
    previewId ? `library-preview:${previewId}` : 'library-preview:none'
  );

  React.useEffect(() => {
    if (!previewId) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (
        target.closest('.library-book-slot') ||
        target.closest('.library-book-flip') ||
        target.closest('.library-book-flip-hit') ||
        target.closest('.library-book-flip-hover')
      ) {
        return;
      }
      setPreviewId(null);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [previewId]);

  React.useEffect(() => {
    window.localStorage.setItem(ORGANIZE_STORAGE_KEY, organizeBy);
  }, [organizeBy]);

  const libraryQuery = useQuery({
    queryKey: ['library'],
    queryFn: api.getLibrary,
    staleTime: 2 * 60 * 1000,
  });

  const allBooks = libraryQuery.data?.books ?? [];
  const stats = libraryQuery.data?.stats;
  const filtered = filterLibraryBooks(allBooks, searchQuery);
  const labels = {
    uncategorized: t('libraryUncategorized'),
    unfinished: t('libraryUnfinished'),
    noStars: t('libraryNoStars'),
    stars: t('libraryStars'),
  };
  const cases = buildLibraryCases(
    filtered,
    organizeBy,
    genreOrder,
    labels,
    i18n.language === 'fr' ? 'fr-FR' : 'en-US'
  );
  const filteredOut = searchQuery.trim().length > 0 && filtered.length === 0 && allBooks.length > 0;

  if (libraryQuery.isLoading) {
    return (
      <div className="study-room rounded-3xl border border-slate-800/60 p-4 sm:p-6">
        <div className="study-cabinet animate-pulse p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-4 h-28 rounded-lg bg-slate-800/40" />
          ))}
        </div>
      </div>
    );
  }

  if (!allBooks.length) {
    return (
      <div className="study-room rounded-3xl border border-dashed border-slate-700/50 px-6 py-12 text-center">
        <LampDesk className="mx-auto h-8 w-8 text-violet-400/50" />
        <p className="mt-3 text-sm text-slate-400">{t('libraryEmpty')}</p>
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="study-room rounded-3xl border border-dashed border-slate-700/50 px-6 py-12 text-center">
        <p className="text-sm text-slate-400">{filteredOut ? t('libraryNoMatch') : t('libraryEmpty')}</p>
      </div>
    );
  }

  return (
    <section className="study-room relative overflow-x-hidden overflow-y-visible rounded-3xl border border-slate-800/70">
      <header className="relative z-10 flex flex-wrap items-end justify-between gap-3 border-b border-slate-800/80 bg-slate-950/40 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
            <LampDesk className="h-4 w-4 text-violet-400/80" />
            {t('libraryTitle')}
          </div>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-100 sm:text-lg">
            {t('librarySubtitle', { count: stats?.totalRead ?? allBooks.length })}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stats && stats.avgRating > 0 ? (
            <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-100">
              {t('libraryAvgRating', { rating: stats.avgRating })}
            </span>
          ) : null}
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline">{t('libraryOrganizeBy')}</span>
            <select
              value={organizeBy}
              onChange={(e) => setOrganizeBy(e.target.value as LibraryOrganizeBy)}
              className="max-w-[11rem] rounded-lg border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              <option value="genre">{t('libraryByGenre')}</option>
              <option value="year">{t('libraryByYear')}</option>
              <option value="month">{t('libraryByMonth')}</option>
              <option value="rating">{t('libraryByRating')}</option>
              <option value="author">{t('libraryByAuthor')}</option>
            </select>
          </label>
        </div>
      </header>

      <div className="relative z-10 px-3 py-4 sm:px-5 sm:py-5">
        <div className="study-cabinet">
          <div className="study-cabinet-inner">
            {cases.map((caseData) => (
              <LibraryBookcase
                key={caseData.caseKey}
                caseData={caseData}
                previewId={previewId}
                touchLike={touchLike}
                onPreviewOpen={setPreviewId}
                onPreviewClose={(id) => setPreviewId((cur) => (cur === id ? null : cur))}
                onBookSelect={(id) => {
                  setPreviewId(null);
                  onBookSelect?.(id);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
