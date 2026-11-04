import React, { forwardRef, useId } from 'react';

const control = (error) =>
  `w-full rounded-lg border bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 ${error ? 'border-danger' : 'border-line focus:border-primary'}`;

function Shell({ id, label, hint, error, children }) {
  return (
    <div>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>}
      {children}
      {error ? <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-danger">{error}</p>
        : hint ? <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

// One factory for Input / Select / Textarea so label, hint and error are always wired the same way.
const make = (Tag, defaults = {}) =>
  forwardRef(function Control({ label, hint, error, className = '', children, ...rest }, ref) {
    const id = useId();
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
    return (
      <Shell id={id} label={label} hint={hint} error={error}>
        <Tag ref={ref} id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy}
          className={`${control(error)} ${className}`} {...defaults} {...rest}>
          {children}
        </Tag>
      </Shell>
    );
  });

export const Input = make('input');
export const Select = make('select');
export const Textarea = make('textarea', { rows: 3 });
