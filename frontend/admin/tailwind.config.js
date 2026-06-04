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
          dark: '#0f172a',       // slate-900 admin feel
          card: 'rgba(30, 41, 59, 0.7)', // glass slate-800
          border: 'rgba(255, 255, 255, 0.06)',
          text: '#f8fafc',
          primary: '#8b5cf6',    // Violet-500
          primaryHover: '#7c3aed',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
