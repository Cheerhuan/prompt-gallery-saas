import React from 'react';
import { I18nProvider } from '@/components/I18nProvider';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://cheerhuan.github.io/prompt-gallery-saas'),
  title: 'Prompt Gallery — The Internet\'s Most Addictive AI Inspiration Vault',
  description: 'Stop guessing. Start creating. Access a curated ecosystem of high-conversion prompts engineered for cinematic results.',
  openGraph: {
    title: 'Prompt Gallery — AI Inspiration Vault',
    description: 'Curated high-conversion AI prompts for Midjourney, GPT-Image, and more.',
    url: 'https://cheerhuan.github.io/prompt-gallery-saas',
    siteName: 'Prompt Gallery',
    type: 'website',
    images: [{ url: '/images/attack-on-titan.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Gallery — AI Inspiration Vault',
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
      </head>
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
