import React from 'react';
import { PromptCard } from '@/components/PromptCard';

const MOCK_DATA = [
  { id: 1, title: 'Cyberpunk Neon City', tags: ['Cyberpunk', 'Neon', 'Cityscape'], image: 'https://images.unsplash.com/photo-1605142859616-f3775c78235d?q=80&w=1000&auto=format&fit=crop' },
  { id: 2, title: 'Ethereal Forest', tags: ['Fantasy', 'Nature', 'Magical'], image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop' },
  { id: 3, title: 'Abstract Geometry', tags: ['Abstract', 'Modern', 'Digital'], image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop' },
  { id: 4, title: 'Futuristic Portrait', tags: ['Sci-fi', 'Portrait', 'Cyborg'], image: 'https://images.unsplash.com/photo-1531746020798-e6953c6ed76e?q=80&w=1000&auto=format&fit=crop' },
  { id: 5, title: 'Ancient ruins', tags: ['History', 'Epic', 'Architecture'], image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop' },
  { id: 6, title: 'Cosmic Nebula', tags: ['Space', 'Galaxy', 'Astronomy'], image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop' },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">PROMPT GALLERY</h1>
          <p className="text-zinc-500 mt-2">Explore the art of AI prompting.</p>
        </div>
        <button className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-zinc-200 transition-colors">
          Upload Prompt
        </button>
      </header>

      <div className="max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {MOCK_DATA.map((item) => (
          <PromptCard key={item.id} image={item.image} title={item.title} tags={item.tags} />
        ))}
      </div>
    </div>
  );
}
