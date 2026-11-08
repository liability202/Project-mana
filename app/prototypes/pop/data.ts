/**
 * Static content for the "Pop" prototype: cravings and ready-made snack packs.
 * Products are matched by keyword against the live catalogue (photographed items only),
 * so every card, price and pack total on the page is real.
 */

export type PopColor = 'tangerine' | 'cobalt' | 'bubblegum' | 'mint' | 'butter' | 'lilac'

/** Background / text pairs that pass 4.5:1 contrast for the copy placed on them. */
export const COLORS: Record<PopColor, { bg: string; text: string; soft: string }> = {
  tangerine: { bg: '#FF6B2C', text: '#151515', soft: '#FFD9C7' },
  cobalt: { bg: '#3D5AFE', text: '#FFFFFF', soft: '#D7DDFF' },
  bubblegum: { bg: '#FF8FC4', text: '#151515', soft: '#FFE0EF' },
  mint: { bg: '#8EE3C0', text: '#151515', soft: '#DDF7EC' },
  butter: { bg: '#FFD84D', text: '#151515', soft: '#FFF1BF' },
  lilac: { bg: '#B9A5FF', text: '#151515', soft: '#ECE6FF' },
}

export type CravingIcon = 'clock' | 'dumbbell' | 'candy' | 'laptop' | 'sunrise' | 'popcorn'

export const CRAVINGS: { id: string; label: string; line: string; icon: CravingIcon; color: PopColor; keywords: string[] }[] = [
  {
    id: '4pm',
    label: '4 PM hunger',
    line: 'Crunchy, filling and easy to keep at your desk.',
    icon: 'clock',
    color: 'tangerine',
    keywords: ['makhana', 'seeds n nuts', 'almond', 'cashew'],
  },
  {
    id: 'gym',
    label: 'Gym bag',
    line: 'Seeds and nuts that pack protein into a handful.',
    icon: 'dumbbell',
    color: 'cobalt',
    keywords: ['pumpkin', 'protien beans', 'almond', 'walnut kernel'],
  },
  {
    id: 'sweet',
    label: 'Sweet tooth',
    line: 'Dates, figs and berries for when you want something sweet.',
    icon: 'candy',
    color: 'bubblegum',
    keywords: ['dates', 'anjeer', 'blue berry', 'craneberry', 'raisins'],
  },
  {
    id: 'desk',
    label: 'Desk drawer',
    line: 'Tidy, crunchy and easy to share with the team.',
    icon: 'laptop',
    color: 'mint',
    keywords: ['cashew', 'pista', 'makhana', 'sunflower'],
  },
  {
    id: 'breakfast',
    label: 'Breakfast bowl',
    line: 'Sprinkle on curd, oats or a smoothie bowl.',
    icon: 'sunrise',
    color: 'butter',
    keywords: ['muesli', 'chia', 'flex', 'blue berry'],
  },
  {
    id: 'movie',
    label: 'Movie night',
    line: 'Grab-a-handful snacks for the couch.',
    icon: 'popcorn',
    color: 'lilac',
    keywords: ['makhana', 'cashew', 'pista', 'seeds n nuts'],
  },
]

export const PACKS: { id: string; name: string; line: string; color: PopColor; items: { keyword: string; grams: number }[] }[] = [
  {
    id: 'desk',
    name: 'The Desk Pack',
    line: 'For long meetings and late emails.',
    color: 'mint',
    items: [
      { keyword: 'makhana', grams: 100 },
      { keyword: 'cashew', grams: 100 },
      { keyword: 'pista', grams: 100 },
      { keyword: 'seeds n nuts', grams: 250 },
    ],
  },
  {
    id: 'gym',
    name: 'The Gym Bag Pack',
    line: 'Seeds and nuts for before and after a workout.',
    color: 'cobalt',
    items: [
      { keyword: 'pumpkin', grams: 500 },
      { keyword: 'almond', grams: 250 },
      { keyword: 'protien beans', grams: 250 },
      { keyword: 'chia', grams: 250 },
    ],
  },
  {
    id: 'sweet',
    name: 'The Sweet Fix Pack',
    line: 'Dessert, but make it dry fruit.',
    color: 'bubblegum',
    items: [
      { keyword: 'dates', grams: 500 },
      { keyword: 'anjeer', grams: 100 },
      { keyword: 'blue berry', grams: 100 },
      { keyword: 'craneberry', grams: 100 },
    ],
  },
]

/** The quieter category links under the cravings ("not snacking?"). */
export const EXPLORE: { label: string; href: string; color: PopColor; countKey: 'dryFruits' | 'herbs' | 'spices' | 'kits' }[] = [
  { label: 'Dry fruits & seeds', href: '/products?category=dry-fruits', color: 'butter', countKey: 'dryFruits' },
  { label: 'Herbs & powders', href: '/products?category=herbs', color: 'mint', countKey: 'herbs' },
  { label: 'Whole spices', href: '/products?category=spices', color: 'tangerine', countKey: 'spices' },
  { label: 'Health kits', href: '/kits', color: 'bubblegum', countKey: 'kits' },
]
