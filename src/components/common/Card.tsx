import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'rounded-xl transition-colors';
    
    const variants = {
      default: 'bg-white dark:bg-gray-800',
      bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700',
      elevated: 'bg-white dark:bg-gray-800 shadow-lg',
    };

    return (
      <div
        ref={ref}
        className={twMerge(clsx(baseStyles, variants[variant], className))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={twMerge('px-4 lg:px-6 py-4 border-b border-gray-100 dark:border-gray-700', className)} {...props}>
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={twMerge('px-4 lg:px-6 py-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={twMerge('px-4 lg:px-6 py-4 border-t border-gray-100 dark:border-gray-700', className)} {...props}>
    {children}
  </div>
);
