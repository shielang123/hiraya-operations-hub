/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4efe6",
          100: "#e2ecd4",
          500: "#5a8c3e",
          600: "#3d6b32",
          700: "#1a4a32",
        },
      },
    },
  },
  plugins: [],
};
