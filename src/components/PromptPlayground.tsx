"use client";

import React, { useState } from 'react';
import { useI18n } from '@/components/I18nProvider';

interface EditorField {
  labelKey: string;
  key: string;
  placeholderKey: string;
}

const FIELDS: EditorField[] = [
  { labelKey: 'playground.fields.subject', key: 'subject', placeholderKey: 'playground.placeholders.subject' },
  { labelKey: 'playground.fields.style', key: 'style', placeholderKey: 'playground.placeholders.style' },
  { labelKey: 'playground.fields.lighting', key: 'lighting', placeholderKey: 'playground.placeholders.lighting' },
  { labelKey: 'playground.fields.camera', key: 'camera', placeholderKey: 'playground.placeholders.camera' },
  { labelKey: 'playground.fields.mood', key: 'mood', placeholderKey: 'playground.placeholders.mood' },
];

export const PromptPlayground = ({ initialPrompt }: { initialPrompt: string }) => {
  const { t } = useI18n();
  
  // Robust parsing: splits by either English comma (,) or Chinese comma (，)
  const parsedInitial = initialPrompt ? initialPrompt.split(/[,，]/).map(s => s.trim()) : [];
  
  const [fields, setFields] = useState({
    subject: parsedInitial[0] || 'A futuristic neon city',
    style: parsedInitial[1] || '',
    lighting: parsedInitial[2] || '',
    camera: parsedInitial[3] || '',
    mood: parsedInitial[4] || '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUpdate = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  // Clean concatenation: filters out empty fields to prevent trailing/double commas
  const fullPrompt = Object.values(fields).filter(val => val && val.trim() !== '').join(', ');

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map(field => (
          <div key={field.key} className="group">
            <label className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1.5 block group-focus-within:text-indigo-400 transition-colors">
              {t(field.labelKey)}
            </label>
            <input 
              type="text"
              value={fields[field.key as keyof typeof fields]}
              onChange={(e) => handleUpdate(field.key, e.target.value)}
              placeholder={t(field.placeholderKey)}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
            />
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-tighter">
            {t('playground.compiled')}
          </span>
          <button className="text-zinc-500 hover:text-white text-xs transition-colors">
            {t('detail.copyPrompt')}
          </button>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed italic">
          "{fullPrompt}"
        </p>
      </div>

      <button 
        onClick={handleRegenerate}
        disabled={isGenerating}
        className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>{t('playground.regenerating')}</span>
          </>
        ) : (
          <>
            <span>✨ {t('playground.regenerate')}</span>
          </>
        )}
      </button>
    </div>
  );
};
