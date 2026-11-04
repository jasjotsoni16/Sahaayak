import React from 'react';

export default function Segmented({ label, value, onChange, options }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-full border border-line bg-page p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value} type="button" role="radio" aria-checked={active} onClick={() => onChange(o.value)}
              className={`min-h-[40px] flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? 'bg-surface text-primary shadow-card' : 'text-muted hover:text-ink'}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
