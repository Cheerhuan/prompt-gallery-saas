import React from 'react';
import DetailPage from '@/app/prompt/[id]/page';

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

export default async function Layout({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <DetailPage params={resolvedParams} />;
}
