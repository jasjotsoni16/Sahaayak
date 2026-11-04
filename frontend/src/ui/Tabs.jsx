import React from 'react';

export default function Tabs({ tabs, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id} type="button" role="tab" aria-selected={active} onClick={() => onChange(tab.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
