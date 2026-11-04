const tokens = require('../tokens');
const { contrastRatio } = require('../contrast');

test('contrast helper matches known values', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
});

const PAIRS = [
  ['ink', 'page'], ['ink', 'surface'],
  ['muted', 'page'], ['muted', 'surface'],
  ['primary', 'surface'], ['primary', 'page'], ['primary', 'primaryTint'],
  ['surface', 'primary'], ['surface', 'primaryHover'],
  ['success', 'successTint'], ['success', 'surface'],
  ['warning', 'warningTint'], ['warning', 'surface'],
  ['danger', 'dangerTint'], ['danger', 'surface'], ['surface', 'danger'],
  ['surface', 'night'], ['nightMuted', 'night'],
];

test.each(PAIRS)('%s on %s meets WCAG AA (4.5:1)', (fg, bg) => {
  expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
});
