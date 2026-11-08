import type { Product } from '@/lib/supabase'

/** Shelves of the Mono price list, in the order they are shown. */
export type MonoGroup = 'nuts' | 'seeds' | 'herbs' | 'spices' | 'kits'
export type TabKey = 'all' | 'dry-fruits' | 'herbs' | 'spices' | 'kits'

/** One line of the catalogue: the product plus everything the list needs, worked out on the server. */
export type MonoItem = {
  product: Product
  group: MonoGroup
  name: string
  local: string
  hint: string
  search: string
  rank: number
  fromPrice: number | null
}

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'dry-fruits', label: 'Dry fruits & seeds' },
  { key: 'herbs', label: 'Herbs' },
  { key: 'spices', label: 'Spices' },
  { key: 'kits', label: 'Kits' },
]

export const GROUP_ORDER: MonoGroup[] = ['nuts', 'seeds', 'herbs', 'spices', 'kits']

export const GROUP_INFO: Record<MonoGroup, { title: string; note: string; tab: TabKey }> = {
  nuts: { title: 'Nuts & dried fruit', note: 'Sorted by hand, sold by weight', tab: 'dry-fruits' },
  seeds: { title: 'Seeds & mixes', note: 'For bowls, smoothies and snacking', tab: 'dry-fruits' },
  herbs: { title: 'Herbs & powders', note: 'Powders are ground after you order', tab: 'herbs' },
  spices: { title: 'Whole spices', note: 'Sealed fresh in our pouch', tab: 'spices' },
  kits: { title: 'Kits', note: 'Choose the items and amounts on the kit page', tab: 'kits' },
}

/** "Featured" order: the everyday staples first, then the rest of each shelf. */
export const FEATURED_ORDER = [
  // nuts & dried fruit
  'almond', 'cashew', 'pista', 'walnut kernel', 'akhrot sabut', 'raisin', 'munnaka', 'dates', 'medjool', 'anjeer',
  'makhana', 'blue berry', 'craneberry', 'black current',
  // seeds & mixes
  'chia', 'flex', 'pumpkin', 'sunflower', 'sabja', 'muskmelon', 'seeds n nuts', 'muesli', 'protien beans', 'protien booster',
  // herbs
  'ashwagandha', 'moringa', 'triphala', 'amla', 'neem', 'bhrami', 'satavari', 'safed musli', 'mulethi', 'arjun',
  'gond katira', 'kasturi haldi', 'amba haldi', 'hibiscus', 'indigo', 'reetha', 'shikakai', 'rosemary', 'rose petal',
  'jamun', 'karela', 'chirata', 'koch', 'paneer doda',
  // spices
  'cardamom', 'clove', 'black pepper', 'javitri', 'star anais', 'pepali',
  // kits
  'super seeds', 'hair care', 'gym', 'sugar', 'cool summer',
]

/**
 * Extra words people type for the same thing (spellings, Hindi names, the
 * catalogue's own typos), so search still finds it.
 */
export const SEARCH_ALIASES: [string, string][] = [
  ['almond', 'badam badaam mamra'],
  ['cashew', 'kaju'],
  ['walnut', 'akhrot'],
  ['pista', 'pistachio'],
  ['raisin', 'kishmish kismis'],
  ['munnaka', 'munakka'],
  ['dates', 'khajoor khajur date'],
  ['anjeer', 'anjir fig figs'],
  ['makhana', 'fox nut foxnut lotus seed phool makhana'],
  ['blue berry', 'blueberry blueberries'],
  ['craneberry', 'cranberry cranberries'],
  ['current', 'currant currants'],
  ['flex', 'flax flaxseed linseed alsi'],
  ['pumpkin', 'kaddu pepita'],
  ['sabja', 'basil seeds tukmaria'],
  ['muskmelon', 'magaz melon seeds kharbuja'],
  ['protien', 'protein'],
  ['muesli', 'granola breakfast'],
  ['bhrami', 'brahmi'],
  ['satavari', 'shatavari'],
  ['musli', 'moosli'],
  ['mulethi', 'licorice liquorice'],
  ['reetha', 'ritha soapnut'],
  ['amla', 'awla aonla gooseberry'],
  ['moringa', 'drumstick sahjan'],
  ['haldi', 'turmeric'],
  ['koch', 'kaunch kapikacchu'],
  ['arjun', 'arjuna'],
  ['gudhal', 'hibiscus gurhal'],
  ['indigo', 'neel'],
  ['jamun', 'java plum'],
  ['karela', 'bitter gourd'],
  ['chirata', 'chirayata chiraita'],
  ['gond katira', 'tragacanth'],
  ['rose petal', 'gulab'],
  ['cardamom', 'elaichi ilaichi'],
  ['clove', 'laung lavang'],
  ['black pepper', 'kali mirch'],
  ['javitri', 'mace'],
  ['anais', 'anise chakra phool'],
  ['pepali', 'pippali long pepper'],
  ['hair care', 'hair'],
  ['gym', 'protein fitness'],
]
