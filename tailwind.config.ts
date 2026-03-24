import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4F72',
          50: '#EBF5FB',
          100: '#D6EAF8',
          500: '#2E86C1',
          600: '#1B4F72',
          700: '#154360',
        },
        accent: {
          DEFAULT: '#F39C12',
          50: '#FEF9E7',
          100: '#FDEBD0',
          500: '#F39C12',
          600: '#D68910',
        },
        sand: {
          50: '#FDFAF6',
          100: '#FAF3E8',
          200: '#F5E6D0',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
