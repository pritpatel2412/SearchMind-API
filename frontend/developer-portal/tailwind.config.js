/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#030712',       // deep dark gray/black
          card: 'rgba(17, 24, 39, 0.7)', // glassmorphic dark gray
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#f3f4f6',
          primary: '#6366f1',    // Indigo-500
          primaryHover: '#4f46e5',
          secondary: '#a855f7',  // Purple-500
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      boxShadow: {
        glow: '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.15)',
      }
    },
  },
  plugins: [],
}
