import type { Product } from '@/lib/supabase'

/**
 * The script behind "Ask Mana": a scripted, instant shopping guide (no AI, no
 * network calls). Products are referenced by catalogue keyword (name or slug);
 * the server resolves each keyword to a real, photographed product.
 */

export type Audience = 'family' | 'friends' | 'team'
export type Budget = 'under' | 'mid' | 'high'
export type FocusId = 'hair' | 'strength' | 'digestion' | 'winter' | 'sugar' | 'summer'
export type SnackId = 'sweet' | 'savoury' | 'protein'
export type DishId = 'kheer' | 'chai' | 'laddoo' | 'biryani'

export type ItemSpec = { keyword: string; grams: number; note?: string }

/** What the server hands the chat: the catalogue by id, plus keyword → product id. */
export type GuideData = {
  products: Record<string, Product>
  ids: Record<string, string>
  bestsellers: string[]
}

export const AUDIENCES: Record<Audience, { label: string; phrase: string }> = {
  family: { label: 'Family', phrase: 'your family' },
  friends: { label: 'Friends', phrase: 'friends' },
  team: { label: 'Team / colleagues', phrase: 'your team' },
}

/** Budget per gift, in paise. */
export const BUDGETS: Record<Budget, { label: string; phrase: string; min: number; max: number; target: number }> = {
  under: { label: 'Under ₹500', phrase: 'under ₹500 each', min: 0, max: 49_999, target: 42_000 },
  mid: { label: '₹500–₹1,000', phrase: '₹500–₹1,000 each', min: 50_000, max: 100_000, target: 80_000 },
  high: { label: '₹1,000+', phrase: '₹1,000 and up', min: 100_001, max: Number.MAX_SAFE_INTEGER, target: 140_000 },
}

/** Gift ideas: single pouches and small sets, priced live from the catalogue. */
export const GIFT_PICKS: { id: string; name: string; line?: string; audiences: Audience[]; items: ItemSpec[] }[] = [
  {
    id: 'mini-trio',
    name: 'Mini mewa trio',
    line: 'Almonds, cashews & pista · 100 g each',
    audiences: ['family', 'friends', 'team'],
    items: [{ keyword: 'almonds', grams: 100 }, { keyword: 'cashew-nuts', grams: 100 }, { keyword: 'pistachios', grams: 100 }],
  },
  { id: 'cashew', name: 'Cashews', audiences: ['family', 'team'], items: [{ keyword: 'cashew-nuts', grams: 250 }] },
  { id: 'pista', name: 'Pistachios', audiences: ['family', 'friends'], items: [{ keyword: 'pistachios', grams: 250 }] },
  { id: 'makhana', name: 'Makhana', audiences: ['friends', 'team'], items: [{ keyword: 'makhana', grams: 250 }] },
  {
    id: 'desk-trio',
    name: 'Desk snack trio',
    line: 'Makhana, seeds & nuts mix, almonds · 100 g each',
    audiences: ['team', 'friends'],
    items: [{ keyword: 'makhana', grams: 100 }, { keyword: 'seed-nut-mix', grams: 100 }, { keyword: 'almonds', grams: 100 }],
  },
  {
    id: 'trail',
    name: 'Trail-mix starter',
    line: 'Almonds, cashews, pumpkin seeds & cranberries · 100 g each',
    audiences: ['friends'],
    items: [{ keyword: 'almonds', grams: 100 }, { keyword: 'cashew-nuts', grams: 100 }, { keyword: 'pumpkin-seeds', grams: 100 }, { keyword: 'craneberry', grams: 100 }],
  },
  {
    id: 'duo',
    name: 'Badaam & kaju duo',
    line: 'Almonds & cashews · 250 g each',
    audiences: ['family', 'team'],
    items: [{ keyword: 'almonds', grams: 250 }, { keyword: 'cashew-nuts', grams: 250 }],
  },
  {
    id: 'figs-dates',
    name: 'Anjeer & khajoor',
    line: 'Dried figs 250 g & dates 500 g',
    audiences: ['family'],
    items: [{ keyword: 'anjeer-figs', grams: 250 }, { keyword: 'dates-khajoor', grams: 500 }],
  },
  {
    id: 'berries-makhana',
    name: 'Berries & makhana',
    line: 'Blueberries & makhana · 250 g each',
    audiences: ['friends'],
    items: [{ keyword: 'blue-berry', grams: 250 }, { keyword: 'makhana', grams: 250 }],
  },
  {
    id: 'seeds-berries',
    name: 'Seeds & berries',
    line: 'Chia, pumpkin seeds & cranberries · 250 g each',
    audiences: ['friends', 'family'],
    items: [{ keyword: 'chia-seeds', grams: 250 }, { keyword: 'pumpkin-seeds', grams: 250 }, { keyword: 'craneberry', grams: 250 }],
  },
  {
    id: 'desk-box',
    name: 'Big desk box',
    line: 'Makhana, seeds & nuts mix, almonds · 250 g each',
    audiences: ['team'],
    items: [{ keyword: 'makhana', grams: 250 }, { keyword: 'seed-nut-mix', grams: 250 }, { keyword: 'almonds', grams: 250 }],
  },
  {
    id: 'classic-four',
    name: 'Classic mewa four',
    line: 'Almonds, cashews, pista & raisins · 250 g each',
    audiences: ['family', 'team', 'friends'],
    items: [{ keyword: 'almonds', grams: 250 }, { keyword: 'cashew-nuts', grams: 250 }, { keyword: 'pistachios', grams: 250 }, { keyword: 'raisins', grams: 250 }],
  },
  {
    id: 'team-four',
    name: 'Team favourites',
    line: 'Almonds, cashews, makhana, seeds & nuts mix · 250 g each',
    audiences: ['team'],
    items: [{ keyword: 'almonds', grams: 250 }, { keyword: 'cashew-nuts', grams: 250 }, { keyword: 'makhana', grams: 250 }, { keyword: 'seed-nut-mix', grams: 250 }],
  },
  {
    id: 'snack-box',
    name: 'Snack lover’s box',
    line: 'Makhana, blueberries, seeds & nuts mix, pista · 250 g each',
    audiences: ['friends'],
    items: [{ keyword: 'makhana', grams: 250 }, { keyword: 'blue-berry', grams: 250 }, { keyword: 'seed-nut-mix', grams: 250 }, { keyword: 'pistachios', grams: 250 }],
  },
  {
    id: 'royal-six',
    name: 'Royal six',
    line: 'Almonds, cashews, pista, walnuts, anjeer & munnaka · 250 g each',
    audiences: ['family'],
    items: [
      { keyword: 'almonds', grams: 250 },
      { keyword: 'cashew-nuts', grams: 250 },
      { keyword: 'pistachios', grams: 250 },
      { keyword: 'walnut-kernels', grams: 250 },
      { keyword: 'anjeer-figs', grams: 250 },
      { keyword: 'munnaka', grams: 250 },
    ],
  },
]

export const FOCUS: Record<FocusId, { label: string; kit: string | null; picks: string[]; intro: string; note: string }> = {
  hair: {
    label: 'Hair care',
    kit: 'hair-care-kit',
    picks: ['hibiscus-gudhal-powder', 'amla'],
    intro: 'For hair care, families have long relied on gudhal (hibiscus) and amla. Our Hair Care Kit puts the classics together:',
    note: 'Hibiscus and amla are traditionally used in Indian hair-care routines.',
  },
  strength: {
    label: 'Strength & energy',
    kit: 'gym-kit',
    picks: ['ashwagandha-powder', 'safed-musli'],
    intro: 'For strength and energy, these are the ones people ask us about most:',
    note: 'Ashwagandha and safed musli are traditionally used in Ayurveda for strength and stamina.',
  },
  digestion: {
    label: 'Digestion',
    kit: null,
    picks: ['triphala-powder', 'flex-seeds', 'chia-seeds'],
    intro: 'For digestion, start simple: a classic churna and two fibre-rich seeds.',
    note: 'Triphala is traditionally taken for digestion, and flax and chia seeds are naturally rich in fibre.',
  },
  winter: {
    label: 'Winter care',
    kit: null,
    picks: ['mulethi', 'pepali', 'amla'],
    intro: 'Winter is here. These are staples in many Indian kitchens this season:',
    note: 'Mulethi, pippali (long pepper) and amla are traditionally used in winter kadhas and home remedies.',
  },
  sugar: {
    label: 'Sugar care',
    kit: 'sugar-managment-kit',
    picks: ['jamun-guthli', 'karela-seeds'],
    intro: 'For sugar care, these are the traditional choices, plus the kit that brings them together:',
    note: 'Jamun guthli and karela seeds are traditionally used in Ayurveda for sugar care. If you take diabetes medicine, please talk to your doctor first.',
  },
  summer: {
    label: 'Summer cooling',
    kit: 'cool-summer-kit',
    picks: ['gond-katira', 'sabja-seeds'],
    intro: 'For cooling, these are the traditional favourites:',
    note: 'Gond katira and sabja seeds are traditionally soaked and added to summer drinks.',
  },
}

export const SNACKS: Record<SnackId, { label: string; keywords: string[]; intro: string }> = {
  sweet: { label: 'Something sweet', keywords: ['dates-khajoor', 'anjeer-figs', 'blue-berry', 'craneberry'], intro: 'Sweet picks: dates, figs and dried berries.' },
  savoury: { label: 'Crunchy & savoury', keywords: ['makhana', 'cashew-nuts', 'pistachios', 'seed-nut-mix'], intro: 'Crunchy picks for the 4 PM hunger:' },
  protein: { label: 'Protein-rich', keywords: ['pumpkin-seeds', 'almonds', 'protien-beans', 'chia-seeds'], intro: 'Seeds and nuts that pack in protein:' },
}

export const DISHES: Record<
  DishId,
  { label: string; name: string; meta: string[]; items: ItemSpec[]; kitchen: string; steps: string[]; intro: string }
> = {
  kheer: {
    label: 'Kheer',
    name: 'Rice kheer',
    meta: ['Serves 4–6', '45 min'],
    items: [
      { keyword: 'almonds', grams: 100 },
      { keyword: 'cashew-nuts', grams: 100 },
      { keyword: 'raisins', grams: 100 },
      { keyword: 'cardamom-elaichi', grams: 100 },
      { keyword: 'pistachios', grams: 100, note: 'to garnish' },
    ],
    kitchen: 'Full-cream milk, rice and sugar',
    steps: [
      'Simmer 1.5 L milk with ¼ cup washed rice, stirring often, until thick and creamy.',
      'Add sugar to taste, crushed cardamom and chopped almonds and cashews.',
      'Stir in the raisins for the last 5 minutes and top with slivered pista.',
    ],
    intro: 'Lovely choice! Here is everything from our shop for rice kheer. Untick anything you already have:',
  },
  chai: {
    label: 'Masala chai',
    name: 'Masala chai',
    meta: ['2 cups', '10 min'],
    items: [
      { keyword: 'cardamom-elaichi', grams: 100 },
      { keyword: 'clove-long', grams: 100 },
      { keyword: 'black-pepper', grams: 100 },
    ],
    kitchen: 'Tea leaves, milk, fresh ginger and sugar',
    steps: [
      'Lightly crush 2 cardamom pods, 2 cloves and a pinch of black pepper.',
      'Boil them in a cup of water with grated ginger for 2 minutes, then add the tea leaves.',
      'Add milk and sugar, bring it to a boil twice and strain.',
    ],
    intro: 'A good masala chai needs just three whole spices. Each pack lasts for many, many cups:',
  },
  laddoo: {
    label: 'Dry fruit laddoo',
    name: 'No-sugar dry fruit laddoo',
    meta: ['Makes about 20', '25 min'],
    items: [
      { keyword: 'dates-khajoor', grams: 500 },
      { keyword: 'anjeer-figs', grams: 250 },
      { keyword: 'almonds', grams: 250 },
      { keyword: 'cashew-nuts', grams: 100 },
      { keyword: 'pistachios', grams: 100 },
    ],
    kitchen: 'A spoon of ghee',
    steps: [
      'Roughly chop the nuts and roast them in a dry pan for 3–4 minutes.',
      'Blend seedless dates and soaked figs into a sticky paste.',
      'Cook the paste with a spoon of ghee for 3 minutes, mix in the nuts and roll into laddoos.',
    ],
    intro: 'Sweetened only by dates and figs. Here is what goes in:',
  },
  biryani: {
    label: 'Biryani',
    name: 'Biryani whole spices',
    meta: ['Lasts many batches'],
    items: [
      { keyword: 'star-anais', grams: 100 },
      { keyword: 'clove-long', grams: 100 },
      { keyword: 'cardamom-elaichi', grams: 100 },
      { keyword: 'black-pepper', grams: 100 },
      { keyword: 'javitri', grams: 100 },
    ],
    kitchen: 'Bay leaves, cinnamon, rice and onions',
    steps: [
      'Fry the whole spices in hot ghee or oil for 30 seconds until fragrant.',
      'Add sliced onions, cook until golden, then build your biryani as usual.',
      'Go easy on javitri (mace). A small blade with the rice layer is plenty.',
    ],
    intro: 'The whole spices that make a biryani smell like a biryani:',
  },
}

/** Every catalogue keyword the script uses, so the server can resolve them once. */
export const ALL_KEYWORDS = Array.from(
  new Set([
    ...GIFT_PICKS.flatMap(pick => pick.items.map(item => item.keyword)),
    ...Object.values(FOCUS).flatMap(focus => [...(focus.kit ? [focus.kit] : []), ...focus.picks]),
    ...Object.values(SNACKS).flatMap(snack => snack.keywords),
    ...Object.values(DISHES).flatMap(dish => dish.items.map(item => item.keyword)),
  ])
)

/** Everyday and Hindi words people type, mapped to words in our product names. */
export const SYNONYMS: Record<string, string> = {
  badam: 'almond',
  badaam: 'almond',
  almond: 'almond',
  kaju: 'cashew',
  akhrot: 'walnut',
  kishmish: 'raisin',
  khajoor: 'dates',
  khajur: 'dates',
  date: 'dates',
  elaichi: 'cardamom',
  laung: 'clove',
  long: 'clove',
  mirch: 'pepper',
  alsi: 'flex',
  flax: 'flex',
  flaxseed: 'flex',
  flaxseeds: 'flex',
  makhane: 'makhana',
  foxnut: 'makhana',
  foxnuts: 'makhana',
  pistachio: 'pista',
  pistachios: 'pista',
  anjir: 'anjeer',
  fig: 'anjeer',
  figs: 'anjeer',
  cranberry: 'craneberry',
  cranberries: 'craneberry',
  blueberry: 'berry',
  blueberries: 'berry',
  turmeric: 'haldi',
  gudhal: 'hibiscus',
  brahmi: 'bhrami',
  shatavari: 'satavari',
  pippali: 'pepali',
  licorice: 'mulethi',
  liquorice: 'mulethi',
  mace: 'javitri',
  anise: 'anais',
  protein: 'protien',
  kalonji: 'kalonji',
  magaz: 'muskmelon',
  sabza: 'sabja',
  basil: 'sabja',
  mewa: 'nut',
}
