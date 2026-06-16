/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          900: '#062a16',
          800: '#0a3d22',
          700: '#0f5132',
          600: '#14794a',
          500: '#1aa15f',
        },
        gold: {
          400: '#f5c451',
          500: '#e9a900',
          600: '#c98a00',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
};
