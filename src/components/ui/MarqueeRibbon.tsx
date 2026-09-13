import React from 'react';
import { cn } from '@/lib/utils';

export interface MarqueeRibbonProps {
  items?: string[];
  variant?: 'primary' | 'secondary';
  className?: string;
}

const DEFAULT_LIFECYCLE_ITEMS = [
  'PREDICT',
  'PREVENT',
  'PRODUCE',
  'TRACK',
  'DETECT SURPLUS',
  'ASSESS',
  'MATCH',
  'REDISTRIBUTE',
  'RECOVER',
  'OPTIMIZE',
  'MEASURE',
  'IMPROVE',
];

export function MarqueeRibbon({
  items = DEFAULT_LIFECYCLE_ITEMS,
  variant = 'primary',
  className,
}: MarqueeRibbonProps) {
  const content = items.join(' • ');

  return (
    <div className={cn('ad-banner-wrap', className)}>
      <div className={cn('ad-banner', variant === 'primary' ? 'is--primary' : 'is--secondary')}>
        <div className="ad-text">
          <span>{content} • {content} • </span>
          <span>{content} • {content} • </span>
        </div>
      </div>
    </div>
  );
}
