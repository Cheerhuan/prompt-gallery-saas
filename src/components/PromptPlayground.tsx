"use client";

import React, { useState } from 'react';
import { useI18n } from '@/components/I18nProvider';

// Unified separator: supports both English and Chinese commas
const SEPARATOR = /[,，]\s*/;

// Parse the first language segment (for dual-language "EN | ZH" prompts)
function parseInitialParts(prompt: string): string[] {
  if (!prompt) return [];
  const mainPart = prompt.split(' | ')[0] || prompt;
  return mainPart.split(SEPARATOR);
}

export const PromptPlayground = ({ initialPrompt }: { initialPrompt: string }) => {
  const { t } = useI18n();
  const initialParts = parseInitialParts(initialPrompt);

  const [fields, setFields] = useState({
    subject: initialParts[0] || '',
    style: initialParts[1] || '',
    lighting: initialParts[2] || '',
    camera: initialParts[3] || '',
    mood: initialParts[4] || '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUpdate = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  // Reconstruct compiled prompt preserving the original separator style
  const fullPrompt = Object.values(fields).filter(v => v.trim()).join(', ');

  const fieldConfig = [
    { label: t('playground.fields.subject'), key: 'subject', placeholder: t('playground.placeholders.subject') },
    { label: t('playground.fields.style'), key: 'style', placeholder: t('playground.placeholders.style') },
    { label: t('playground.fields.lighting'), key: 'lighting', placeholder: t('playground.placeholders.lighting') },
    { label: t('playground.fields.camera'), key: 'camera', placeholder: t('playground.placeholders.camera') },
    { label: t('playground.fields.mood'), key: 'mood', placeholder: t('playground.placeholders.mood') },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldConfig.map(field => (
          <div key={field.key} className="group">
            <label className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1.5 block group-focus-within:text-indigo-400 transition-colors">
              {field.label}
            </label>
            <input 
              type="text"
              value={fields[field.key as keyof typeof fields]}
              onChange={(e) => handleUpdate(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
            />
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-tighter">{t('playground.compiled')}</span>
          <button className="text-zinc-500 hover:text-white text-xs transition-colors">{t('playground.copy')}</button>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed italic">
          &ldquo;{fullPrompt}&rdquo;
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
          <span>{t('playground.regenerate')}</span>
        )}
      </button>
    </div>
  );
};
