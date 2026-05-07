'use client';
import React, { useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { getGoogleDriveDirectLink } from '@/lib/googleDrive';

interface AdminUploadProps {
  onUpload: (data: any) => void;
}

export const AdminUpload = ({ onUpload }: AdminUploadProps) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    image: '',
    tags: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tags.split(',').map(tag => tag.trim());
    
    // Industrial-grade transformation: Convert GDrive links/IDs to Direct Links
    const finalImage = getGoogleDriveDirectLink(formData.image);
    
    onUpload({ ...formData, image: finalImage, tags: tagsArray });
    setFormData({ title: '', prompt: '', image: '', tags: '' });
  };

  return (
    <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t('admin.uploadTitle')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">{t('admin.titleLabel')}</label>
          <input 
            type="text" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">{t('admin.promptLabel')}</label>
          <textarea 
            value={formData.prompt}
            onChange={(e) => setFormData({...formData, prompt: e.target.value})}
            className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">{t('admin.imageLabel')}</label>
          <input 
            type="text" 
            value={formData.image}
            onChange={(e) => setFormData({...formData, image: e.target.value})}
            className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="URL or Google Drive File ID"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 uppercase mb-1">{t('admin.tagsLabel')}</label>
          <input 
            type="text" 
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
            className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Tag1, Tag2, Tag3"
            required
          />
        </div>
        <button type="submit" className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all">
          {t('admin.submit')}
        </button>
      </form>
    </div>
  );
};
