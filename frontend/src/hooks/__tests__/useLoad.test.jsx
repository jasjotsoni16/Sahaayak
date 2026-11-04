import { act, renderHook, waitFor } from '@testing-library/react';
import useLoad from '../useLoad';

test('starts loading, then exposes the data', async () => {
  const { result } = renderHook(() => useLoad(() => Promise.resolve({ n: 1 }), []));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual({ n: 1 });
  expect(result.current.error).toBeNull();
});

test('a rejected request becomes an error, not a crash', async () => {
  const { result } = renderHook(() => useLoad(() => Promise.reject(new Error('nope')), []));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error.message).toBe('nope');
  expect(result.current.data).toBeNull();
});

test('a result that arrives after unmount is ignored', async () => {
  let resolve;
  const { result, unmount } = renderHook(() => useLoad(() => new Promise((r) => { resolve = r; }), []));
  await waitFor(() => expect(resolve).toBeDefined()); // the loader has started
  unmount();
  resolve('late');
  await Promise.resolve();
  expect(result.current.data).toBeNull(); // never updated after unmount
});

test('reload() runs the loader again, so a failed card can retry', async () => {
  let calls = 0;
  const { result } = renderHook(() => useLoad(() => (++calls === 1 ? Promise.reject(new Error('down')) : Promise.resolve('ok')), []));
  await waitFor(() => expect(result.current.error).not.toBeNull());
  act(() => result.current.reload());
  await waitFor(() => expect(result.current.data).toBe('ok'));
  expect(result.current.error).toBeNull();
  expect(calls).toBe(2);
});
