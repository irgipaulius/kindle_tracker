import React from 'react';

import { Popover } from './Popover';

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
  const [month, setMonth] = React.useState<number>(selected?.getMonth() ?? now.getMonth());

  React.useEffect(() => {
    if (!open) return;
    if (!selected) return;
    setYear(selected.getFullYear());
    setMonth(selected.getMonth());
  }, [open, selected]);

  const years = React.useMemo(() => {
    const y = now.getFullYear();
    const out: number[] = [];
    for (let i = y - 20; i <= y + 2; i++) out.push(i);
    return out;
  }, [now]);

  const monthNames = React.useMemo(() => {
    try {
      const fmt = new Intl.DateTimeFormat(undefined, { month: 'short' });
      return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2020, i, 1)));
    } catch {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
  }, []);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="left"
      widthClassName="w-[320px]"
      trigger={
        <button
          type="button"
          className="w-full text-left rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-1 hover:bg-slate-900/50 transition"
        >
          {selected ? toMonthLabel(selected) : <span className="text-slate-500">{placeholder}</span>}
        </button>
      }
    >
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={month}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMonth(Number(e.target.value))}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            {monthNames.map((label, idx) => (
              <option key={label} value={idx}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setYear(Number(e.target.value))}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex justify-between">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm hover:bg-slate-900/70 transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(toFirstOfMonthISO(year, month));
              setOpen(false);
            }}
            className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition"
          >
            Done
          </button>
        </div>
      </div>
    </Popover>
  );
}
