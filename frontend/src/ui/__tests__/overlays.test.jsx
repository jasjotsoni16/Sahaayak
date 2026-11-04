import React, { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';
import { Toaster } from '../Toast';
import { notify } from '../toastBus';
import { ConfirmProvider, useConfirm } from '../ConfirmDialog';

function ModalHarness({ onClose }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      <Modal open={open} onClose={() => { onClose(); setOpen(false); }} title="Edit">
        <input aria-label="first" />
        <button>last</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  test('is a labelled dialog, focuses its first field and locks scroll', async () => {
    render(<ModalHarness onClose={() => {}} />);
    await userEvent.click(screen.getByText('open'));
    expect(screen.getByRole('dialog', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByLabelText('first')).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('Esc closes, focus returns to the opener and scroll unlocks', async () => {
    const onClose = jest.fn();
    render(<ModalHarness onClose={onClose} />);
    await userEvent.click(screen.getByText('open'));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('open')).toHaveFocus();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  test('Tab is trapped inside the dialog in both directions', async () => {
    render(<ModalHarness onClose={() => {}} />);
    await userEvent.click(screen.getByText('open'));
    screen.getByText('last').focus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByText('last')).toHaveFocus();
  });

  test('clicking the backdrop closes, clicking inside does not', async () => {
    const onClose = jest.fn();
    render(<ModalHarness onClose={onClose} />);
    await userEvent.click(screen.getByText('open'));
    await userEvent.click(screen.getByLabelText('first'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Toaster', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('shows a message and removes it after a few seconds', () => {
    render(<Toaster />);
    act(() => { notify.success('Saved'); });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(4100); });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  test('errors stay longer than successes', () => {
    render(<Toaster />);
    act(() => { notify.error('Could not save'); });
    act(() => { jest.advanceTimersByTime(4100); });
    expect(screen.getByText('Could not save')).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(2000); });
    expect(screen.queryByText('Could not save')).not.toBeInTheDocument();
  });

  test('auto() infers the tone from the wording', () => {
    render(<Toaster />);
    act(() => { notify.auto('Failed to apply for job'); notify.auto('Profile saved'); notify.auto('Heads up'); });
    expect(screen.getByText('Failed to apply for job').parentElement).toHaveClass('text-danger');
    expect(screen.getByText('Profile saved').parentElement).toHaveClass('text-success');
    expect(screen.getByText('Heads up').parentElement).toHaveClass('text-ink');
  });

  test('a toast can be dismissed by hand', () => {
    render(<Toaster />);
    act(() => { notify.info('Hello'); });
    act(() => { screen.getByRole('button', { name: 'Dismiss' }).click(); });
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  function Demo({ onResult }) {
    const confirm = useConfirm();
    return <button onClick={async () => onResult(await confirm({ title: 'Delete skill?', message: 'This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' }))}>ask</button>;
  }
  const setup = () => { const onResult = jest.fn(); render(<ConfirmProvider><Demo onResult={onResult} /></ConfirmProvider>); return onResult; };

  test('resolves true on confirm', async () => {
    const onResult = setup();
    await userEvent.click(screen.getByText('ask'));
    expect(screen.getByRole('dialog', { name: 'Delete skill?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onResult).toHaveBeenCalledWith(true);
  });
  test('resolves false on cancel and on Esc', async () => {
    const onResult = setup();
    await userEvent.click(screen.getByText('ask'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onResult).toHaveBeenLastCalledWith(false);
    await userEvent.click(screen.getByText('ask'));
    await userEvent.keyboard('{Escape}');
    expect(onResult).toHaveBeenLastCalledWith(false);
  });
});
