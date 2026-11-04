import React, { useEffect, useRef, useState } from 'react';
import { notify, subscribe } from './toastBus';

const DURATION = { error: 6000, success: 4000, info: 4000 };
const TONE = {
  success: 'border-success/20 bg-success-tint text-success',
  error: 'border-danger/20 bg-danger-tint text-danger',
  info: 'border-line bg-surface text-ink',
};

export const useToast = () => notify;

export function Toaster() {
  const [toasts, setToasts] = useState([]);
  const removeRef = useRef(() => {});

  useEffect(() => {
    const timers = new Map();
    const remove = (id) => {
      clearTimeout(timers.get(id));
      timers.delete(id);
      setToasts((current) => current.filter((t) => t.id !== id));
    };
    removeRef.current = remove;
    const unsubscribe = subscribe((toast) => {
      setToasts((current) => [...current.slice(-3), toast]); // keep the latest four
      timers.set(toast.id, setTimeout(() => remove(toast.id), DURATION[toast.tone] || 4000));
    });
    return () => { unsubscribe(); timers.forEach(clearTimeout); };
  }, []);

  return (
    <div role="status" aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:w-96 md:bottom-6">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-overlay ${TONE[t.tone]}`}>
          <span className="flex-1">{t.message}</span>
          <button type="button" aria-label="Dismiss" onClick={() => removeRef.current(t.id)} className="text-lg leading-none opacity-70 hover:opacity-100">×</button>
        </div>
      ))}
    </div>
  );
}
