/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F15A24',
        'primary-deep': '#D14512',
        'sunshine-300': '#F9C075',
        'sunshine-500': '#F59D3C',
        'sunshine-700': '#F15A24',
        'sunshine-800': '#D14512',
        'sunshine-900': '#962A06',
        'yellow-saturated': '#FBC400',
        'block-5': '#FFF8E7',
        'block-6': '#FFE5B4',
        'block-7': '#FFD27F',
        
        // Dark Mode equivalents of Mistral brand colors
        cream: '#161614', // Lighter dark charcoal (formerly light cream)
        'cream-soft': '#1B1B19', // Slightly lighter dark background
        'cream-deeper': '#272723', // More saturated dark neutral
        'beige-deep': '#2F2F2B', // Dark border color
        canvas: '#0C0C0B', // Dark screen background
        surface: '#11110F', // Main card background
        'surface-cream': '#161614',
        'surface-cream-soft': '#1B1B19',
        'surface-code': '#050505', // Deepest black code block background
        hairline: 'rgba(255, 255, 255, 0.08)',
        'hairline-soft': 'rgba(255, 255, 255, 0.04)',
        'hairline-strong': 'rgba(255, 255, 255, 0.16)',
        ink: '#F5F5F4', // Near white (formerly dark gray/black)
        'ink-tint': '#E7E5E4',
        charcoal: '#D6D3D1',
        slate: '#A8A29E',
        steel: '#78716C',
        stone: '#57534E',
        muted: '#44403C',
        'on-dark': '#FFFFFF',
        'on-dark-muted': 'rgba(255, 255, 255, 0.6)',
        'on-cream': '#F5F5F4', // Light text on dark cream surface
        link: '#F15A24',
        'accent-orange': '#F15A24',
        'accent-orange-glow': 'rgba(241,90,36,0.15)',
        'accent-yellow': '#FBC400',
        'accent-blue': '#3b9eff',
        'accent-blue-glow': 'rgba(59,158,255,0.15)',
        'accent-green': '#10b981',
        'accent-green-glow': 'rgba(16,185,129,0.12)',
        'accent-red': '#ef4444',
        'accent-red-glow': 'rgba(239,68,68,0.15)',
        // Back-compatibility mapping
        brand: {
          dark: '#0C0C0B',
          surface: '#161614',
          modal: '#1B1B19',
          hover: '#272723',
          cyan: '#3b9eff',
          amber: '#FBC400',
          white: '#FFFFFF',
          muted: '#78716C',
          border: 'rgba(255, 255, 255, 0.08)',
          success: '#10b981',
          danger: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        'sans-tight': ['Newsreader', 'Georgia', 'serif'],
        display: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        xxl: '20px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(241, 90, 36, 0.12)',
      }
    },
  },
  plugins: [],
}
