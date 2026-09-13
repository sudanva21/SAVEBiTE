import React from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'default' | 'yellow' | 'pink' | 'cyan' | 'periwinkle' | 'orange' | 'white';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  rotate?: -2 | -1 | 0 | 1 | 2;
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  rotate,
  className,
  style,
  children,
  ...props
}: CardProps) {
  const rotateStyle = rotate ? { transform: `rotate(${rotate}deg)` } : undefined;

  return (
    <div
      className={cn(
        'flow__card',
        variant !== 'default' && `is--${variant}`,
        className
      )}
      style={{ ...rotateStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
