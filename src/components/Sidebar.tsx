'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';
import type { Locale } from '@/lib/i18n';

interface SidebarProps {
  activePage?: 'home' | 'search' | 'history' | 'favorites';
}

const LOCALES: { key: Locale; label: string }[] = [
  { key: 'en', label: 'EN' },
  { key: 'zh', label: '中文' },
  { key: 'ja', label: '日本語' },
  { key: 'ko', label: '한국어' },
];

export default function Sidebar({ activePage = 'home' }: SidebarProps) {
  const { t, locale, setLocale } = useI18n();

  const baseNavItem = (href: string, icon: React.ReactNode, label: string, isActive: boolean, isExternal?: boolean) => {
    const classes = `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
      isActive
        ? 'bg-zinc-800/50 text-white border-l-2 border-white pl-3'
        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 pl-4'
    }`;

    const content = (
      <>
        <span className="w-4 h-4 shrink-0">{icon}</span>
        <span className="flex-1">{label}</span>
        {isExternal && (
          <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M7 17l10-10M17 7v10M17 7H7" />
          </svg>
        )}
      </>
    );

    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  };

  const navItems = [
    {
      href: '/', label: t('sidebar.home'), key: 'home' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: '/explore', label: t('sidebar.search'), key: 'search' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      href: '/saved', label: t('sidebar.history'), key: 'history' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      href: '/favorites', label: t('sidebar.favorites'), key: 'favorites' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-[240px] shrink-0 h-screen sticky top-0 bg-zinc-950 border-r border-zinc-800 flex flex-col py-6 px-4 overflow-y-auto hidden md:flex">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-3 mb-6">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black text-xs font-bold shrink-0">
          PG
        </div>
        <span className="text-lg font-bold tracking-tighter text-white">PROMPT GALLERY</span>
      </Link>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) =>
          baseNavItem(item.href, item.icon, item.label, activePage === item.key)
        )}
      </nav>

      {/* Separator */}
      <div className="border-t border-zinc-800 my-4" />

      {/* Categories Section */}
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-medium px-3 mb-2">
        {t('sidebar.categories')}
      </div>
      <nav className="flex flex-col gap-1">
        {baseNavItem(
          '/explore',
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>,
          t('sidebar.tags'), false
        )}
        {baseNavItem(
          '/',
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>,
          t('sidebar.recentUpdates'), false
        )}
      </nav>

      {/* Separator */}
      <div className="border-t border-zinc-800 my-4" />

      {/* Ecosystem Section */}
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-medium px-3 mb-2">
        {t('sidebar.ecosystem')}
      </div>
      <nav className="flex flex-col gap-1">
        {baseNavItem(
          'https://github.com/Cheerhuan/prompt-gallery-saas',
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>,
          t('sidebar.github'), false, true
        )}
        {baseNavItem(
          'https://raw.githubusercontent.com/Cheerhuan/prompt-gallery-saas/main/src/data/prompts.json',
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>,
          t('sidebar.openData'), false, true
        )}
        {baseNavItem(
          'https://github.com/Cheerhuan/prompt-gallery-saas/commits/main',
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>,
          t('sidebar.changelog'), false, true
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Language Toggle */}
      <div className="flex items-center gap-1 px-3 mb-3">
        {LOCALES.map((l, i) => (
          <React.Fragment key={l.key}>
            <button
              onClick={() => setLocale(l.key)}
              className={`text-[10px] font-medium transition-colors ${
                locale === l.key ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {l.label}
            </button>
            {i < LOCALES.length - 1 && (
              <span className="text-zinc-700 text-[10px]">·</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* CTA Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold text-white mb-1">{t('sidebar.publishTitle')}</p>
        <p className="text-xs text-zinc-500 mb-3">{t('sidebar.publishSub')}</p>
        <Link
          href="/submit"
          className="w-full bg-white text-black rounded-lg py-2 text-xs font-semibold block text-center hover:bg-zinc-200 transition-colors"
        >
          {t('sidebar.getStarted')}
        </Link>
      </div>

      {/* Footer Links */}
      <div className="flex items-center gap-3 px-3">
        <Link href="/terms" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">{t('sidebar.terms')}</Link>
        <span className="text-[10px] text-zinc-700">·</span>
        <Link href="/privacy" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">{t('sidebar.privacy')}</Link>
        <span className="text-[10px] text-zinc-700">·</span>
        <a href="https://github.com/Cheerhuan/prompt-gallery-saas" target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">{t('sidebar.git')}</a>
      </div>
    </aside>
  );
}
