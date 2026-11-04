// The palette (CommonJS so tailwind.config.js can require it). Every text/background
// pairing below is checked for WCAG AA contrast in __tests__/tokens.test.js.
module.exports = {
  page: '#F4F5F7', surface: '#FFFFFF', ink: '#1D2433', muted: '#5F6779', line: '#E3E6EC',
  primary: '#3B5BDB', primaryHover: '#324DC0', primaryTint: '#E4E9FB',
  success: '#1F7A4D', successTint: '#E3F5EB',
  warning: '#8A5A0B', warningTint: '#FDF3DC',
  danger: '#C03939', dangerTint: '#FDE8E8',
  // Dark surfaces for the marketing page (hero, closing call to action)
  night: '#0B1220', nightMuted: '#AAB4C8',
};
