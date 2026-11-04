import React from 'react';

const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60';
const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-page',
  ghost: 'text-primary hover:bg-primary-tint',
  danger: 'bg-danger text-white hover:opacity-90',
};
const sizes = { sm: 'min-h-[36px] px-3 py-1.5 text-sm', md: 'min-h-[44px] px-5 py-2.5 text-base' };

export default function Button({ variant = 'primary', size = 'md', loading = false, fullWidth = false, disabled, type = 'button', className = '', children, ...rest }) {
  const classes = [base, variants[variant], sizes[size], fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ');
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={classes} {...rest}>
      {loading && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
