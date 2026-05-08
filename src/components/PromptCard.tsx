import React, { useState } from 'react';

interface PromptCardProps {
  id: string | number;
  image: string;
  title: string;
  tags: string[];
}

export const PromptCard = ({ id, image, title, tags }: PromptCardProps) => {
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';
  const [imgSrc, setImgSrc] = useState(image || '');
  const [imgError, setImgError] = useState(!image);

  return (
    <Link 
      href={`/prompt/${id}`} 
      className="group relative block break-inside-avoid mb-4 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-800">
        <img 
          src={imgError ? FALLBACK_IMAGE : imgSrc} 
          alt="" 
          onError={() => { if (!imgError) setImgError(true); }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <h3 className="text-white font-medium text-lg">{title}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};

import Link from 'next/link';
