import React from 'react';

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div className={`skeleton-shimmer rounded-xl ${className || ''}`} />
  );
};

export const GallerySkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Featured skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 md:row-span-2">
          <Skeleton className="aspect-[21/9] md:aspect-[16/9] w-full rounded-2xl" />
        </div>
        <div className="md:col-span-1">
          <Skeleton className="aspect-[4/5] w-full rounded-xl" />
        </div>
        <div className="md:col-span-1">
          <Skeleton className="aspect-[4/5] w-full rounded-xl" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <Skeleton className="h-3 w-3/4 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
};
