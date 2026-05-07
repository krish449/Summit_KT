import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f7fa',
          100: '#dce8f2',
          200: '#bacee0',
          300: '#8daec8',
          400: '#5d87ab',
          500: '#3d6c92',
          600: '#2c5677',
          700: '#1E3A5F',
          800: '#18304f',
          900: '#162945',
        },
        accent: {
          50: '#effcf9',
          100: '#c8f6ee',
          200: '#93ecdf',
          300: '#59d8ca',
          400: '#28b9ad',
          500: '#0D9488',
          600: '#0c786f',
          700: '#0d615a',
          800: '#104d49',
          900: '#123f3c',
        },
      },
      boxShadow: {
        soft: '0 12px 48px rgba(21, 44, 68, 0.12)',
      },
      backgroundImage: {
        'hero-grid': 'radial-gradient(circle at top left, rgba(13,148,136,0.12), transparent 34%), linear-gradient(135deg, rgba(30,58,95,0.96), rgba(18,41,69,0.98))',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;