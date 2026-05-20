import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <button
        type="button"
        onClick={() => onViewModeChange('grid')}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
          viewMode === 'grid' ? 'bg-slate-950/40 text-white' : 'text-slate-300 hover:bg-slate-900/50'
        }`}
        aria-label={t('viewGrid')}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:block">{t('viewGrid')}</span>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('list')}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
          viewMode === 'list' ? 'bg-slate-950/40 text-white' : 'text-slate-300 hover:bg-slate-900/50'
        }`}
        aria-label={t('viewList')}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:block">{t('viewList')}</span>
      </button>
    </div>
  );
}
