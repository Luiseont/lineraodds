/** @type {import('tailwindcss').Config} */
export default {
  // darkMode disabled per request (single light theme)
  darkMode: false,
  theme: {
    extend: {
      colors: {
        primary: '#DE2A02',
        secondary: '#111827',
        success: '#16a34a',
        warning: '#d97706',
        info: '#2563eb',
      },
      borderRadius: {
        brand: '0.75rem', // 12px
      },
      boxShadow: {
        card: '0 10px 15px -3px rgba(17,24,39,0.08), 0 4px 6px -4px rgba(17,24,39,0.06)'
      },
      spacing: {
        brand: '1.125rem', // 18px
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'Apple Color Emoji', 'Segoe UI Emoji']
      }
    },
  },
}