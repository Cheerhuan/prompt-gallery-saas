import { notFound } from 'next/navigation';
import promptsData from '@/data/prompts.json';
import DetailPageContent from './DetailPageContent';

export async function generateStaticParams() {
  return promptsData.map((prompt) => ({
    id: prompt.id,
  }));
}

export default async function DetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const prompt = promptsData.find(p => p.id === id);

  if (!prompt) {
    notFound();
  }

  return <DetailPageContent prompt={prompt} params={params} />;
}
