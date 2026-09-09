/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        accent: {
          amber: '#f59e0b',
          blue: '#2563eb',
          indigo: '#4f46e5'
        },
        forest: '#0F3D2E',
        'secondary-green': '#166534',
        'rich-green': '#166534',
        'emerald-green': '#16A34A',
        gold: '#C28A17',
        'earthy-gold': '#C28A17',
        cream: '#F8F5EC',
        'warm-cream': '#F8F5EC',
        'soft-white': '#FFFDF8',
        'charcoal-text': '#17221B',
        charcoal: '#17221B',
        'muted-slate': '#64748B',
      },
      fontFamily: {
        script: ['Caveat', 'cursive'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
