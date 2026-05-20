import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

import { BrandMark } from '../components/BrandMark';
import { LocaleSwitcher } from '../components/LocaleSwitcher';
import { api } from '../lib/api';
import { applyLocalePreference, type AppLocale } from '../lib/localePreference';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

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
    if (locale) {
      applyLocalePreference(locale);
    }
  }, [meQuery.data?.preferredLocale]);

  async function onLogout() {
    await api.logout();
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    navigate('/login', { replace: true });
  }

  async function onChangeLocale(locale: AppLocale) {
    await api.setLocale(locale);
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  }

  const me = meQuery.data;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur supports-[backdrop-filter]:bg-slate-950/45">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" />
            <div>
              <div className="text-xs text-slate-400">{t('appName')}</div>
              <div className="text-base sm:text-lg font-semibold leading-tight tracking-tight">{t('books')}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {me ? <LocaleSwitcher onLocaleChange={onChangeLocale} /> : null}

            {me && (
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/35 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                {me.picture ? (
                  <img
                    src={me.picture}
                    alt={me.name}
                    className="h-7 w-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
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
          <div className="text-slate-400">{t('loading')}</div>
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
