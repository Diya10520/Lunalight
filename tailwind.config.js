/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sun: '#facc15',
        earth: '#3b82f6',
        go: '#22c55e',
        caution: '#eab308',
        nogo: '#ef4444',
      },
    },
  },
  plugins: [],
};
