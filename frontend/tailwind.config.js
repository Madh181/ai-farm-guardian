/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        farm: {
          50: '#f2faf3',
          100: '#e0f3e2',
          200: '#c2e6c8',
          300: '#94d19f',
          400: '#5eb56f',
          500: '#399a4c',
          600: '#297d3b',
          700: '#226431',
          800: '#1e4f2b',
          900: '#1a4225',
        },
        earth: {
          50: '#faf7f2',
          100: '#f1e9db',
          800: '#4a3826',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px rgba(20, 60, 30, 0.08)',
      },
    },
  },
  plugins: [],
}
