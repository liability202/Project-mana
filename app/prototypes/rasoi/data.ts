/**
 * Static content for the Rasoi prototype: dishes, the ingredients they need
 * from the Mana catalogue (matched by keyword on the server), and the little
 * illustrations of each dish. Recipes are simple, everyday home versions.
 */

export type Shape = 'dot' | 'sliver' | 'seed' | 'star' | 'ball' | 'puff' | 'pod' | 'clove' | 'petal' | 'catkin'

export type Garnish = { shape: Shape; colors: string[]; count: number; size: [number, number] }

/** A top-down drawing of the dish: the food colour, an optional swirl, and what is scattered on top. */
export type BowlSpec = { base: string; swirl?: string; dry?: boolean; garnish: Garnish[] }

export type IngredientId =
  | 'almonds' | 'cashew' | 'raisins' | 'cardamom' | 'pista' | 'makhana' | 'dates' | 'anjeer' | 'walnut'
  | 'clove' | 'pepper' | 'star' | 'javitri' | 'pippali' | 'muskmelon' | 'rose' | 'pumpkin' | 'sunflower'
  | 'cranberry' | 'chia' | 'muesli' | 'blueberry'

/** How to find each ingredient in the catalogue (first photographed match wins) and its everyday name. */
export const INGREDIENTS: Record<IngredientId, { keys: string[]; alsoCalled?: string }> = {
  almonds: { keys: ['almond', 'badam'], alsoCalled: 'Badaam' },
  cashew: { keys: ['cashew', 'kaju'], alsoCalled: 'Kaju' },
  raisins: { keys: ['raisin', 'kishmish'], alsoCalled: 'Kishmish' },
  cardamom: { keys: ['cardamom', 'elaichi'], alsoCalled: 'Elaichi' },
  pista: { keys: ['pista'], alsoCalled: 'Pista' },
  makhana: { keys: ['makhana', 'foxnut'], alsoCalled: 'Phool makhana' },
  dates: { keys: ['khajoor', 'dates'], alsoCalled: 'Khajoor' },
  anjeer: { keys: ['anjeer', 'fig'], alsoCalled: 'Dried figs' },
  walnut: { keys: ['walnut kernel', 'akhrot giri'], alsoCalled: 'Akhrot giri' },
  clove: { keys: ['clove', 'laung'], alsoCalled: 'Laung' },
  pepper: { keys: ['black pepper', 'kali mirch'], alsoCalled: 'Kali mirch' },
  star: { keys: ['star an', 'star'], alsoCalled: 'Chakra phool' },
  javitri: { keys: ['javitri', 'mace'], alsoCalled: 'Mace' },
  pippali: { keys: ['pepali', 'pippali', 'pipli'], alsoCalled: 'Long pepper' },
  muskmelon: { keys: ['muskmelon', 'magaz', 'melon seed'], alsoCalled: 'Magaz' },
  rose: { keys: ['rose petal', 'gulab'], alsoCalled: 'Gulab' },
  pumpkin: { keys: ['pumpkin'], alsoCalled: 'Kaddu ke beej' },
  sunflower: { keys: ['sunflower'], alsoCalled: 'Surajmukhi beej' },
  cranberry: { keys: ['cranberr', 'craneberr'] },
  chia: { keys: ['chia'] },
  muesli: { keys: ['muesli', 'granola'] },
  blueberry: { keys: ['blue berry', 'blueberr'] },
}

export type Recipe = {
  id: string
  name: string
  local: string
  line: string
  serves: string
  time: string
  tag: string
  items: { id: IngredientId; grams: number; note?: string }[]
  kitchen: string[]
  steps: string[]
  bowl: BowlSpec
}

const ALMOND: Garnish = { shape: 'sliver', colors: ['#D8A464', '#C99355'], count: 7, size: [5, 7] }
const PISTA: Garnish = { shape: 'sliver', colors: ['#97B957', '#7FA243'], count: 6, size: [4, 5.5] }
const RAISIN: Garnish = { shape: 'dot', colors: ['#5B2B2C', '#6E3536'], count: 6, size: [2.6, 3.4] }

export const RECIPES: Recipe[] = [
  {
    id: 'kheer',
    name: 'Rice kheer',
    local: 'Chawal ki kheer',
    line: 'Slow-simmered, creamy and studded with nuts. The festive classic.',
    serves: 'Serves 4',
    time: '45 min',
    tag: 'Festive',
    items: [
      { id: 'almonds', grams: 100, note: 'chopped' },
      { id: 'cashew', grams: 100, note: 'halved' },
      { id: 'raisins', grams: 100 },
      { id: 'cardamom', grams: 100, note: '2–3 pods, crushed' },
      { id: 'pista', grams: 100, note: 'slivered, to finish' },
    ],
    kitchen: ['1 litre full-cream milk', '¼ cup basmati rice', '½ cup sugar', '1 tsp ghee'],
    steps: [
      'Rinse the rice and soak it for 20 minutes.',
      'Boil the milk, add the rice and simmer on low, stirring often, for 30–35 minutes until soft and creamy.',
      'Stir in the sugar, crushed cardamom, chopped almonds, cashews and raisins. Cook 5 minutes more.',
      'Finish with slivered pistachios. Serve warm or chilled.',
    ],
    bowl: {
      base: '#F4E7CB',
      swirl: '#FBF4E4',
      garnish: [{ ...ALMOND, count: 9 }, { ...PISTA, count: 8 }, { ...RAISIN, count: 7 }, { shape: 'dot', colors: ['#7D8B48'], count: 10, size: [1.3, 1.8] }],
    },
  },
  {
    id: 'laddoo',
    name: 'Dry fruit laddoo',
    local: 'Mewa laddoo',
    line: 'Sweetened only with dates and figs. A winter favourite for the whole family.',
    serves: 'Makes 12',
    time: '25 min',
    tag: 'No added sugar',
    items: [
      { id: 'dates', grams: 250, note: 'deseeded' },
      { id: 'anjeer', grams: 100, note: 'chopped' },
      { id: 'almonds', grams: 100 },
      { id: 'cashew', grams: 100 },
      { id: 'pista', grams: 100 },
      { id: 'walnut', grams: 100 },
    ],
    kitchen: ['1 tbsp ghee', '2 tbsp desiccated coconut (optional)'],
    steps: [
      'Deseed the dates, chop the figs and pulse both into a sticky paste.',
      'Dry-roast the almonds, cashews, pistachios and walnuts for 3–4 minutes, then chop.',
      'Warm the paste in a spoon of ghee for 3 minutes and mix in the nuts.',
      'Let it cool a little, then roll into 12 small laddoos.',
    ],
    bowl: {
      base: '#F6ECDA',
      dry: true,
      garnish: [{ shape: 'ball', colors: ['#9B6230', '#8A5427', '#A46A35'], count: 5, size: [15, 16.5] }],
    },
  },
  {
    id: 'chai',
    name: 'Masala chai',
    local: 'Kadak masala chai',
    line: 'Cardamom, clove and black pepper. The cup that gets Delhi through winter.',
    serves: 'Serves 2',
    time: '10 min',
    tag: 'Winter',
    items: [
      { id: 'cardamom', grams: 100, note: '2 pods' },
      { id: 'clove', grams: 100, note: '2 cloves' },
      { id: 'pepper', grams: 100, note: '3–4 peppercorns' },
    ],
    kitchen: ['2 tsp tea leaves', '1 cup milk', '1 cup water', 'Fresh ginger', 'Sugar to taste'],
    steps: [
      'Lightly crush 2 cardamom pods, 2 cloves and 3–4 peppercorns.',
      'Boil the water with the spices and a little grated ginger for 2 minutes.',
      'Add the tea leaves and milk, and simmer until it turns a deep tan.',
      'Sweeten, strain and serve hot.',
    ],
    bowl: {
      base: '#BF8656',
      swirl: '#D9A97C',
      garnish: [
        { shape: 'pod', colors: ['#8FA64A', '#7E9442'], count: 3, size: [6, 7] },
        { shape: 'clove', colors: ['#4E2C1B'], count: 3, size: [6, 7] },
      ],
    },
  },
  {
    id: 'makhana-kheer',
    name: 'Makhana kheer',
    local: 'Makhane ki kheer',
    line: 'Ready in 25 minutes, and a favourite on fasting days.',
    serves: 'Serves 3',
    time: '25 min',
    tag: 'Vrat-friendly',
    items: [
      { id: 'makhana', grams: 100, note: 'roasted' },
      { id: 'almonds', grams: 100, note: 'chopped' },
      { id: 'cardamom', grams: 100, note: 'crushed' },
      { id: 'raisins', grams: 100 },
    ],
    kitchen: ['750 ml milk', 'Sugar to taste', '1 tsp ghee'],
    steps: [
      'Roast the makhana in ghee until crisp, then crush half of it coarsely.',
      'Simmer the milk for 10 minutes and add all the makhana.',
      'Cook until thick, about 10–12 minutes, then add sugar and crushed cardamom.',
      'Stir in the almonds and raisins, and serve warm.',
    ],
    bowl: {
      base: '#F2E3C4',
      swirl: '#FAF1DF',
      garnish: [
        { shape: 'puff', colors: ['#FCF8EF'], count: 8, size: [6.5, 8] },
        { ...ALMOND, count: 5 },
        { ...RAISIN, count: 5 },
      ],
    },
  },
  {
    id: 'biryani',
    name: 'Biryani whole spices',
    local: 'Biryani ke khade masale',
    line: 'The whole spices that make a biryani smell like a celebration.',
    serves: 'One pot, serves 4–5',
    time: '15 min prep',
    tag: 'Sunday special',
    items: [
      { id: 'star', grams: 100, note: '1 flower' },
      { id: 'clove', grams: 100, note: '4–5 cloves' },
      { id: 'cardamom', grams: 100, note: '3 pods' },
      { id: 'pepper', grams: 100, note: '8–10 peppercorns' },
      { id: 'javitri', grams: 100, note: 'a small strand' },
    ],
    kitchen: ['Bay leaf and cinnamon', 'Basmati rice', 'Onions, ghee and your masala'],
    steps: [
      'Heat ghee and add the whole spices with a bay leaf and a piece of cinnamon.',
      'When they crackle, fry sliced onions in the same ghee until deep golden.',
      'Boil the rice with a few of the spices, then layer it over your cooked masala.',
      'Seal the pot and cook on dum for 20–25 minutes.',
    ],
    bowl: {
      base: '#F3E9D6',
      dry: true,
      garnish: [
        { shape: 'star', colors: ['#8D4526', '#7A3A1F'], count: 3, size: [11, 13] },
        { shape: 'pod', colors: ['#7E9043', '#8FA64A'], count: 5, size: [6, 7] },
        { shape: 'clove', colors: ['#4E2C1B', '#3E2416'], count: 6, size: [6, 7] },
        { shape: 'dot', colors: ['#2A211C', '#3B2E26'], count: 12, size: [2.3, 3] },
        { shape: 'sliver', colors: ['#D9692A', '#C9561E'], count: 4, size: [6, 8] },
      ],
    },
  },
  {
    id: 'thandai',
    name: 'Thandai',
    local: 'Ghar ki thandai',
    line: 'A festive, nutty milk drink with pistachio, melon seeds, rose and spice.',
    serves: 'Serves 4',
    time: '20 min + soaking',
    tag: 'Festive',
    items: [
      { id: 'almonds', grams: 100 },
      { id: 'cashew', grams: 100 },
      { id: 'pista', grams: 100 },
      { id: 'muskmelon', grams: 100 },
      { id: 'cardamom', grams: 100 },
      { id: 'pepper', grams: 100, note: 'a few' },
      { id: 'rose', grams: 100, note: 'dried' },
    ],
    kitchen: ['1 litre chilled milk', 'Sugar to taste', '1 tbsp fennel seeds', 'Saffron (optional)'],
    steps: [
      'Soak the nuts, melon seeds, cardamom, a few peppercorns and the fennel for 2 hours.',
      'Grind with the rose petals into a smooth paste, using a little milk.',
      'Whisk the paste into chilled, sweetened milk. Strain it if you like it smooth.',
      'Serve cold, topped with chopped pistachios and rose petals.',
    ],
    bowl: {
      base: '#F2D3AE',
      swirl: '#F8E3C8',
      garnish: [
        { ...PISTA, count: 7 },
        { shape: 'petal', colors: ['#D8456B', '#C23358'], count: 6, size: [4, 5] },
        { ...ALMOND, count: 4 },
      ],
    },
  },
  {
    id: 'trail-mix',
    name: 'Trail mix',
    local: 'Ghar ka mewa mix',
    line: 'Your own crunchy, chewy jar for desks, school bags and road trips.',
    serves: 'Makes about 600 g',
    time: '5 min',
    tag: 'Everyday',
    items: [
      { id: 'almonds', grams: 100 },
      { id: 'cashew', grams: 100 },
      { id: 'pumpkin', grams: 100 },
      { id: 'sunflower', grams: 100 },
      { id: 'cranberry', grams: 100 },
      { id: 'raisins', grams: 100 },
    ],
    kitchen: ['A pinch of salt or chaat masala (optional)'],
    steps: [
      'Dry-roast the almonds, cashews and seeds on low heat for 4–5 minutes (optional).',
      'Let them cool completely, then toss with the cranberries and raisins.',
      'Add a pinch of salt or chaat masala if you like it savoury.',
      'Store in an airtight jar. A small handful makes a snack.',
    ],
    bowl: {
      base: '#F1E6D2',
      dry: true,
      garnish: [
        { shape: 'seed', colors: ['#B97A45', '#A86C3C'], count: 7, size: [6.5, 7.5] },
        { shape: 'sliver', colors: ['#EAD3A2', '#E2C690'], count: 6, size: [6, 7] },
        { shape: 'seed', colors: ['#6F8F45', '#7C9C4E'], count: 8, size: [3.6, 4.4] },
        { shape: 'seed', colors: ['#B8B0A0', '#A39A88'], count: 8, size: [3, 3.6] },
        { shape: 'dot', colors: ['#B3243B', '#9E1E33'], count: 7, size: [2.8, 3.5] },
        { shape: 'dot', colors: ['#4E2627'], count: 6, size: [2.6, 3.2] },
      ],
    },
  },
  {
    id: 'chia',
    name: 'Chia breakfast pudding',
    local: 'Overnight chia',
    line: 'Five minutes tonight, and breakfast is ready tomorrow.',
    serves: 'Serves 2',
    time: '5 min + overnight',
    tag: 'Breakfast',
    items: [
      { id: 'chia', grams: 100 },
      { id: 'muesli', grams: 100 },
      { id: 'blueberry', grams: 100 },
      { id: 'almonds', grams: 100, note: 'chopped' },
    ],
    kitchen: ['1 cup milk or curd', 'Honey to taste'],
    steps: [
      'Stir 3 tbsp chia seeds into a cup of milk. Rest 5 minutes and stir again.',
      'Cover and chill overnight, or for at least 2 hours.',
      'Top with muesli, blueberries and chopped almonds.',
      'Add a drizzle of honey and eat chilled.',
    ],
    bowl: {
      base: '#E8E1D3',
      swirl: '#F1ECE2',
      garnish: [
        { shape: 'dot', colors: ['#3C3A37', '#5B5853'], count: 60, size: [0.9, 1.3] },
        { shape: 'dot', colors: ['#3E3F78', '#4B4C8C'], count: 7, size: [3.6, 4.4] },
        { shape: 'sliver', colors: ['#C9A26A', '#B98F57'], count: 7, size: [3.5, 5] },
        { ...ALMOND, count: 4, size: [4.5, 5.5] },
      ],
    },
  },
]

/** The six whole spices in the masala dabba, with what home cooks use them for. */
export const DABBA: { id: IngredientId; uses: string; fill: BowlSpec }[] = [
  {
    id: 'cardamom',
    uses: 'Chai, kheer, biryani and mithai',
    fill: { base: '#55692B', dry: true, garnish: [{ shape: 'pod', colors: ['#8FA64A', '#6E8336', '#7E9442'], count: 20, size: [7, 9] }] },
  },
  {
    id: 'clove',
    uses: 'Chai, pulao, biryani and garam masala',
    fill: { base: '#3A2216', dry: true, garnish: [{ shape: 'clove', colors: ['#6A3F27', '#4E2C1B', '#7A4A2E'], count: 22, size: [7, 8.5] }] },
  },
  {
    id: 'pepper',
    uses: 'Rasam, chai, eggs and everyday seasoning',
    fill: { base: '#241B16', dry: true, garnish: [{ shape: 'dot', colors: ['#3B2E26', '#120D0A', '#5A463A'], count: 70, size: [2.8, 3.8] }] },
  },
  {
    id: 'star',
    uses: 'Biryani, pulao and garam masala',
    fill: { base: '#5A2A18', dry: true, garnish: [{ shape: 'star', colors: ['#8D4526', '#A0552E', '#7A3A1F'], count: 6, size: [13, 16] }] },
  },
  {
    id: 'javitri',
    uses: 'Biryani, kormas and garam masala',
    fill: { base: '#B4471B', dry: true, garnish: [{ shape: 'sliver', colors: ['#E07A33', '#C9561E', '#F09A4C'], count: 26, size: [8, 12] }] },
  },
  {
    id: 'pippali',
    uses: 'Kadha, soups and spice blends',
    fill: { base: '#33261F', dry: true, garnish: [{ shape: 'catkin', colors: ['#5E4535', '#4A372B', '#6B5040'], count: 16, size: [9, 11] }] },
  },
]

/** Everyday staples for the pantry grid, in order. */
export const PANTRY: IngredientId[] = ['almonds', 'cashew', 'pista', 'walnut', 'raisins', 'dates', 'anjeer', 'makhana']

/** Pack sizes offered on the product pages, by category. */
export function packSizes(category: string) {
  return category === 'herbs' || category === 'spices' ? [100, 200, 500] : [100, 250, 500]
}
