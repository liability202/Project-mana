/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory:  { DEFAULT: '#FDFAF4', 2: '#F5F0E8', 3: '#EDE5D6', 4: '#E0D5C2' },
        green:  { DEFAULT: '#1C3D2E', 2: '#2A5940', 3: '#3D7A58', 4: '#6AAF87', 5: '#C2E0CE', 6: '#EAF4EE' },
        terra:  { DEFAULT: '#C4582A', 2: '#E07040', 3: '#F5C4A8', 4: '#FDF0E8' },
        ink:    { DEFAULT: '#1A1208', 2: '#4A3C28', 3: '#8A7860', 4: '#BFB49A' },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans:  ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 20px rgba(26,18,8,0.07)',
        medium: '0 8px 48px rgba(26,18,8,0.12)',
      },
      borderRadius: {
        mana: '10px',
      },
    },
  },
  plugins: [],
}
