import React, { createContext, useCallback, useContext, useState } from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const confirm = useCallback((options) => new Promise((resolve) => setRequest({ ...options, resolve })), []);
  const settle = (value) => { if (request) request.resolve(value); setRequest(null); };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!request} onClose={() => settle(false)} title={request && request.title} size="sm">
        {request && (
          <>
            <p className="text-muted">{request.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => settle(false)}>{request.cancelLabel || 'Cancel'}</Button>
              <Button variant={request.tone === 'danger' ? 'danger' : 'primary'} onClick={() => settle(true)}>{request.confirmLabel || 'Confirm'}</Button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
};
