import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  widthClassName?: string;
};

export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  align = 'left',
  widthClassName = 'w-80',
}: Props) {
  const triggerRef = React.useRef<HTMLSpanElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const recompute = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Estimate popover height (will be adjusted by actual content)
    const estimatedPopoverHeight = 400; // rough estimate for DatePickerPopover
    const spaceBelow = vh - r.bottom;
    const spaceAbove = r.top;

    // Decide if popover should flip to top
    const shouldFlipToTop = spaceBelow < estimatedPopoverHeight && spaceAbove > spaceBelow;

    const top = shouldFlipToTop 
      ? Math.max(12, Math.round(r.top - estimatedPopoverHeight - margin))
      : Math.round(r.bottom + margin);

    const desiredLeft = align === 'right' ? r.right : r.left;
    const maxWidth = Math.max(280, Math.min(420, vw - 24));

    let left = desiredLeft;
    if (align === 'right') left = desiredLeft - maxWidth;

    left = Math.max(12, Math.min(left, vw - maxWidth - 12));
    setPos({ top, left });
  }, [align]);

  React.useEffect(() => {
    if (!open) return;
    recompute();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }

    function onResize() {
      recompute();
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, onOpenChange, recompute]);

  return (
    <span className="inline-block">
      <span
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!open);
        }}
      >
        {trigger}
      </span>

      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <>
                  <div className="fixed inset-0 z-[9998] pointer-events-auto" onClick={() => onOpenChange(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    style={{ top: pos.top, left: pos.left, pointerEvents: 'auto' }}
                    className={`pointer-events-auto fixed z-[9999] max-w-[calc(100vw-24px)] ${widthClassName} overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur shadow-2xl`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {children}
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </span>
  );
}
