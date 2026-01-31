import React from 'react';

type Props = {
  value?: string;
  options: string[];
  onChange: (value: string) => void;
  onAddOption: (value: string) => void;
};

export function GenreInput({ value, options, onChange, onAddOption }: Props) {
  const [draft, setDraft] = React.useState(value || '');
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const commitIfChanged = React.useCallback(() => {
    const next = draft;
    if ((value || '') !== next) onChange(next);
  }, [draft, onChange, value]);

  const id = React.useId();

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          setDraft(v);
        }}
        onBlur={() => {
          commitIfChanged();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitIfChanged();
            inputRef.current?.blur();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value || '');
            inputRef.current?.blur();
          }
        }}
        list={id}
        className="w-full rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/40"
        placeholder="—"
      />
      <datalist id={id}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <button
        type="button"
        onClick={() => {
          const v = (draft || '').trim();
          if (!v) return;
          onAddOption(v);
        }}
        className="shrink-0 rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-1 text-xs text-slate-300 hover:bg-slate-900/50 transition"
      >
        Add
      </button>
    </div>
  );
}
