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
        // Bleu nuit profond — couleur principale
        night: {
          DEFAULT: '#0D1B2A',
          50: '#E8EDF2',
          100: '#C5D2DE',
          200: '#8FA9BF',
          300: '#5A80A0',
          400: '#2E5F82',
          500: '#1A3D5C',
          600: '#0D1B2A',
          700: '#091422',
          800: '#060E18',
          900: '#03080F',
        },
        // Sable clair
        sand: {
          DEFAULT: '#F5EFE6',
          50: '#FDFAF6',
          100: '#FAF4EC',
          200: '#F5EFE6',
          300: '#EDE0CC',
          400: '#DEC9A8',
          500: '#C9A97A',
          600: '#B08B52',
        },
        // Bronze/champagne — accents premium
        bronze: {
          DEFAULT: '#B08B52',
          50: '#FAF5EC',
          100: '#F0E4C8',
          200: '#DEC9A8',
          300: '#C9A97A',
          400: '#B08B52',
          500: '#8C6A38',
          600: '#6B4F28',
        },
        // Blanc cassé
        cream: {
          DEFAULT: '#FDFAF6',
          50: '#FFFFFF',
          100: '#FDFAF6',
          200: '#FAF4EC',
        },
        // Compatibilité admin (ancien code)
        primary: {
          DEFAULT: '#0D1B2A',
          50: '#E8EDF2',
          100: '#C5D2DE',
          300: '#5A80A0',
          500: '#1A3D5C',
          600: '#0D1B2A',
          700: '#091422',
        },
        accent: {
          DEFAULT: '#B08B52',
          50: '#FAF5EC',
          100: '#F0E4C8',
          500: '#B08B52',
          600: '#8C6A38',
        },
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'widest-xl': '0.25em',
        'widest-lg': '0.2em',
        'widest-md': '0.15em',
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'fade-in': 'fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
