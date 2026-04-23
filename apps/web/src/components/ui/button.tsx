'use client';

import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'default' | 'outline' | 'ghost';
type Size = 'default' | 'sm' | 'icon';

export interface ButtonProps
  extends PropsWithChildren,
    ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

function getVariantClasses(variant: Variant): string {
  switch (variant) {
    case 'outline':
      return 'border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container';
    case 'ghost':
      return 'border border-transparent bg-transparent text-on-surface hover:bg-surface-container';
    case 'default':
    default:
      return 'border border-transparent bg-primary text-on-primary hover:opacity-90';
  }
}

function getSizeClasses(size: Size): string {
  switch (size) {
    case 'sm':
      return 'h-9 px-3 text-sm';
    case 'icon':
      return 'h-10 w-10 p-0';
    case 'default':
    default:
      return 'h-10 px-4';
  }
}

export function Button({
  children,
  className = '',
  type = 'button',
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${getVariantClasses(variant)} ${getSizeClasses(size)} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
