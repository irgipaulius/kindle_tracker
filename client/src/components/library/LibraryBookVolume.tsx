import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { ShelfBook } from '../../lib/api';
import {
  spineColorFromTitle,
  spineHeightScale,
  spineTitleLayout,
  shouldAutoScrollShelfForPreview,
} from './libraryLayout';
import { LibraryBookFlip } from './LibraryBookFlip';

const PREVIEW_GAP = 10;
const FLIP_WIDTH_MOBILE = 192;
const FLIP_WIDTH_DESKTOP = 248;
const FLIP_HIT_HEIGHT_MOBILE = 140;
const FLIP_HIT_HEIGHT_DESKTOP = 175;
const HOVER_CLOSE_DELAY_MS = 160;

type Props = {
  book: ShelfBook;
  isPreview: boolean;
  touchLike: boolean;
  onPreviewOpen: () => void;
  onPreviewClose: () => void;
  onSelect: (id: string) => void;
};

type AnchorPos = {
  left: number;
  bottom: number;
  width: number;
  height: number;
};

function clampLeft(centerX: number, width: number) {
  const margin = 8;
  const left = centerX - width / 2;
  return Math.max(margin, Math.min(left, window.innerWidth - width - margin));
}

export function LibraryBookVolume({
  book,
  isPreview,
  touchLike,
  onPreviewOpen,
  onPreviewClose,
  onSelect,
}: Props) {
  const { i18n } = useTranslation();
  const slotRef = React.useRef<HTMLButtonElement>(null);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [anchor, setAnchor] = React.useState<AnchorPos | null>(null);
  const spine = spineColorFromTitle(book.title);
  const heightScale = spineHeightScale(book.id);
  const [tallSpine, setTallSpine] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setTallSpine(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  React.useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  const titleLayout = React.useMemo(
    () => spineTitleLayout(book.title, { tallSpine }),
    [book.title, tallSpine]
  );

  const dateLabel = book.finishedDate
    ? new Date(book.finishedDate).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const updateAnchor = React.useCallback(() => {
    const el = slotRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = touchLike ? FLIP_WIDTH_MOBILE : FLIP_WIDTH_DESKTOP;
    const height = touchLike ? FLIP_HIT_HEIGHT_MOBILE : FLIP_HIT_HEIGHT_DESKTOP;
    setAnchor({
      left: clampLeft(rect.left + rect.width / 2, width),
      bottom: window.innerHeight - rect.top + PREVIEW_GAP,
      width,
      height,
    });
  }, [touchLike]);

  React.useLayoutEffect(() => {
    if (!isPreview) {
      setAnchor(null);
      return;
    }
    updateAnchor();
    const slot = slotRef.current;
    if (slot) {
      const flipWidth = touchLike ? FLIP_WIDTH_MOBILE : FLIP_WIDTH_DESKTOP;
      if (touchLike || shouldAutoScrollShelfForPreview(slot, flipWidth)) {
        slot.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }
    window.addEventListener('resize', updateAnchor);
    window.addEventListener('scroll', updateAnchor, true);
    return () => {
      window.removeEventListener('resize', updateAnchor);
      window.removeEventListener('scroll', updateAnchor, true);
    };
  }, [isPreview, updateAnchor, touchLike]);

  function cancelHoverClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleHoverClose() {
    if (touchLike) return;
    cancelHoverClose();
    closeTimerRef.current = setTimeout(() => onPreviewClose(), HOVER_CLOSE_DELAY_MS);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (touchLike && !isPreview) e.preventDefault();
  }

  function handleClick() {
    if (touchLike && !isPreview) {
      onPreviewOpen();
      return;
    }
    onSelect(book.id);
  }

  const flip = isPreview ? (
    <LibraryBookFlip book={book} spine={spine} dateLabel={dateLabel} touchLike={touchLike} />
  ) : null;

  const previewPortal =
    isPreview && anchor
      ? createPortal(
          touchLike ? (
            <button
              type="button"
              className="library-book-flip library-book-flip-hit fixed z-[200] cursor-pointer border-0 bg-transparent p-0 touch-manipulation"
              style={{
                left: anchor.left,
                bottom: anchor.bottom,
                width: anchor.width,
                height: anchor.height,
                perspective: 1100,
              }}
              aria-label={book.title}
              onClick={() => onSelect(book.id)}
            >
              <div className="pointer-events-none flex h-full w-full items-end justify-center">
                {flip}
              </div>
            </button>
          ) : (
            <div
              className="library-book-flip library-book-flip-hover fixed z-[200]"
              style={{
                left: anchor.left,
                bottom: anchor.bottom,
                width: anchor.width,
                height: anchor.height,
                perspective: 1100,
              }}
              onMouseEnter={cancelHoverClose}
              onMouseLeave={scheduleHoverClose}
            >
              <div className="pointer-events-none flex h-full w-full items-end justify-center">
                {flip}
              </div>
            </div>
          ),
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={slotRef}
        type="button"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onMouseEnter={() => {
          cancelHoverClose();
          if (!touchLike) onPreviewOpen();
        }}
        onMouseLeave={scheduleHoverClose}
        onFocus={() => {
          cancelHoverClose();
          if (!touchLike) onPreviewOpen();
        }}
        onBlur={() => {
          if (!touchLike) onPreviewClose();
        }}
        className={`library-book-slot relative w-[85%] max-w-[2.85rem] shrink-0 outline-none ${
          isPreview ? 'z-50' : 'z-0'
        } ${touchLike && isPreview ? 'pointer-events-none' : ''}`}
        style={{ height: `${heightScale * 100}%` }}
        aria-label={book.title}
        aria-expanded={isPreview}
      >
        <div
          className={`library-spine absolute inset-x-0 bottom-0 top-1 overflow-hidden rounded-[2px] border border-black/40 transition-opacity duration-200 ${
            isPreview ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            background: `linear-gradient(90deg, ${spine} 0%, #2a1c12 55%, #1a120c 100%)`,
            boxShadow:
              'inset 3px 0 5px rgba(255,255,255,0.1), inset -3px 0 8px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.35)',
          }}
        >
          <div className="absolute inset-y-1 left-0 w-px bg-white/10" />
          <div className="absolute inset-y-1 right-0 w-px bg-black/25" />
          <div
            className="library-spine-title-wrap"
            style={{
              fontSize: titleLayout.fontSize,
              letterSpacing: titleLayout.letterSpacing,
              lineHeight: titleLayout.lineHeight,
            }}
          >
            {titleLayout.columns.map((column, i) => (
              <span key={i} className="library-spine-title-col">
                {column}
              </span>
            ))}
          </div>
        </div>
      </button>
      {previewPortal}
    </>
  );
}
