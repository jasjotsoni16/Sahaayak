import { navFor, homeFor } from '../navConfig';

const ROLES = ['seeker', 'provider', 'investor', 'admin'];

test.each(ROLES)('%s has at most 4 primary destinations', (role) => {
  const { primary } = navFor(role);
  expect(primary.length).toBeGreaterThan(0);
  expect(primary.length).toBeLessThanOrEqual(4);
});

test.each(ROLES)('%s has no duplicate destinations and every item has a label and icon', (role) => {
  const { primary, more } = navFor(role);
  const all = [...primary, ...more];
  expect(new Set(all.map((i) => i.to)).size).toBe(all.length);
  all.forEach((i) => { expect(i.label).toBeTruthy(); expect(i.key).toMatch(/^navigation\./); expect(i.icon).toBeTruthy(); });
});

test('seekers can reach their dashboard, jobs, skills and salary from the primary bar', () => {
  const tos = navFor('seeker').primary.map((i) => i.to);
  expect(tos).toEqual(['/dashboard', '/jobs', '/skills', '/salary']);
});

test('alerts stay reachable for seekers (under More; the bell is in the top bar)', () => {
  expect(navFor('seeker').more.map((i) => i.to)).toContain('/notifications');
});

test('unknown roles get an empty menu and a safe home', () => {
  expect(navFor('nope')).toEqual({ primary: [], more: [] });
  expect(homeFor('nope')).toBe('/login');
});

test('each role lands on its own dashboard', () => {
  expect(homeFor('seeker')).toBe('/dashboard');
  expect(homeFor('provider')).toBe('/employer-dashboard');
  expect(homeFor('investor')).toBe('/investment-opportunities');
  expect(homeFor('admin')).toBe('/admin/dashboard');
});
