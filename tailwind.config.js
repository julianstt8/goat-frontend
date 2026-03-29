/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'goat-black': '#0D0D0D',   // Fondo principal
        'goat-card': '#1A1A1A',    // Tarjetas de producto
        'goat-red': '#E63946',     // Botones de acción y deudas
        'goat-blue': '#00B4D8',    // Tracking y confianza
      },
      fontFamily: {
        'hype': ['Montserrat', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
