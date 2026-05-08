import React from 'react';
import DetailPage from '@/app/prompt/[id]/page';

export async function generateStaticParams() {
  // Auto-detect: dynamically generate for all prompts
  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src/data/prompts.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const ids = Array.from({ length: data.length }, (_, i) => String(i + 1));
  return ids.map(id => ({ id }));
}

export default async function Layout({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <DetailPage params={resolvedParams} />;
}
