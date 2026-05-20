import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { BrandMark } from '../components/BrandMark';
import { LocaleSwitcher } from '../components/LocaleSwitcher';

export function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950" />
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/25 via-fuchsia-500/20 to-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-400/15 via-indigo-500/10 to-fuchsia-500/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full max-w-lg rounded-3xl bg-slate-900/35 border border-slate-800/80 shadow-2xl p-8 backdrop-blur"
      >
        <div className="absolute top-6 right-6">
          <LocaleSwitcher />
        </div>

        <div className="flex items-center gap-3 pr-24">
          <BrandMark size="md" />
          <div>
            <div className="text-xs text-slate-400">{t('appName')}</div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t('loginTitle')}</h1>
          </div>
        </div>

        <p className="mt-3 text-slate-300">{t('loginSubtitle')}</p>

        <a
          href="/auth/google"
          className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-white text-slate-900 font-semibold px-4 py-3 hover:bg-slate-100 transition shadow-[0_10px_40px_rgba(255,255,255,0.10)]"
        >
          {t('loginWithGoogle')}
        </a>
      </motion.div>
    </div>
  );
}
