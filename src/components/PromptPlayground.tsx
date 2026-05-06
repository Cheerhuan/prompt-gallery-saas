"use client";

import React, { useState } from 'react';

interface EditorField {
  label: string;
  key: string;
  placeholder: string;
}

const FIELDS: EditorField[] = [
  { label: 'Subject', key: 'subject', placeholder: 'e.g. A futuristic cyborg' },
  { label: 'Style', key: 'style', placeholder: 'e.g. Digital Art, Unreal Engine 5' },
  { label: 'Lighting', key: 'lighting', placeholder: 'e.g. Volumetric, Neon Glow' },
  { label: 'Camera', key: 'camera', placeholder: 'e.g. 85mm lens, Low Angle' },
  { label: 'Mood', key: 'mood', placeholder: 'e.g. Melancholic, Epic' },
];

export const PromptPlayground = ({ initialPrompt }: { initialPrompt: string }) => {
  const [fields, setFields] = useState({
    subject: 'A futuristic neon city',
    style: 'Cyberpunk, Cinematic',
    lighting: 'Volumetric neon glow',
    camera: 'Wide angle, 8k',
    mood: 'Mysterious, Rainy',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUpdate = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  const fullPrompt = Object.values(fields).join(', ');

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map(field => (
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
          <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-tighter">Compiled Prompt</span>
          <button className="text-zinc-500 hover:text-white text-xs transition-colors">Copy</button>
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
            <span>Generating New Version...</span>
          </>
        ) : (
          <>
            <span>✨ Regenerate Image</span>
          </>
        )}
      </button>
    </div>
  );
};
