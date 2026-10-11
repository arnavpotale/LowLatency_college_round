/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          canvas: 'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          subtle: 'var(--bg-subtle)',
          sidebar: 'var(--bg-sidebar)',
          hover: 'var(--bg-hover)',
          active: 'var(--bg-active)',
          border: 'var(--border-subtle)',
          borderStrong: 'var(--border-strong)',
          textPrimary: 'var(--text-primary)',
          textSecondary: 'var(--text-secondary)',
          textMuted: 'var(--text-muted)',
          accent: 'var(--accent)',
          accentHover: 'var(--accent-hover)',
          accentSubtle: 'var(--accent-subtle)',
          accentBorder: 'var(--accent-border)',
          accentText: 'var(--accent-text)',
        },
        brand: {
          50: '#EBF5F1',
          100: '#D5ECE3',
          200: '#B2DDD0',
          300: '#8BCABB',
          400: '#65B89D',
          500: '#3D9E80',
          600: '#268469',
          700: '#176B58',
          800: '#125546',
          900: '#0E4035',
          950: '#07241E',
        },
        verdict: {
          supported: 'var(--verdict-sup-text)',
          contradicted: 'var(--verdict-cont-text)',
          unsupported: 'var(--verdict-unsup-text)',
          ambiguous: 'var(--verdict-amb-text)',
          inconclusive: 'var(--verdict-inc-text)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
