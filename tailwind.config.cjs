/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './services/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { light: '#76C4D5', DEFAULT: '#2A9DB1', dark: '#1E7A8C' },
        secondary: { light: '#FBCDBA', DEFAULT: '#F7A17F', dark: '#E3815D' },
        accent: '#E86A33',
        neutral: {
          100: '#FCFCFC',
          200: '#F3F4F6',
          300: '#E5E7EB',
          400: '#D1D5DB',
          500: '#9CA3AF',
          600: '#6B7280',
          700: '#4B5563',
          800: '#374151',
          900: '#1F2937',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        areumFooter: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        monoExport: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

