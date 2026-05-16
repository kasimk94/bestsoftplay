import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          DEFAULT: '#7F77DD',
          50: '#F4F3FB',
          100: '#E9E8F7',
          200: '#C7C4EE',
          300: '#A5A0E4',
          400: '#9289DC',
          500: '#7F77DD',
          600: '#5F56C8',
          700: '#4940A8',
          800: '#342F7C',
          900: '#201D51',
        },
        coral: {
          DEFAULT: '#D85A30',
          50: '#FBF0EB',
          100: '#F6D9CE',
          200: '#EDAC97',
          300: '#E48060',
          400: '#DE6A47',
          500: '#D85A30',
          600: '#B54424',
          700: '#8D341C',
          800: '#662514',
          900: '#3F160C',
        },
        teal: {
          DEFAULT: '#1D9E75',
          50: '#E8F7F3',
          100: '#C5EAE0',
          200: '#8BD5C0',
          300: '#50C1A1',
          400: '#33B28B',
          500: '#1D9E75',
          600: '#16785A',
          700: '#105640',
          800: '#093526',
          900: '#03130D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
