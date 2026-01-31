import React from 'react';
import { Popover } from './Popover';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Props = {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
};

function isoToDate(value?: string | null) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function toMonthLabel(d: Date) {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(d);
  } catch {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }
}

function toFirstOfMonthISO(year: number, monthIndex0: number) {
  const d = new Date(year, monthIndex0, 1);
  return d.toISOString();
}

export function DatePickerPopover({ value, onChange, placeholder = '—' }: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = isoToDate(value);
  const now = React.useMemo(() => new Date(), []);
  const [year, setYear] = React.useState<number>(selected?.getFullYear() ?? now.getFullYear());

  React.useEffect(() => {
    if (!open) return;
    if (!selected) return;
    setYear(selected.getFullYear());
  }, [open, selected]);

  const monthNames = React.useMemo(() => {
    try {
      const fmt = new Intl.DateTimeFormat(undefined, { month: 'short' });
      return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2020, i, 1)));
    } catch {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
  }, []);

  const handleMonthClick = (monthIndex: number) => {
    onChange(toFirstOfMonthISO(year, monthIndex));
    setOpen(false);
  };

  const selectedMonth = selected?.getFullYear() === year ? selected.getMonth() : null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="left"
      widthClassName="w-auto"
      trigger={
        <button
          type="button"
          className="inline-block rounded-full border border-slate-800 bg-slate-950/30 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-900/50 transition"
        >
          {selected ? toMonthLabel(selected) : <span className="text-slate-500">{placeholder}</span>}
        </button>
      }
    >
      <div className="p-4 min-w-[320px] sm:min-w-[380px] pointer-events-auto">
        {/* Year Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setYear(year - 1)}
            className="rounded-lg p-2 hover:bg-slate-800/50 transition pointer-events-auto"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-lg font-semibold">{year}</div>
          <button
            type="button"
            onClick={() => setYear(year + 1)}
            className="rounded-lg p-2 hover:bg-slate-800/50 transition pointer-events-auto"
            aria-label="Next year"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 12-Month Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {monthNames.map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleMonthClick(idx)}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition pointer-events-auto ${
                selectedMonth === idx
                  ? 'bg-indigo-500 text-white'
                  : 'border border-slate-800 bg-slate-950/30 text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Clear Button */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm hover:bg-slate-900/70 transition pointer-events-auto"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>
    </Popover>
  );
}
