import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, Select, Textarea } from '../Field';

test('the label is associated with the control', async () => {
  const onChange = jest.fn();
  render(<Input label="Mobile number" name="phone" onChange={onChange} />);
  await userEvent.type(screen.getByLabelText('Mobile number'), '9');
  expect(onChange).toHaveBeenCalled();
});

test('an error is announced and linked to the control', () => {
  render(<Input label="Password" error="Too short" />);
  const input = screen.getByLabelText('Password');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('Too short');
  expect(screen.getByRole('alert')).toHaveTextContent('Too short');
});

test('a hint is linked when there is no error', () => {
  render(<Input label="Password" hint="At least 8 characters" />);
  expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('At least 8 characters');
});

test('Select and Textarea are labelled controls too', () => {
  render(<><Select label="Frequency"><option>Monthly</option></Select><Textarea label="Note" /></>);
  expect(screen.getByLabelText('Frequency').tagName).toBe('SELECT');
  expect(screen.getByLabelText('Note').tagName).toBe('TEXTAREA');
});

test('each control gets its own id', () => {
  render(<><Input label="A" /><Input label="B" /></>);
  expect(screen.getByLabelText('A').id).not.toBe(screen.getByLabelText('B').id);
});
