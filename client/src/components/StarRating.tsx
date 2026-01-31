import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function StarRating({ value, onChange }: Props) {
  const [hover, setHover] = React.useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((v) => {
        const filled = shown >= v;
        return (
          <motion.button
            key={v}
            type="button"
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(v)}
            className="p-1 rounded-lg hover:bg-slate-900/60 transition"
            aria-label={`Rate ${v}`}
          >
            <Star
              className={
                filled
                  ? 'h-4 w-4 text-amber-300 fill-amber-300'
                  : 'h-4 w-4 text-slate-600'
              }
            />
          </motion.button>
        );
      })}
      <button
        type="button"
        onClick={() => onChange(0)}
        className="ml-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
      >
        Clear
      </button>
    </div>
  );
}
