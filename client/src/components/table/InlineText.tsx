import React from 'react';

interface InlineTextProps {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
}

export function InlineText({ value, onCommit, placeholder = '—' }: InlineTextProps) {
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const el = inputRef.current;
    const focused = typeof document !== 'undefined' ? document.activeElement === el : false;
    if (!focused) setDraft(value);
  }, [value]);

  const commitIfChanged = React.useCallback(() => {
    if (draft !== value) onCommit(draft);
  }, [draft, value, onCommit]);

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
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
          setDraft(value);
          inputRef.current?.blur();
        }
      }}
      className="w-full rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/40"
      placeholder={placeholder}
    />
  );
}
