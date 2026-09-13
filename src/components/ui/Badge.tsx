import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'orange' | 'pink' | 'yellow' | 'cyan' | 'periwinkle' | 'green' | 'black' | 'blue' | 'purple';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn('tag-small', variant !== 'default' && `is--${variant}`, className)}
      {...props}
    >
      {children}
    </span>
  );
}
