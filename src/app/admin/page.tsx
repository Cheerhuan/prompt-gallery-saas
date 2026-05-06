import React from 'react';
import { useI18n } from '@/components/I18nProvider';

export const AdminPanel = () => {
  const { t } = useI18n();
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-2">Admin Dashboard</h1>
            <p className="text-zinc-500">Manage your prompt gallery and assets.</p>
          </div>
          <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:bg-zinc-800 transition-colors">
            Export JSON
          </button>
        </div>
        
        <AdminUpload onUpload={(data) => {
          console.log('Uploading prompt:', data);
          alert('Prompt uploaded successfully! (Mock)');
        }} />
      </div>
    </div>
  );
};

import { AdminUpload } from '@/components/AdminUpload';
