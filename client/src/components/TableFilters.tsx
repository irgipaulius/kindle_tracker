import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

type Props = {
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  onClearFilter: () => void;
};

export function TableFilters({ globalFilter, onGlobalFilterChange, onClearFilter }: Props) {
  const { t } = useTranslation();
  const hasFilter = globalFilter.trim().length > 0;

  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <input
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          placeholder={t('search')}
          className={`w-full rounded-2xl border bg-slate-900/30 py-3 text-sm outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-indigo-500/35 ${
            hasFilter
              ? 'border-indigo-500/30 pl-4 pr-10'
              : 'border-slate-800/80 px-4'
          }`}
        />
        {hasFilter ? (
          <button
            type="button"
            onClick={onClearFilter}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition"
            aria-label={t('clearFilter')}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
