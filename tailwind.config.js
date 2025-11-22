/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vintage: {
          cream: '#F5E6D3',
          brown: '#8B4513',
          orange: '#D2691E',
          yellow: '#DAA520',
          red: '#CD5C5C',
          dark: '#2C1810',
        },
        night: {
          base: '#050608',
          surface: '#0E1117',
          panel: '#151922',
          overlay: '#1E2430',
          accent: '#7DA2FF',
          accentSoft: '#AEC8FF',
          accentGlow: '#9AF0FF',
          text: '#F4F7FB',
          muted: '#9AA3BA',
          warning: '#FF9E7B'
        }
      },
      boxShadow: {
        'ring-glow': '0 0 35px rgba(150, 197, 255, 0.55)',
        'panel': '0 25px 60px rgba(0, 0, 0, 0.55)',
      },
      dropShadow: {
        'text-glow': '0 0 25px rgba(122, 164, 255, 0.65)'
      },
      fontFamily: {
        vintage: ['Courier New', 'monospace'],
        modern: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
