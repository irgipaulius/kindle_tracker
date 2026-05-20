import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

import { applyLocalePreference, type AppLocale } from '../lib/localePreference';

type LocaleSwitcherProps = {
  /** Called after UI language changes (e.g. persist to account API). */
  onLocaleChange?: (locale: AppLocale) => void | Promise<void>;
  className?: string;
};

export function LocaleSwitcher({ onLocaleChange, className = '' }: LocaleSwitcherProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const locale: AppLocale = i18n.language === 'fr' ? 'fr' : 'en';

  async function select(next: AppLocale) {
    applyLocalePreference(next);
    setOpen(false);
    await onLocaleChange?.(next);
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 hover:bg-slate-900/55 transition shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-xs text-slate-400">{t('locale')}</span>
        <span className="text-base leading-none">{locale === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur shadow-2xl"
          >
            <button
              type="button"
              role="option"
              aria-selected={locale === 'en'}
              onClick={() => select('en')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-900/60 transition flex items-center gap-2"
            >
              <span className="text-base">🇬🇧</span>
              <span>{t('english')}</span>
            </button>
            <button
              type="button"
              role="option"
              aria-selected={locale === 'fr'}
              onClick={() => select('fr')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-900/60 transition flex items-center gap-2"
            >
              <span className="text-base">🇫🇷</span>
              <span>{t('french')}</span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
