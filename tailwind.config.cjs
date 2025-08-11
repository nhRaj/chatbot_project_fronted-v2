module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      keyframes: {
        fade: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        fade: 'fade 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
}
