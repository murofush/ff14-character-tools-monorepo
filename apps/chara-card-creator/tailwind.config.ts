import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'Noto Sans JP', 'sans-serif'],
        sans: ['Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
