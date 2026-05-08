'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/components/I18nProvider';

interface PromptCardProps {
  id: string | number;
  image: string;
  title: string;
  tags: string[];
}

export const PromptCard = ({ id, image, title, tags }: PromptCardProps) => {
  const { t } = useI18n();
  const [imgSrc, setImgSrc] = useState(image);

  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="break-inside-avoid mb-6 group"
    >
      <Link 
        href={`/prompt/${id}`} 
        className="relative block rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-500 cursor-pointer shadow-2xl"
      >
        <div className="relative overflow-hidden bg-zinc-800">
          <img 
            src={imgSrc} 
            alt={title} 
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          
          <motion.div 
            initial={{ y: '100%' }}
            whileHover={{ y: 0 }}
            className="absolute inset-x-0 bottom-0 p-5 bg-white/10 backdrop-blur-md border-t border-white/20 transition-all duration-300 flex flex-col justify-end"
          >
            <motion.h3 
              className="text-white font-bold text-lg leading-tight mb-2"
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.h3>
            
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md bg-black/30 text-zinc-300 border border-white/10 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};
