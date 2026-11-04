import React from 'react';

export default function Card({ title, footer, className = '', as: Tag = 'section', children }) {
  return (
    <Tag className={`rounded-card bg-surface p-5 shadow-card ${className}`}>
      {title && <h3 className="mb-3 text-lg font-semibold text-ink">{title}</h3>}
      {children}
      {footer && <div className="mt-4">{footer}</div>}
    </Tag>
  );
}
