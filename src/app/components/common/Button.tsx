import React from 'react';
import { TRAVEL_COLORS } from '../../types/travel';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const variantStyles: Record<Variant, string> = {
  primary: 'border-transparent text-white shadow-sm',
  secondary: 'bg-white text-slate-700',
  ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
  danger: 'border-transparent bg-rose-500 text-white',
};

const variantInlineStyle: Record<Variant, React.CSSProperties> = {
  primary: { background: `linear-gradient(135deg, ${TRAVEL_COLORS.blue}, ${TRAVEL_COLORS.cyan})` },
  secondary: { borderColor: TRAVEL_COLORS.border, backgroundColor: '#ffffff' },
  ghost: {},
  danger: { backgroundColor: '#EF4444' },
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

export function Button({
  children,
  className = '',
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={variantInlineStyle[variant]}
      {...props}
    >
      {children}
    </button>
  );
}
