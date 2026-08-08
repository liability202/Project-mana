/** @type {import('tailwindcss').Config} */

// Every brand colour resolves through a CSS variable holding an "R G B" triple.
// That lets `/50` opacity modifiers keep working while the whole palette can be
// swapped for dark mode by redefining the variables (see app/globals.css).
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory:  { DEFAULT: token('ivory'), 2: token('ivory2'), 3: token('ivory3'), 4: token('ivory4') },
        green:  { DEFAULT: token('green'), 2: token('green2'), 3: token('green3'), 4: token('green4'), 5: token('green5'), 6: token('green6') },
        terra:  { DEFAULT: token('terra'), 2: token('terra2'), 3: token('terra3'), 4: token('terra4') },
        ink:    { DEFAULT: token('ink'), 2: token('ink2'), 3: token('ink3'), 4: token('ink4') },
        gold:   token('gold'),
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans:  ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 20px var(--shadow-soft)',
        medium: '0 8px 48px var(--shadow-medium)',
      },
      borderRadius: {
        mana: '10px',
      },
    },
  },
  plugins: [],
}
