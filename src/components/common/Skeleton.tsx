import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  ...props
}) => {
  const baseStyles = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      style={{ width, height }}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
    <Skeleton className="h-6 w-3/4 mb-4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1">
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </div>
);

export const DeckCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
    <Skeleton className="h-4 w-16 rounded mb-3" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-3 w-1/3" />
  </div>
);
