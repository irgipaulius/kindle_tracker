import { motion, useReducedMotion } from 'framer-motion';

import type { ShelfBook } from '../../lib/api';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

type Props = {
  book: ShelfBook;
  spine: string;
  dateLabel: string | null;
  touchLike: boolean;
};

/** Silk ribbon in the gutter — warm if finished, cool if still an open chapter. */
function GutterBookmark({ finished }: { finished: boolean }) {
  const ribbon = finished
    ? 'linear-gradient(180deg, #e8c96a 0%, #b8862b 55%, #8b5e1a 100%)'
    : 'linear-gradient(180deg, #c4b5fd 0%, #8b7ec8 50%, #5b4d8a 100%)';
  const notch = finished ? '#6b4a12' : '#43366b';

  return (
    <div
      className="library-gutter-bookmark pointer-events-none absolute left-1/2 top-[6%] z-30 flex w-[0.55rem] flex-col items-center"
      style={{ transform: 'translate(-50%, 0) translateZ(14px)' }}
      aria-hidden
    >
      <div
        className="w-full rounded-t-[2px] shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
        style={{
          height: '3.1rem',
          background: ribbon,
          boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.35)',
        }}
      />
      <div
        className="h-0 w-0 border-x-[0.28rem] border-t-[0.32rem] border-x-transparent"
        style={{ borderTopColor: notch }}
      />
    </div>
  );
}

export function LibraryBookFlip({ book, spine, dateLabel, touchLike }: Props) {
  const reduceMotion = useReducedMotion();
  const hasFinished = Boolean(dateLabel);
  const stars =
    book.rating > 0 ? '★'.repeat(Math.min(5, Math.round(book.rating))) : null;

  const liftTransition = reduceMotion
    ? { duration: 0.15 }
    : { duration: 0.55, ease: EASE_OUT };

  const pageTransition = reduceMotion
    ? { duration: 0.15 }
    : { type: 'spring' as const, stiffness: 95, damping: 14, mass: 0.85, delay: 0.12 };

  return (
    <motion.div
      className="relative mx-auto"
      style={{ transformStyle: 'preserve-3d', width: touchLike ? '12rem' : '15.5rem' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: touchLike ? -32 : -44 }}
      transition={liftTransition}
    >
      <motion.div
        className="absolute -bottom-3 left-1/2 h-4 w-[88%] -translate-x-1/2 rounded-[100%] bg-black/55 blur-lg"
        initial={{ opacity: 0, scaleX: 0.6 }}
        animate={{ opacity: 0.75, scaleX: 1.05 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      />

      <motion.div
        className={`relative ${touchLike ? 'h-[5.5rem]' : 'h-[5.5rem] sm:h-[7.25rem]'}`}
        style={{ transformStyle: 'preserve-3d', transformOrigin: 'center bottom' }}
        initial={{ rotateX: 68, rotateY: 0, rotateZ: 0, scale: 0.72 }}
        animate={{ rotateX: 14, rotateY: -10, rotateZ: 0, scale: 1 }}
        transition={liftTransition}
      >
        <div
          className="absolute -bottom-[2px] left-[2px] right-[2px] h-[3px] rounded-b-sm"
          style={{
            transform: 'rotateX(-90deg) translateZ(1px)',
            transformOrigin: 'center top',
            background: 'linear-gradient(90deg, #c9c0b0 0%, #f2ede4 48%, #c9c0b0 100%)',
          }}
        />

        <div
          className="absolute left-0 top-0 h-full w-[calc(50%-3px)] overflow-hidden rounded-l-[4px] border border-black/20"
          style={{
            transform: 'translateZ(4px)',
            boxShadow: 'inset -4px 0 10px rgba(0,0,0,0.2)',
          }}
        >
          {book.coverUrl ? (
            <img src={book.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center p-1.5"
              style={{ background: `linear-gradient(145deg, ${spine}, #0f172a)` }}
            >
              <span className="line-clamp-4 text-center font-serif text-[9px] font-medium text-white/90">
                {book.title}
              </span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/25" />
          <div className="library-crease pointer-events-none absolute inset-y-0 right-0 w-[5px]" />
        </div>

        <div
          className="absolute left-[calc(50%-3px)] top-0 z-10 h-full w-[6px]"
          style={{
            transform: 'translateZ(6px)',
            background: 'linear-gradient(90deg, #2a2018 0%, #0f0c0a 45%, #2a2018 100%)',
            boxShadow: '0 0 6px rgba(0,0,0,0.5)',
          }}
        />

        <GutterBookmark finished={hasFinished} />

        <motion.div
          className="absolute right-0 top-0 h-full w-[calc(50%-3px)]"
          style={{ transformStyle: 'preserve-3d', transformOrigin: 'left center' }}
          initial={{ rotateY: -168 }}
          animate={{ rotateY: -18 }}
          transition={pageTransition}
        >
          <div
            className="library-paper absolute inset-0 flex flex-col justify-center gap-1.5 overflow-hidden rounded-r-[4px] border border-amber-900/12 px-2 py-2 text-amber-950"
            style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0.5px)' }}
          >
            <p className="line-clamp-4 font-serif text-[10px] font-semibold leading-[1.2] sm:text-[11px]">
              {book.title}
            </p>
            {dateLabel ? (
              <p className="shrink-0 text-[8px] uppercase tracking-[0.14em] text-amber-900/50">
                {dateLabel}
              </p>
            ) : null}
            {stars ? (
              <p className="shrink-0 text-[10px] leading-none tracking-[0.12em] text-amber-800/85">
                {stars}
              </p>
            ) : null}
          </div>

          <div
            className="absolute inset-0 rounded-r-[4px] border border-amber-900/10"
            style={{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #e5dfd2 0%, #d4cbb8 100%)',
            }}
          />
        </motion.div>

        <div
          className="absolute right-0 top-1 bottom-1 w-[2px] opacity-70"
          style={{
            transform: 'translateZ(2px)',
            background:
              'repeating-linear-gradient(180deg, #f5f0e6 0px, #f5f0e6 2px, #d9d0c0 2px, #d9d0c0 3px)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
