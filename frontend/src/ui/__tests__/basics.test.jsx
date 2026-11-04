import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';
import Card from '../Card';
import Badge from '../Badge';
import EmptyState from '../EmptyState';
import PageHeader from '../PageHeader';
import Tabs from '../Tabs';
import Segmented from '../Segmented';

describe('Button', () => {
  test('renders children and fires onClick', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  test('loading disables the button, marks it busy and blocks clicks', async () => {
    const onClick = jest.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
  test('variants map to different styles and default type is "button"', () => {
    const { rerender } = render(<Button>A</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    rerender(<Button variant="danger">A</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger');
    rerender(<Button variant="secondary" type="submit">A</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});

test('Card shows its title and children', () => {
  render(<Card title="Profile">hello</Card>);
  expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
  expect(screen.getByText('hello')).toBeInTheDocument();
});

test('Badge applies the tone', () => {
  render(<Badge tone="success">Confirmed</Badge>);
  expect(screen.getByText('Confirmed')).toHaveClass('bg-success-tint', 'text-success');
});

test('EmptyState renders title, description and action', () => {
  render(<EmptyState title="No jobs" description="Try later" action={<button>Reload</button>} />);
  expect(screen.getByText('No jobs')).toBeInTheDocument();
  expect(screen.getByText('Try later')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
});

test('PageHeader renders a level-1 heading and its action', () => {
  render(<PageHeader title="Jobs" subtitle="Near you" action={<button>New</button>} />);
  expect(screen.getByRole('heading', { level: 1, name: 'Jobs' })).toBeInTheDocument();
  expect(screen.getByText('Near you')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
});

test('Tabs mark the active tab and report changes', async () => {
  const onChange = jest.fn();
  render(<Tabs label="Jobs" value="a" onChange={onChange} tabs={[{ id: 'a', label: 'Available' }, { id: 'b', label: 'Mine' }]} />);
  expect(screen.getByRole('tab', { name: 'Available' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Mine' })).toHaveAttribute('aria-selected', 'false');
  await userEvent.click(screen.getByRole('tab', { name: 'Mine' }));
  expect(onChange).toHaveBeenCalledWith('b');
});

test('Segmented behaves as a radio group', async () => {
  const onChange = jest.fn();
  render(<Segmented label="I am a" value="seeker" onChange={onChange}
    options={[{ value: 'seeker', label: 'Job seeker' }, { value: 'provider', label: 'Employer' }]} />);
  expect(screen.getByRole('radio', { name: 'Job seeker' })).toHaveAttribute('aria-checked', 'true');
  await userEvent.click(screen.getByRole('radio', { name: 'Employer' }));
  expect(onChange).toHaveBeenCalledWith('provider');
});
