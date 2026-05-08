'use client';
import React from 'react';
import { useI18n } from '@/components/I18nProvider';
import { AdminUpload } from '@/components/AdminUpload';

export default function AdminPanel() {
  const { t } = useI18n();
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-2">{t('admin.pageTitle')}</h1>
            <p className="text-zinc-500">{t('admin.pageDesc')}</p>
          </div>
          <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:bg-zinc-800 transition-colors">
            {t('admin.exportBtn')}
          </button>
        </div>
        
        <AdminUpload onUpload={(data) => {
          console.log('Uploading prompt:', data);
          alert('Prompt uploaded successfully! (Mock)');
        }} />
      </div>
    </div>
  );
}
