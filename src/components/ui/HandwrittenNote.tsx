import React from 'react';
import { cn } from '@/lib/utils';

export interface HandwrittenNoteProps extends React.HTMLAttributes<HTMLParagraphElement> {
  rotate?: number;
  size?: 'regular' | 'medium' | 'big';
  children: React.ReactNode;
}

export function HandwrittenNote({
  rotate = 3.5,
  size = 'regular',
  className,
  style,
  children,
  ...props
}: HandwrittenNoteProps) {
  const sizeClass = size === 'big' ? 'u-handwritten-big' : 'u-handwritten-regular';

  return (
    <p
      className={cn(sizeClass, className)}
      style={{
        transform: `rotate(${rotate}deg)`,
        ...(size === 'medium' ? { fontSize: '1.25em' } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </p>
  );
}
