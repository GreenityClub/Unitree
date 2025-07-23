/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Template colors
        'primary': '#A3DC9A',
        'secondary': '#DEE791',
        'tertiary': '#FFF9BD',
        'accent': '#FFD6BA',
        
        // Darker variants
        'primary-dark': '#8ac382',
        'secondary-dark': '#c5cd7d',
        'tertiary-dark': '#e6e0aa',
        'accent-dark': '#e6c1a7',
        
        // Lighter variants
        'primary-light': '#dbf1d7',
        'secondary-light': '#f0f3d8',
        'tertiary-light': '#fffdf0',
        'accent-light': '#fff0e8',
        
        // Custom themed colors
        green: {
          DEFAULT: '#A3DC9A',
          dark: '#8ac382',
          light: '#dbf1d7',
        },
        yellow: {
          DEFAULT: '#DEE791',
          dark: '#c5cd7d',
          light: '#f0f3d8',
        },
        cream: {
          DEFAULT: '#FFF9BD',
          dark: '#e6e0aa',
          light: '#fffdf0',
        },
        peach: {
          DEFAULT: '#FFD6BA',
          dark: '#e6c1a7',
          light: '#fff0e8',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 