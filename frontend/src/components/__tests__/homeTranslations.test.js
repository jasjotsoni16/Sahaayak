const fs = require('fs');
const path = require('path');
const hi = require('../../i18n/locales/hi.json');

// Every string on the home page goes through h('key', 'English'); the Hindi file must have each key,
// or Hindi visitors would silently see English for that line.
test('the Hindi file has every home page key', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'HomePage.jsx'), 'utf8');
  const keys = [...source.matchAll(/\bh\('([A-Za-z0-9]+)'/g)].map((m) => m[1]);
  expect(keys.length).toBeGreaterThan(30);
  const missing = [...new Set(keys)].filter((k) => !hi.home || !hi.home[k]);
  expect(missing).toEqual([]);
});

test('there are no leftover Hindi keys the page no longer uses', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'HomePage.jsx'), 'utf8');
  const used = new Set([...source.matchAll(/\bh\('([A-Za-z0-9]+)'/g)].map((m) => m[1]));
  expect(Object.keys(hi.home).filter((k) => !used.has(k))).toEqual([]);
});
