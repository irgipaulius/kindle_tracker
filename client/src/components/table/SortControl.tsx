import React from 'react';
import { SortingState } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Popover } from '../Popover';

interface SortControlProps {
  sorting: SortingState;
  onSortingChange: (sorting: SortingState | ((prev: SortingState) => SortingState)) => void;
  onClearSorting: () => void;
  availableColumns: { id: string; label: string }[];
}

export function SortControl({ sorting, onSortingChange, onClearSorting, availableColumns }: SortControlProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const active = sorting;
  const primary = active[0];
  const primaryCol = availableColumns.find((s) => s.id === primary?.id);
  const primaryDir = primary?.desc ? 'desc' : 'asc';

  function updateClause(i: number, patch: Partial<{ id: string; desc: boolean }>) {
    onSortingChange((prev: SortingState) => {
      const next = [...prev];
      const cur = next[i] || { id: availableColumns[0]?.id || 'title', desc: false };
      next[i] = { ...cur, ...patch } as SortingState[number];
      return next;
    });
  }

  function removeClause(i: number) {
    onSortingChange((prev: SortingState) => prev.filter((_, idx) => idx !== i));
  }

  function addClause() {
    const defaultId =
      availableColumns.find((s) => !sorting.some((x) => x.id === s.id))?.id || availableColumns[0]?.id;
    if (!defaultId) return;
    onSortingChange((prev: SortingState) => [...prev, { id: defaultId, desc: false }]);
  }

  function clearAll() {
    onClearSorting();
    setOpen(false);
  }

  const hasSort = active.length > 0;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="left"
      widthClassName="w-[calc(100vw-24px)] sm:w-[360px]"
      trigger={
        <button
          type="button"
          className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition shadow-[0_0_0_1px_rgba(255,255,255,0.03)] ${
            hasSort
              ? 'border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/15'
              : 'border-slate-800/80 bg-slate-900/35 hover:bg-slate-900/55'
          }`}
        >
          <span className="text-slate-300">{t('sort')}</span>
          {hasSort ? (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-slate-200">{primaryCol?.label || t('title')}</span>
              <span className="text-slate-400">{primaryDir === 'desc' ? '▼' : '▲'}</span>
            </>
          ) : (
            <span className="text-slate-500">{t('sortNone')}</span>
          )}
        </button>
      }
    >
      <div className="p-3">
        <div className="text-xs text-slate-400">{t('sort')}</div>

        <div className="mt-2 grid grid-cols-1 gap-3">
          {active.map((clause, idx) => {
            const dir = clause.desc ? 'desc' : 'asc';
            return (
              <div
                key={`${clause.id}-${idx}`}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/20 p-2"
              >
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      updateClause(idx, { id: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {availableColumns.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
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
                      {t('ascending')}
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
                      {t('descending')}
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
            + {t('addSort')}
          </button>

          {hasSort ? (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/55 hover:text-white transition"
            >
              {t('clearSort')}
            </button>
          ) : null}
        </div>
      </div>
    </Popover>
  );
}
