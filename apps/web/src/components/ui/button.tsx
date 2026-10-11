'use client';

import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'default' | 'outline' | 'ghost';
type Size = 'default' | 'sm' | 'icon';

export interface ButtonProps extends PropsWithChildren, ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  default: 'border-2 border-ink bg-lime text-ink shadow-[3px_3px_0_rgba(17,17,17,.25)] hover:bg-paper',
  outline: 'border-2 border-outline bg-surface text-on-surface shadow-[3px_3px_0_rgba(17,17,17,.13)] hover:bg-surface-container',
  ghost: 'border-2 border-transparent bg-transparent text-on-surface hover:border-outline hover:bg-surface-container-low',
};

const sizes: Record<Size, string> = {
  default: 'min-h-11 px-5 py-2 text-xs',
  sm: 'min-h-9 px-3 py-1 text-[11px]',
  icon: 'h-11 w-11 p-0',
};

export function Button({ children, className = '', type = 'button', variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-extrabold uppercase tracking-[.045em] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:transform-none ${variants[variant]} ${sizes[size]} ${className}`.trim()}
      {...props}>{children}</button>
  );
}
