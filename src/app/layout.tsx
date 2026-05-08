import React from 'react';
import { I18nProvider } from '@/components/I18nProvider';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
  return (
    <html lang="en">
      <head>
        <meta name="deploy-verify" content="SAAS_20260508_V1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
