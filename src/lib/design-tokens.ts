// Design tokens to guarantee pixel-perfect parity
export const colors = {
  // Backgrounds
  background: {
    dark: '#171717',
    light: '#E1DBD3',
  },
  
  // Foregrounds
  foreground: {
    primary: {
      dark: '#F8F8F6',
      light: '#1C1C1E',
    },
    body: {
      light: '#4A4A4F',
    },
    muted: '#737373',
    mutedSecondary: '#D4D4D4',
  },
  
  // Card backgrounds
  card: {
    dark: '#262626',
    light: '#F4F1ED',
    lightSecondary: '#D3CCC4',
  },
  
  // Brand colors
  primary: '#00E5A0', // Neon Jade
  secondary: '#3D5A80', // Deep Blue
  accent: '#EE6C4D', // Coral
  
  // Accent variations
  teal: {
    dark: '#014D40',
    light: '#018C6F',
  },
  aqua: '#98C1D9',
  
  // Border and highlights
  border: '#C9B037', // Muted Gold
  
  // Status colors
  red: {
    primary: '#DC2626',
    secondary: '#EF4444',
  },
  
  // Deep accents
  deepBlue: '#2E4A6B',
  deepGold: '#A79029',
  deepRed: '#DC482B',
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const;

export const borderRadius = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;