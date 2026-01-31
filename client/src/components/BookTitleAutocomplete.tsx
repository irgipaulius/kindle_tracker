import React from 'react';

type Suggestion = {
  key: string;
  title: string;
  author?: string;
  coverUrl?: string | null;
};

type Props = {
  value: string;
  author?: string;
  onApply: (patch: { title: string; author?: string; coverUrl?: string | null }) => void;
  placeholder?: string;
};

function normalize(s: string) {
  return s.trim();
}

function buildCoverUrl(coverId?: number) {
  if (typeof coverId !== 'number') return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
}

export function BookTitleAutocomplete({ value, author, onApply, placeholder = 'Title' }: Props) {
  const [draft, setDraft] = React.useState(value || '');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const [armed, setArmed] = React.useState(false);

  const requestSeq = React.useRef(0);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const el = inputRef.current;
    const focused = typeof document !== 'undefined' ? document.activeElement === el : false;
    if (!focused) setDraft(value || '');
  }, [value]);

  React.useEffect(() => {
    if (!open) return;

    function onDocMouseDown(e: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setOpen(false);
      setActiveIndex(-1);
    }

    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  React.useEffect(() => {
    const q = normalize(draft);
    if (!armed) {
      setOpen(false);
      setLoading(false);
      return;
    }
    if (!q) {
      setItems([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const seq = ++requestSeq.current;

    const handle = window.setTimeout(async () => {
      const query = normalize(draft);
      if (!query) return;

      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set('title', query);
        if (author) params.set('author', author);
        params.set('limit', '8');

        const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`suggestions_failed_${res.status}`);

        const json = (await res.json()) as any;
        const docs: any[] = Array.isArray(json?.docs) ? json.docs : [];

        const mapped: Suggestion[] = docs
          .map((d) => {
            const t = typeof d?.title === 'string' ? d.title : '';
            const a =
              Array.isArray(d?.author_name) && typeof d.author_name[0] === 'string' ? d.author_name[0] : undefined;
            const coverUrl = buildCoverUrl(typeof d?.cover_i === 'number' ? d.cover_i : undefined);

            const key = String(d?.key || `${t}__${a || ''}__${coverUrl || ''}`);
            return { key, title: t, author: a, coverUrl };
          })
          .filter((x) => x.title);

        if (requestSeq.current !== seq) return;
        setItems(mapped);
        setOpen(mapped.length > 0);
        setActiveIndex(mapped.length ? 0 : -1);
      } catch {
        if (requestSeq.current !== seq) return;
        setItems([]);
        setOpen(false);
      } finally {
        if (requestSeq.current !== seq) return;
        setLoading(false);
      }
    }, 1000);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [draft, author]);

  function applyTyped() {
    const title = normalize(draft);
    if (!title) return;
    onApply({ title });
    setOpen(false);
    setActiveIndex(-1);
    setArmed(false);
  }

  function applySuggestion(s: Suggestion) {
    const title = normalize(s.title);
    if (!title) return;
    onApply({ title, author: s.author, coverUrl: s.coverUrl });
    setDraft(title);
    setOpen(false);
    setActiveIndex(-1);
    setArmed(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setArmed(true);
            setOpen(true);
          }}
          onFocus={() => {
            setArmed(true);
            if (items.length) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyTyped();
              return;
            }
            if (e.key === 'Escape') {
              setOpen(false);
              setActiveIndex(-1);
              return;
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!open) setOpen(true);
              setActiveIndex((i) => {
                const next = i + 1;
                return Math.min(items.length - 1, Math.max(0, next));
              });
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => {
                const next = i - 1;
                return Math.min(items.length - 1, Math.max(0, next));
              });
              return;
            }
          }}
          className="w-full rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />

        {loading ? (
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">
            Loading…
          </div>
        ) : null}
      </div>

      {open && items.length ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur shadow-2xl">
          <div className="max-h-64 overflow-auto p-1">
            {items.map((s, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={s.key}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(s)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    active ? 'bg-slate-900/60 text-white' : 'text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{s.title}</div>
                    {s.author ? <div className="mt-0.5 truncate text-xs text-slate-400">{s.author}</div> : null}
                  </div>
                  {s.coverUrl ? (
                    <div className="shrink-0">
                      <img
                        src={s.coverUrl}
                        alt=""
                        className="h-10 w-7 rounded-md border border-slate-800 object-cover bg-slate-900/40"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="shrink-0 text-[11px] text-slate-500">no cover</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
