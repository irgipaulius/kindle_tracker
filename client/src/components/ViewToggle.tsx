import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <button
        type="button"
        onClick={() => onViewModeChange('grid')}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
          viewMode === 'grid' ? 'bg-slate-950/40 text-white' : 'text-slate-300 hover:bg-slate-900/50'
        }`}
        aria-label="Grid"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:block">Grid</span>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('list')}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
          viewMode === 'list' ? 'bg-slate-950/40 text-white' : 'text-slate-300 hover:bg-slate-900/50'
        }`}
        aria-label="List"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:block">List</span>
      </button>
    </div>
  );
}
