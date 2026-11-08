import { displayName } from '../_lib/shared'

/**
 * Gifting content for the Utsav prototype. Sets are recipes of real catalogue
 * products (matched by keyword on the server); every price is computed live.
 */

export type OccasionId = 'bhai-dooj' | 'wedding' | 'thank-you' | 'housewarming' | 'corporate' | 'wellness'

export const OCCASIONS: { id: OccasionId; label: string }[] = [
  { id: 'bhai-dooj', label: 'Bhai Dooj' },
  { id: 'wedding', label: 'Wedding shagun' },
  { id: 'thank-you', label: 'Thank you' },
  { id: 'housewarming', label: 'Housewarming' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'wellness', label: 'Wellness gift' },
]

export type GiftSetRecipe = {
  id: string
  name: string
  label: string
  line: string
  occasions: OccasionId[]
  items: { keyword: string; grams: number }[]
}

export const GIFT_SETS: GiftSetRecipe[] = [
  {
    id: 'classic-four',
    name: 'Classic Mewa Four',
    label: 'The classic',
    line: 'The four every family loves, in a size worth giving.',
    occasions: ['bhai-dooj', 'wedding', 'thank-you', 'housewarming', 'corporate'],
    items: [
      { keyword: 'almond', grams: 250 },
      { keyword: 'cashew', grams: 250 },
      { keyword: 'pista', grams: 250 },
      { keyword: 'raisin', grams: 250 },
    ],
  },
  {
    id: 'royal-six',
    name: 'Royal Six',
    label: 'Grand gesture',
    line: 'Six premium dry fruits for shagun and the big occasions.',
    occasions: ['wedding', 'bhai-dooj', 'corporate'],
    items: [
      { keyword: 'almond', grams: 250 },
      { keyword: 'cashew', grams: 250 },
      { keyword: 'pista', grams: 250 },
      { keyword: 'walnut kernel', grams: 250 },
      { keyword: 'anjeer', grams: 250 },
      { keyword: 'munnaka', grams: 250 },
    ],
  },
  {
    id: 'sweet-tooth',
    name: 'Sweet Tooth',
    label: 'Dates, figs & berries',
    line: 'For the one who always reaches for something sweet.',
    occasions: ['thank-you', 'bhai-dooj', 'housewarming'],
    items: [
      { keyword: 'dates', grams: 500 },
      { keyword: 'anjeer', grams: 250 },
      { keyword: 'blue berry', grams: 250 },
      { keyword: 'craneberry', grams: 250 },
    ],
  },
  {
    id: 'desk-box',
    name: 'Desk Box',
    label: 'Per-person team gift',
    line: 'Light, snackable and loved at every desk. Easy to order in bulk.',
    occasions: ['corporate', 'thank-you'],
    items: [
      { keyword: 'makhana', grams: 100 },
      { keyword: 'seeds n nuts', grams: 100 },
      { keyword: 'almond', grams: 100 },
      { keyword: 'craneberry', grams: 100 },
    ],
  },
  {
    id: 'seeds-of-health',
    name: 'Seeds of Health',
    label: 'For the fitness fan',
    line: 'Five everyday seeds and mixes for breakfast bowls and snacking.',
    occasions: ['wellness', 'thank-you'],
    items: [
      { keyword: 'chia', grams: 250 },
      { keyword: 'pumpkin', grams: 250 },
      { keyword: 'sunflower', grams: 250 },
      { keyword: 'flex', grams: 250 },
      { keyword: 'seeds n nuts', grams: 250 },
    ],
  },
  {
    id: 'ayurvedic-ritual',
    name: 'Ayurvedic Ritual',
    label: 'Rooted in Ayurveda',
    line: 'Everyday Ayurvedic staples. Powders are ground fresh after you order.',
    occasions: ['wellness', 'housewarming'],
    items: [
      { keyword: 'moringa', grams: 100 },
      { keyword: 'triphala', grams: 200 },
      { keyword: 'amla', grams: 200 },
      { keyword: 'rose petal', grams: 100 },
    ],
  },
]

/** Giftable dry fruits for the build-your-own box (in display order). */
export const BOX_PICKS = [
  'almond',
  'cashew',
  'pista',
  'walnut kernel',
  'anjeer',
  'dates',
  'makhana',
  'munnaka',
  'raisin',
  'blue berry',
  'craneberry',
  'seeds n nuts',
]

/** The box starts with two classics so it is clear at a glance how it works. */
export const BOX_STARTERS = ['almond', 'cashew']

/** Hero arches: left, centre, right. */
export const HERO_PICKS = ['almond', 'cashew', 'pista']

/** "Cashew Nuts (Kaju)" → "Cashew Nuts" — short enough for lists and tiles. */
export function shortName(name: string) {
  return displayName(name).replace(/\s*\([^)]*\)/g, '').trim()
}
