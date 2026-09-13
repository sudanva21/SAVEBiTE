import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'default' | 'alt' | 'black' | 'cyan' | 'orange' | 'pink' | 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'default',
  href,
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  // If href is provided, render Link; otherwise button
  if (href) {
    if (variant === 'alt') {
      return (
        <Link href={href} className={cn('button-alt', className)}>
          <span className="button-alt__text-wrap">
            <span className="button-alt__text-bg" />
            <span className="button-alt__text-outer">{children}</span>
          </span>
          <span className="button-alt__icon-wrap">
            <span className="button-alt__icon-bg" />
            <span className="button-alt__icon-outer">
              {icon || (
                <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden="true">
                  <path
                    d="M13.58 5.66v.845l-5.994 5.66-1.71-2.063a61.427 61.427 0 0 1 4.265-2.988l-.02-.078c-1.828.196-4.107.294-6.387.294H0V4.835h3.734c2.28 0 4.56.098 6.387.294l.02-.059a67.638 67.638 0 0 1-4.265-3.006L7.586 0l5.994 5.66Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </span>
          </span>
        </Link>
      );
    }

    return (
      <Link
        href={href}
        className={cn(
          'button',
          variant !== 'default' && `is--${variant}`,
          className
        )}
      >
        <span className="button__bg" />
        <span className="button__inner">
          <span className="button__text">{children}</span>
          {icon}
        </span>
      </Link>
    );
  }

  if (variant === 'alt') {
    return (
      <button type="button" className={cn('button-alt', className)} {...props}>
        <span className="button-alt__text-wrap">
          <span className="button-alt__text-bg" />
          <span className="button-alt__text-outer">{children}</span>
        </span>
        <span className="button-alt__icon-wrap">
          <span className="button-alt__icon-bg" />
          <span className="button-alt__icon-outer">
            {icon || (
              <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden="true">
                <path
                  d="M13.58 5.66v.845l-5.994 5.66-1.71-2.063a61.427 61.427 0 0 1 4.265-2.988l-.02-.078c-1.828.196-4.107.294-6.387.294H0V4.835h3.734c2.28 0 4.56.098 6.387.294l.02-.059a67.638 67.638 0 0 1-4.265-3.006L7.586 0l5.994 5.66Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      className={cn(
        'button',
        variant !== 'default' && `is--${variant}`,
        className
      )}
      {...props}
    >
      <span className="button__bg" />
      <span className="button__inner">
        <span className="button__text">{children}</span>
        {icon}
      </span>
    </button>
  );
}
