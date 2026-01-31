import React from 'react';

export function FinishedDateBadge({ 
  finishedDate, 
  t 
}: { 
  finishedDate?: Date | string | null;
  t: (key: string) => string;
}) {
  const label = React.useMemo(() => {
    if (!finishedDate) return null;
    const d = typeof finishedDate === 'string' ? new Date(finishedDate) : finishedDate;
    if (Number.isNaN(d.getTime())) return null;
    try {
      return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(d);
    } catch {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${yyyy}-${mm}`;
    }
  }, [finishedDate]);

  if (!label) return null;

  return (
    <span className="rounded-full border border-slate-800 bg-slate-950/30 px-2 py-1 text-[11px] text-slate-200">
      {label}
    </span>
  );
}
