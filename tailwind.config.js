/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ab',
          300: '#f6b876',
          400: '#f1903d',
          500: '#ed721b',
          600: '#de5510',
          700: '#b83d0c',
          800: '#933210',
          900: '#762a0f',
        },
        japanese: {
          red: '#bc002d',
          white: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        japanese: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
