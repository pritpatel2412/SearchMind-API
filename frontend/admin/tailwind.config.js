/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#000000',
        'surface-card': '#0a0a0c',
        'surface-elevated': '#101012',
        'surface-deep': '#06060a',
        'surface-light': '#f1f7fe',
        ink: '#fcfdff',
        body: 'rgba(252,253,255,0.86)',
        charcoal: 'rgba(252,253,255,0.7)',
        mute: '#a1a4a5',
        ash: '#888e90',
        hairline: 'rgba(255,255,255,0.06)',
        'hairline-strong': 'rgba(255,255,255,0.14)',
        'accent-orange': '#ff801f',
        'accent-orange-glow': 'rgba(255,89,0,0.22)',
        'accent-yellow': '#ffc53d',
        'accent-blue': '#3b9eff',
        'accent-blue-glow': 'rgba(0,117,255,0.34)',
        'accent-green': '#11ff99',
        'accent-green-glow': 'rgba(34,255,153,0.18)',
        'accent-red': '#ff2047',
        'accent-red-glow': 'rgba(255,32,71,0.34)',
        // Back-compatibility mapping
        brand: {
          dark: '#000000',
          surface: '#0a0a0c',
          modal: '#101012',
          hover: '#16161a',
          cyan: '#3b9eff',
          amber: '#ffc53d',
          white: '#fcfdff',
          muted: '#a1a4a5',
          border: 'rgba(255,255,255,0.06)',
          success: '#11ff99',
          danger: '#ff2047',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'sans-tight': ['Inter Tight', 'Inter', 'sans-serif'],
        display: ['Tiempos Headline', 'Söhne', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'DM Mono', 'monospace']
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 117, 255, 0.12)',
      }
    },
  },
  plugins: [],
}
