import React from 'react';
import { Popover } from './Popover';

type Props = {
  value?: string;
  onChange: (value: string) => void;
};

export function CommentPopover({ value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value || '');
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    setDraft(value || '');
  }, [value]);

  React.useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [open]);

  function autosize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setDraft(value || '');
      }}
      align="right"
      widthClassName="w-[420px]"
      trigger={
        <button
          type="button"
          className="w-full text-left rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-1 hover:bg-slate-900/50 transition"
        >
          {value ? (
            <span className="block truncate text-slate-200">{value}</span>
          ) : (
            <span className="text-slate-500">—</span>
          )}
        </button>
      }
    >
      <div className="p-3">
        <div className="text-xs text-slate-400">Comment</div>
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          onInput={autosize}
          className="mt-2 w-full resize-none rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
          rows={4}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm hover:bg-slate-900/70 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(draft);
              setOpen(false);
            }}
            className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition"
          >
            Save
          </button>
        </div>
      </div>
    </Popover>
  );
}
