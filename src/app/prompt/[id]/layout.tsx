import React from 'react';
import DetailPage from '@/app/prompt/[id]/page';

export async function generateStaticParams() {
  // Generate all 25 prompt detail pages
  const ids = Array.from({ length: 26 }, (_, i) => String(i + 1));
  return ids.map(id => ({ id }));
}

export default async function Layout({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <DetailPage params={resolvedParams} />;
}
