import React from 'react';
import LanguageSelector from './LanguageSelector';

// Shared frame for the public screens (login, signup, admin login): one calm centered card.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-page px-4 py-6">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <span className="text-lg font-bold tracking-tight text-primary">Sahaayak</span>
        <LanguageSelector variant="compact" showLabel={false} size="small" />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
        <div className="rounded-card bg-surface p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
