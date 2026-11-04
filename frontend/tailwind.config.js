const t = require('./src/theme/tokens');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        page: t.page, surface: t.surface, ink: t.ink, muted: t.muted, line: t.line,
        primary: { DEFAULT: t.primary, hover: t.primaryHover, tint: t.primaryTint },
        success: { DEFAULT: t.success, tint: t.successTint },
        warning: { DEFAULT: t.warning, tint: t.warningTint },
        danger: { DEFAULT: t.danger, tint: t.dangerTint },
        night: { DEFAULT: t.night, muted: t.nightMuted },
        // Legacy names, remapped so screens that were not redesigned follow the palette.
        accent: t.primaryTint, background: t.page, card: t.surface,
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', '"Noto Sans"', '"Noto Sans Devanagari"', '"Noto Sans Gurmukhi"', '"Noto Sans Tamil"',
          '"Noto Sans Telugu"', '"Noto Sans Bengali"', '"Noto Sans Gujarati"', '"Noto Sans Kannada"', '"Noto Sans Malayalam"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Noto Sans"', '"Noto Sans Devanagari"', '"Noto Sans Gurmukhi"', '"Noto Sans Tamil"',
          '"Noto Sans Telugu"', '"Noto Sans Bengali"', '"Noto Sans Gujarati"', '"Noto Sans Kannada"',
          '"Noto Sans Malayalam"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: { card: '14px' },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: { marquee: 'marquee 45s linear infinite' },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.07), 0 4px 12px rgba(16,24,40,.04)',
        overlay: '0 8px 30px rgba(16,24,40,.18)',
      },
    },
  },
  plugins: [],
};
