import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { api } from '../lib/api';
import { parseSpreadsheetText } from '../lib/parseSpreadsheet';
import { useMobileBackClose } from '../hooks/useMobileBackClose';

export function SpreadsheetImport() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [replace, setReplace] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useMobileBackClose(open, () => setOpen(false), 'import-panel');

  async function onFile(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      const books = parseSpreadsheetText(text);
      if (!books.length) {
        setMessage(t('importNoRows'));
        return;
      }
      const result = await api.importBooks(books, replace);
      await queryClient.invalidateQueries({ queryKey: ['books'] });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await queryClient.invalidateQueries({ queryKey: ['library'] });
      setMessage(t('importSuccess', { count: result.imported }));
    } catch (e) {
      const err = e instanceof Error ? e.message : 'import_failed';
      setMessage(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-20 max-w-sm">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 backdrop-blur shadow-lg"
        >
          {t('importOpen')}
        </button>
      ) : (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-medium text-slate-200">{t('importTitle')}</div>
              <div className="mt-1 text-xs text-slate-500">{t('importHint')}</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-300 text-sm"
              aria-label={t('close')}
            >
              ✕
            </button>
          </div>

          <label className="mt-3 flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
              className="rounded border-slate-700"
            />
            {t('importReplace')}
          </label>

          <input
            ref={inputRef}
            type="file"
            accept=".tsv,.csv,.txt,text/tab-separated-values,text/csv"
            className="mt-3 block w-full text-xs text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:text-slate-200"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
              e.target.value = '';
            }}
          />

          {busy ? <div className="mt-2 text-xs text-slate-400">{t('loading')}</div> : null}
          {message ? <div className="mt-2 text-xs text-slate-300 break-words">{message}</div> : null}
        </div>
      )}
    </div>
  );
}
