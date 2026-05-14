import { notFound } from 'next/navigation';
import promptsData from '@/data/prompts.json';
import DetailPageContent from './DetailPageContent';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return promptsData.map((prompt) => ({
    id: prompt.id,
  }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  const prompt = promptsData.find(p => p.id === id);
  if (!prompt) return { title: 'Not Found' };

  const imageUrl = prompt.image?.startsWith('/')
    ? `https://cheerhuan.github.io/prompt-gallery-saas${prompt.image}`
    : prompt.image || '';

  return {
    title: `${prompt.title} — Prompt Gallery`,
    description: prompt.full_prompt?.slice(0, 160) || 'AI prompt curated by Prompt Gallery',
    openGraph: {
      title: `${prompt.title} — AI Prompt`,
      description: prompt.full_prompt?.slice(0, 160),
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function DetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const prompt = promptsData.find(p => p.id === id);

  if (!prompt) {
    notFound();
  }

  return <DetailPageContent prompt={prompt} params={params} />;
}
