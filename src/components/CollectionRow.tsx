'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const BASE_PATH = '/prompt-gallery-saas';

interface CollectionItem {
  id: string;
  title: string;
  description: string;
  image: string;
  count: number;
}

interface CollectionRowProps {
  collections: CollectionItem[];
}

export const CollectionRow = ({ collections }: CollectionRowProps) => {
  return (
    <div className="w-full py-16 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-6 md:mb-10 px-2 md:px-0 text-center">
        <div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white mb-2">
              Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Collections</span>
            </h2>
            <p className="text-zinc-500 font-light max-w-md">
              Hand-picked prompt architectures organized by artistic intent and technical complexity.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Cards row — same padding as heading ─── */}
      <div className="max-w-7xl mx-auto px-2 md:px-0">
        <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x snap-mandatory">
        {collections.map((collection, index) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -8 }}
            className="group relative flex-shrink-0 w-[85vw] sm:w-[300px] md:w-[450px] aspect-[16/9] rounded-2xl overflow-hidden snap-start cursor-pointer"
          >
            {/* Background Image with Glassmorphism Overlay */}
            <div className="absolute inset-0 z-0">
              <img 
                src={collection.image.startsWith('/') ? `${BASE_PATH}${collection.image}` : collection.image} 
                alt={collection.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-indigo-900/10 mix-blend-multiply" />
            </div>

            {/* Content Layer */}
            <div className="absolute inset-0 z-10 p-6 md:p-8 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 backdrop-blur-md border border-white/20 text-zinc-300">
                  {collection.count} Prompts
                </span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                {collection.title}
              </h3>
              
              <p className="text-zinc-400 text-sm md:text-base line-clamp-2 mb-6 font-light max-w-md">
                {collection.description}
              </p>

              <Link 
                href={`/?collection=${collection.id}#gallery-section`} 
                className="w-fit px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-indigo-400 hover:text-white transition-all duration-300 flex items-center gap-2 group/btn"
              >
                Explore Collection
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Industrial Border Glow */}
            <div className="absolute inset-0 pointer-events-none border border-white/0 group-hover:border-indigo-500/50 rounded-2xl transition-colors duration-500" />
            <div className="absolute -inset-px bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500 rounded-2xl" />
          </motion.div>
        ))}
      </div>
      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
