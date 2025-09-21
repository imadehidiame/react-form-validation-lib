module.exports = {
    content: [
      './src/**/*.{js,ts,jsx,tsx,css}',
    ],
    theme: {
      extend: {},
    },
    safelist: [
      'inset-y-0',
      'right-0',
      'pr-3',
      'pr-10',
    ],
    plugins: [
      //require('tw-animate-css'),
      require('@tailwindcss/forms')
    ],
  };