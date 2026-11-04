const fs = require('fs');
const path = require('path');
const hi = require('../../i18n/locales/hi.json');

// Every dashboard string goes through d('key', 'English'). Strings that take a count are looked up
// as key_one / key_other, so those need both forms in Hindi.
const source = fs.readFileSync(path.join(__dirname, '..', 'SeekerDashboard.jsx'), 'utf8');
const calls = [...source.matchAll(/\bd\('([A-Za-z0-9]+)',([^;]*?)\)(?=[\s}\]),;])/g)];
const keys = new Set(calls.map((m) => m[1]));
const plural = new Set(calls.filter((m) => /count:/.test(m[2])).map((m) => m[1]));

test('the Hindi file has every dashboard key', () => {
  expect(keys.size).toBeGreaterThan(40);
  const needed = [...keys].flatMap((k) => (plural.has(k) ? [`${k}_one`, `${k}_other`] : [k]));
  expect(needed.filter((k) => !hi.dashboard || !hi.dashboard[k])).toEqual([]);
});

test('there are no leftover Hindi dashboard keys', () => {
  const unused = Object.keys(hi.dashboard).filter((k) => !keys.has(k.replace(/_(one|other)$/, '')));
  expect(unused).toEqual([]);
});
