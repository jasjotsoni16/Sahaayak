import React from 'react';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="py-12 text-center">
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
