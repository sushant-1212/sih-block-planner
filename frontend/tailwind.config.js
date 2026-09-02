/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          900: '#070b14',
          850: '#0b1120',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
          green: '#10b981',
          hazard: '#ef4444',
          warn: '#f59e0b',
          accent: '#38bdf8'
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'track-flow': 'trackFlow 1.5s linear infinite',
      },
      keyframes: {
        trackFlow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' }
        }
      }
    },
  },
  plugins: [],
}
