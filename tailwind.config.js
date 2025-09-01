/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core theme colors
        'background': 'rgb(var(--background) / <alpha-value>)',
        'foreground': 'rgb(var(--foreground) / <alpha-value>)',
        
        // Background colors
        'bg-dark': '#171717',
        'bg-light': '#E1DBD3',
        
        // Foreground colors
        'fg-primary-dark': '#F8F8F6',
        'fg-primary-light': '#1C1C1E',
        'fg-body-light': '#4A4A4F',
        'fg-muted': '#737373',
        'fg-muted-secondary': '#D4D4D4',
        
        // Card backgrounds
        'card-dark': '#262626',
        'card-light': '#F4F1ED',
        'card-light-secondary': '#D3CCC4',
        
        // Brand colors
        'primary': '#00E5A0', // Neon Jade
        'secondary': '#3D5A80', // Deep Blue
        'accent': '#EE6C4D', // Coral
        
        // Accent variations
        'teal-dark': '#014D40',
        'teal-light': '#018C6F',
        'aqua': '#98C1D9',
        
        // Border and highlights
        'border-gold': '#C9B037', // Muted Gold
        
        // Status colors
        'red-primary': '#DC2626',
        'red-secondary': '#EF4444',
        
        // Deep accents
        'deep-blue': '#2E4A6B',
        'deep-gold': '#A79029',
        'deep-red': '#DC482B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};