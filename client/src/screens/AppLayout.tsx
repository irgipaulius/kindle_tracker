import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

import { api } from '../lib/api';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [isLocaleOpen, setIsLocaleOpen] = React.useState(false);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: api.getMe,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) {
      navigate('/login', { replace: true });
    }
  }, [meQuery.isError, navigate]);

  useEffect(() => {
    const locale = meQuery.data?.preferredLocale;
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [meQuery.data?.preferredLocale, i18n]);

  async function onLogout() {
    await api.logout();
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    navigate('/login', { replace: true });
  }

  async function onChangeLocale(locale: 'en' | 'fr') {
    await api.setLocale(locale);
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    i18n.changeLanguage(locale);
    setIsLocaleOpen(false);
  }

  const me = meQuery.data;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur supports-[backdrop-filter]:bg-slate-950/45">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_40px_rgba(99,102,241,0.25)]" />
              <div className="pointer-events-none absolute -inset-2 rounded-[22px] bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-cyan-400/10 blur-xl" />
            </div>
            <div>
              <div className="text-xs text-slate-400">{t('appName')}</div>
              <div className="text-base sm:text-lg font-semibold leading-tight tracking-tight">{t('books')}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setIsLocaleOpen((v) => !v)}
                className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 hover:bg-slate-900/55 transition shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
                disabled={!me}
              >
                <div className="hidden sm:block text-xs text-slate-400">{t('locale')}</div>
                <div className="text-base leading-none">
                  {(me?.preferredLocale || 'en') === 'fr' ? '🇫🇷' : '🇬🇧'}
                </div>
              </button>

              <AnimatePresence>
                {isLocaleOpen && me ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur shadow-2xl"
                  >
                    <button
                      onClick={() => onChangeLocale('en')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-900/60 transition flex items-center gap-2"
                    >
                      <span className="text-base">🇬🇧</span>
                      <span>{t('english')}</span>
                    </button>
                    <button
                      onClick={() => onChangeLocale('fr')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-900/60 transition flex items-center gap-2"
                    >
                      <span className="text-base">🇫🇷</span>
                      <span>{t('french')}</span>
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {me && (
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                {me.picture ? (
                  <img src={me.picture} alt={me.name} className="h-7 w-7 rounded-full" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-slate-700" />
                )}
                <div className="text-sm font-medium">{me.name}</div>
              </div>
            )}

            <button
              onClick={onLogout}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 text-sm hover:bg-slate-900/55 transition shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
              disabled={!me}
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        {meQuery.isLoading ? (
          <div className="text-slate-400">Loading…</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
