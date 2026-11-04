import React, { useEffect, useRef, useState } from 'react';
import { searchPlaces } from '../api';

// Text box with place suggestions. Typing alone is fine (the server resolves the text);
// picking a suggestion gives exact coordinates.
export default function PlaceSearch({ value, onTextChange, onSelect, placeholder, className = '' }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);       // ignore answers to outdated searches
  const justPicked = useRef(false); // don't re-search right after a suggestion fills the box

  useEffect(() => {
    if (justPicked.current) { justPicked.current = false; return undefined; }
    const text = (value || '').trim();
    if (text.length < 3) { setResults([]); return undefined; }
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchPlaces(text);
        if (ticket === latest.current) { setResults(res.data.results || []); setOpen(true); }
      } catch {
        if (ticket === latest.current) setResults([]);
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [value]);

  const pick = (place) => {
    justPicked.current = true;
    setOpen(false);
    setResults([]);
    onSelect(place);
  };

  return (
    <div className="relative flex-1">
      <input
        value={value}
        onChange={(e) => onTextChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && (results.length > 0 || loading) && (
        <ul className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-xl border border-line bg-surface shadow-overlay">
          {loading && results.length === 0 && <li className="px-4 py-2 text-sm text-muted">Searching…</li>}
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button type="button" onMouseDown={() => pick(r)} className="min-h-[44px] w-full px-4 py-2 text-left text-sm hover:bg-page">
                <span className="font-medium">{r.city || r.label.split(',')[0]}</span>
                <span className="text-muted">{r.state ? `, ${r.state}` : ''}{r.pincode ? ` · ${r.pincode}` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
