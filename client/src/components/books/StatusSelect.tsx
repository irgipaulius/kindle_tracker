import React from 'react';
import { Book } from '../../lib/api';

interface StatusSelectProps {
  value: Book['status'];
  onChange: (status: Book['status']) => void;
  t: (key: string) => string;
  size?: 'sm' | 'md';
}

export function StatusSelect({ value, onChange, t, size = 'sm' }: StatusSelectProps) {
  const options: { id: Book['status']; label: string }[] = [
    { id: 'to_read', label: t('toRead') },
    { id: 'reading', label: t('reading') },
    { id: 'read', label: t('read') },
  ];

  const sizeClasses = {
    sm: 'rounded-full text-[11px] px-2 py-1',
    md: 'rounded-xl text-sm px-4 py-2.5',
  };

  return (
    <div className={`inline-flex overflow-hidden border border-slate-800 bg-slate-950/25 ${size === 'sm' ? 'rounded-full' : 'rounded-xl'}`}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`transition ${sizeClasses[size]} ${
              active
                ? 'bg-indigo-500/20 text-indigo-100'
                : 'text-slate-300 hover:bg-slate-900/40'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
