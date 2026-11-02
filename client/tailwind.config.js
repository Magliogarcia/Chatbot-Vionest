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
        brand: {
          50: '#edf8fd',
          100: '#d1eefb',
          200: '#a8ddf7',
          300: '#6ec8f0',
          400: '#3fb8e8',
          500: '#2bace2',
          600: '#1e94c8',
          700: '#1a78a3',
          800: '#186085',
          900: '#174f6e',
          950: '#0e3549',
        },
        navy: {
          deep: '#1b275d',
          mid: '#283160',
          light: '#3d4e8a',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f8fafc',
          card: '#ffffff',
          hover: '#f1f5f9',
          border: '#e2e8f0',
          muted: '#64748b',
        },
        accent: {
          cyan: '#2bace2',
          teal: '#0d9488',
          amber: '#d97706',
          emerald: '#059669',
          rose: '#e11d48'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
