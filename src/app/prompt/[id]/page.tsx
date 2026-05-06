import React from 'react';
import { DetailClient } from '@/components/DetailClient';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
  ];
}

export default async function DetailPage({ params }: { params: { id: string } }) {
  // In real app, fetch data from Supabase here
  const mockPrompt = {
    title: 'Cyberpunk Neon City',
    image: 'https://images.unsplash.com/photo-16051428596d?q=80&w=1000&auto=format&fit=crop',
    full_prompt: 'A futuristic neon city with flying cars, rainy streets, cinematic lighting, 8k resolution, cyberpunk style, wide angle lens',
    model: 'SDXL 1.0',
  };

  return <DetailClient params={params} mockPrompt={mockPrompt} userTier="free" />;
}
