import React from 'react';
import { I18nProvider } from '@/components/I18nProvider';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://cheerhuan.github.io/prompt-gallery-saas'),
  title: 'Prompt Gallery — The AI Prompt Vault',
  description: 'Stop guessing. Start creating. Access a curated ecosystem of high-conversion prompts engineered for cinematic results.',
  openGraph: {
    title: 'Prompt Gallery — The AI Prompt Vault',
    description: 'Curated high-conversion AI prompts for Midjourney, GPT-Image, and more.',
    url: 'https://cheerhuan.github.io/prompt-gallery-saas',
    siteName: 'Prompt Gallery',
    type: 'website',
    images: [{ url: '/images/attack-on-titan.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Gallery — The AI Prompt Vault',
    description: 'Curated high-conversion AI prompts for Midjourney, GPT-Image, and more.',
    images: ['/images/attack-on-titan.jpg'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="deploy-verify" content="SAAS_20260513_V2" />

        {/* ── Font preloading ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" as="style" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        {/* ── Critical image preload (OG image) ── */}
        <link rel="preload" href="/prompt-gallery-saas/images/attack-on-titan.jpg" as="image" fetchPriority="high" />

        {/* ── Hreflang tags (i18n is client-side; x-default + en is safe) ── */}
        <link rel="alternate" hrefLang="x-default" href="https://cheerhuan.github.io/prompt-gallery-saas/" />
        <link rel="alternate" hrefLang="en" href="https://cheerhuan.github.io/prompt-gallery-saas/" />
      </head>
      <body>
        {/* ── Plausible Analytics (production only) ── */}
        {process.env.NODE_ENV === 'production' && (
          <script defer data-domain="cheerhuan.github.io" src="https://plausible.io/js/script.js" />
        )}
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
