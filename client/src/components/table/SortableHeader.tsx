import { ArrowUpDown } from 'lucide-react';

export function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: { getCanSort: () => boolean; getIsSorted: () => false | 'asc' | 'desc'; getToggleSortingHandler: () => (() => void) | undefined };
}) {
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={`group inline-flex items-center gap-2 ${canSort ? 'hover:text-white transition' : ''}`}
    >
      <span>{label}</span>
      {canSort ? (
        <span className="opacity-60 group-hover:opacity-100 transition">
          <ArrowUpDown className="h-4 w-4" />
        </span>
      ) : null}
      {sorted ? (
        <span className="text-[10px] text-slate-400">{sorted === 'asc' ? '▲' : '▼'}</span>
      ) : null}
    </button>
  );
}
