import React, { useState } from 'react';
import Link from 'next/link';

interface PromptCardProps {
  id: string | number;
  image: string;
  title: string;
  tags: string[];
}

/** 靜態匯出 + GitHub Pages 時，可透過此全域變數知道 basePath */
const BASE_PATH = '/prompt-gallery-saas';

export const PromptCard = ({ id, image, title, tags }: PromptCardProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = image && image.trim() !== '';

  // 若無圖或圖片已載入失敗 → 不渲染此卡片
  if (!hasImage) return null;

  // 修正相對路徑：以 / 開頭的路徑須補上 basePath（GitHub Pages）
  const resolvedSrc = image.startsWith('/') ? `${BASE_PATH}${image}` : image;

  if (imgFailed) return null;

  return (
    <Link 
      href={`/prompt/${id}`} 
      className="group relative block break-inside-avoid mb-4 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-800">
        <img 
          src={resolvedSrc} 
          alt="" 
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <h3 className="text-white font-medium text-sm leading-tight mb-2 line-clamp-2">{title}</h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-zinc-300 border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};
