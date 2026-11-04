import { useCallback, useEffect, useState } from 'react';

// Runs an async loader and exposes { data, loading, error, reload }. Each card on a page can use its
// own useLoad, so one failing request never blanks the whole screen, and reload() lets that card
// retry on its own. A result that arrives after the component has unmounted (or the dependencies
// changed) is ignored.
export default function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(loader)
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState({ data: null, loading: false, error }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
