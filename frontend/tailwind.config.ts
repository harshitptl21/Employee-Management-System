import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14171F',
        paper: '#F7F7F5',
        slate: {
          DEFAULT: '#5B6472',
          50: '#F4F5F6',
          100: '#E9EBEE',
          400: '#8B93A1',
          600: '#5B6472',
          800: '#2C3038',
        },
        line: '#E2E4E8',
        'line-dark': '#2A2E37',
        brand: {
          DEFAULT: '#2E5EAA',
          50: '#EBF1FA',
          100: '#D3E1F5',
          400: '#5C87C9',
          600: '#2E5EAA',
          700: '#234A87',
        },
        signal: {
          green: '#1F9D63',
          'green-bg': '#E5F6EC',
          amber: '#C97A1A',
          'amber-bg': '#FBF0E1',
          red: '#C23B3B',
          'red-bg': '#FBEAEA',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#171A21',
        },
        canvas: {
          DEFAULT: '#F7F7F5',
          dark: '#0F1115',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        card: '10px',
        badge: '6px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 23, 31, 0.04), 0 1px 1px rgba(20, 23, 31, 0.03)',
      },
    },
  },
  plugins: [],
};

export default config;
