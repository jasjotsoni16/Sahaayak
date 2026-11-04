// A tiny event bus so any code (components, services, plain functions) can show a toast
// without hooks. <Toaster /> subscribes once at the app root.
const listeners = new Set();
let nextId = 1;

const inferTone = (message) => {
  const m = String(message).toLowerCase();
  if (/(fail|error|could not|couldn't|unable|invalid|denied|wrong|not found|not logged in|try again|cannot|can't)/.test(m)) return 'error';
  if (/(success|saved|created|updated|complete|sent|submitted|added|deleted|applied|confirmed|accepted|rejected|posted|signed|recommended|initiated|fetched|generated|assigned|\bleft\b)/.test(m)) return 'success';
  return 'info';
};

const show = (message, tone = 'info') => {
  const toast = { id: nextId++, message: String(message), tone };
  listeners.forEach((fn) => fn(toast));
  return toast.id;
};

export const notify = {
  show,
  success: (m) => show(m, 'success'),
  error: (m) => show(m, 'error'),
  info: (m) => show(m, 'info'),
  auto: (m) => show(m, inferTone(m)),
};

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
