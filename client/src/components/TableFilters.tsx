import React from 'react';

type Props = {
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
};

export function TableFilters({ globalFilter, onGlobalFilterChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <input
        value={globalFilter}
        onChange={(e) => onGlobalFilterChange(e.target.value)}
        placeholder="Search…"
        className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/30 px-4 py-3 text-sm outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-indigo-500/35"
      />
    </div>
  );
}
