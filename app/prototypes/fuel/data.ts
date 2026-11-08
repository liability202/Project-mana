/**
 * Approximate nutrition for the plain ingredient, per 100 g, from USDA FoodData
 * Central (SR Legacy). Only foods with a clear USDA match are listed — mixes,
 * makhana and protein beans are shown without numbers on purpose.
 */
export type FoodKey = 'pumpkin' | 'almonds' | 'sunflower' | 'pistachios' | 'cashews' | 'flax' | 'chia' | 'walnuts' | 'figs' | 'raisins'

export type Nutrient = {
  key: FoodKey
  /** Matched against product name/slug with the catalogue's pick(). */
  keyword: string
  label: string
  protein: number
  fibre: number
  kcal: number
  /** Foods that are mainly for energy, not protein, sit out of the leaderboard. */
  energy?: boolean
}

export const NUTRITION: Nutrient[] = [
  { key: 'pumpkin', keyword: 'pumpkin', label: 'Pumpkin seeds', protein: 30.23, fibre: 6.0, kcal: 559 },
  { key: 'almonds', keyword: 'almond', label: 'Almonds', protein: 21.15, fibre: 12.5, kcal: 579 },
  { key: 'sunflower', keyword: 'sunflower', label: 'Sunflower seeds', protein: 20.78, fibre: 8.6, kcal: 584 },
  { key: 'pistachios', keyword: 'pista', label: 'Pistachios', protein: 20.16, fibre: 10.6, kcal: 560 },
  { key: 'cashews', keyword: 'cashew', label: 'Cashews', protein: 18.22, fibre: 3.3, kcal: 553 },
  { key: 'flax', keyword: 'flex', label: 'Flaxseed', protein: 18.29, fibre: 27.3, kcal: 534 },
  { key: 'chia', keyword: 'chia', label: 'Chia seeds', protein: 16.54, fibre: 34.4, kcal: 486 },
  { key: 'walnuts', keyword: 'walnut kernel', label: 'Walnuts', protein: 15.23, fibre: 6.7, kcal: 654 },
  { key: 'figs', keyword: 'anjeer', label: 'Dried figs', protein: 3.3, fibre: 9.8, kcal: 249, energy: true },
  { key: 'raisins', keyword: 'raisin', label: 'Raisins', protein: 3.07, fibre: 3.7, kcal: 299, energy: true },
]

/** Grams of a nutrient in a portion, rounded to one decimal. */
export function amountIn(per100: number, grams: number) {
  return Math.round(per100 * grams) / 100
}

export function per30(per100: number) {
  return Math.round(per100 * 3) / 10
}

export const NUTRITION_SOURCE = '≈ per 30 g · USDA FoodData Central, plain ingredient. Actual values vary by batch.'

/** Ready-made daily stacks (grams per day). */
export const STACK_PRESETS: { key: string; label: string; line: string; grams: Partial<Record<FoodKey, number>> }[] = [
  { key: 'starter', label: 'Starter', line: 'An easy daily handful', grams: { almonds: 20, pumpkin: 20, chia: 10 } },
  { key: 'strength', label: 'Strength', line: 'Most protein per handful', grams: { pumpkin: 30, almonds: 30, sunflower: 20 } },
  { key: 'fibre', label: 'Fibre first', line: 'Chia, flax and figs', grams: { chia: 15, flax: 15, almonds: 20, figs: 20 } },
  { key: 'trail', label: 'Trail mix', line: 'For long days out', grams: { almonds: 20, cashews: 15, walnuts: 15, raisins: 20 } },
]

/** Simple, food-first ideas (not medical or diet advice). */
export const FUEL_IDEAS = [
  {
    key: 'before',
    tag: 'Before',
    title: 'Dates + almonds',
    line: 'Quick carbs from dates, a little protein from almonds — an easy bite before you train.',
    keywords: ['dates', 'almond'],
  },
  {
    key: 'after',
    tag: 'After',
    title: 'Chia pudding + pumpkin seeds',
    line: 'Soak chia in milk overnight, then top it with a spoon of pumpkin seeds.',
    keywords: ['chia', 'pumpkin'],
  },
  {
    key: 'rest',
    tag: 'Rest day',
    title: 'Walnuts + figs',
    line: 'A slower, softer snack for recovery days. Good with evening chai.',
    keywords: ['walnut kernel', 'anjeer'],
  },
]
