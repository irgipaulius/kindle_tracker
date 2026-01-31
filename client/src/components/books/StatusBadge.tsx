export function StatusBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-slate-800 bg-slate-950/30 px-2 py-1 text-[11px] text-slate-200">{label}</span>;
}
