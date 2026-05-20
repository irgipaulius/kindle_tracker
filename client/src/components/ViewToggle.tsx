import React from 'react';
import { useTranslation } from 'react-i18next';
import { LampDesk, LayoutGrid, List } from 'lucide-react';

import type { BooksViewMode } from '../lib/booksViewMode';

interface ViewToggleProps {
  viewMode: BooksViewMode;
  onViewModeChange: (mode: BooksViewMode) => void;
}

const MODES: { id: BooksViewMode; icon: React.ReactNode; labelKey: string }[] = [
  { id: 'grid', icon: <LayoutGrid className="h-4 w-4 shrink-0" />, labelKey: 'viewGrid' },
  { id: 'list', icon: <List className="h-4 w-4 shrink-0" />, labelKey: 'viewList' },
  { id: 'library', icon: <LampDesk className="h-4 w-4 shrink-0" />, labelKey: 'viewLibrary' },
];

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  const { t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('viewMode')}
      className="inline-flex w-fit max-w-full shrink-0 items-center gap-0.5 rounded-2xl border border-slate-800/80 bg-slate-900/35 p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
    >
      {MODES.map(({ id, icon, labelKey }) => (
        <button
          key={id}
          type="button"
          onClick={() => onViewModeChange(id)}
          className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-sm transition sm:gap-2 sm:px-3 ${
            viewMode === id ? 'bg-slate-950/40 text-white' : 'text-slate-300 hover:bg-slate-900/50'
          }`}
          aria-pressed={viewMode === id}
          aria-label={t(labelKey)}
          title={t(labelKey)}
        >
          {icon}
          <span className="hidden min-[420px]:inline">{t(labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
