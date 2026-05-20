import React from 'react';

type BrandMarkProps = {
  /** sm = dashboard header (36px), md = login card (40px) */
  size?: 'sm' | 'md';
};

const config = {
  sm: { box: 'h-9 w-9', padding: 'p-1.5' },
  md: { box: 'h-10 w-10', padding: 'p-2' },
} as const;

export function BrandMark({ size = 'sm' }: BrandMarkProps) {
  const { box, padding } = config[size];

  return (
    <div className="relative shrink-0">
      <div
        className={`relative ${box} rounded-2xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_40px_rgba(99,102,241,0.25)]`}
      >
        <img
          src="/favicon.png"
          alt=""
          aria-hidden
          className={`absolute inset-0 h-full w-full rounded-2xl object-contain mix-blend-screen ${padding}`}
        />
      </div>
      <div className="pointer-events-none absolute -inset-2 rounded-[22px] bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-cyan-400/10 blur-xl" />
    </div>
  );
}
