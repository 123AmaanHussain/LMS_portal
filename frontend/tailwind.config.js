/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#09090b',
          900: '#0c0c0f',
          800: '#131318',
          700: '#1a1a22',
          600: '#24242e',
          500: '#2e2e3a',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        }
      },
      boxShadow: {
        'glow': '0 0 30px rgba(16, 185, 129, 0.25)',
        'glow-sm': '0 0 15px rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
