import React from 'react';

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-zinc-800 rounded-xl ${className}`} />
  );
};

export const GallerySkeleton = () => {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="break-inside-avoid mb-4">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="h-4 w-3/4 mt-3 rounded-md" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
