/** The homepage design prototypes, in the order they are presented. */

export const GOALS = [
  { key: 'gifting', label: 'Gifting & premium' },
  { key: 'fast', label: 'Fast & simple' },
  { key: 'health', label: 'Health & fitness' },
  { key: 'indian', label: 'Indian & traditional' },
  { key: 'young', label: 'Young & fun' },
  { key: 'guided', label: 'Guided buying' },
  { key: 'trust', label: 'Trust & story' },
  { key: 'premium', label: 'Premium' },
  { key: 'cooking', label: 'Cooking' },
] as const

export type GoalKey = (typeof GOALS)[number]['key']

export type PrototypeInfo = {
  key: string
  slug: string
  name: string
  tag: string
  text: string
  bestFor: string
  points: string[]
  why: string
  swatches: string[]
  fonts: string
  goals: GoalKey[]
  isNew?: boolean
}

export const PROTOTYPES: PrototypeInfo[] = [
  {
    key: 'A',
    slug: 'noir',
    goals: ['premium', 'gifting'],
    name: 'Noir & Gold',
    tag: 'Premium · gift-worthy',
    text: 'Built around your black-and-gold pouches: moody photography, elegant serif type and a luxury feel.',
    bestFor: 'Premium buyers, gifting, bigger baskets',
    points: ['Hero with a featured bestseller', 'Bestseller grid with one-tap add', 'Category tiles and health kits'],
    why: 'Your product photos are dark and dramatic. This is the design they blend into most naturally.',
    swatches: ['#0C0A08', '#1B1712', '#D6B26C', '#F5EFE4'],
    fonts: 'Cormorant Garamond + Manrope',
  },
  {
    key: 'B',
    slug: 'market',
    goals: ['fast'],
    name: 'Market',
    tag: 'Fast · practical',
    text: 'Quick-commerce style for repeat buyers on their phones: search first, pick a pack size, tap ADD and watch the free-delivery meter fill up.',
    bestFor: 'Repeat buyers shopping on phones',
    points: ['250 g / 500 g / 1 kg chips on every card', 'ADD turns into a − 1 + stepper', 'Sticky cart bar with free-delivery progress'],
    why: 'Quick-commerce apps handled about two-thirds of India’s online grocery orders in 2024, so shoppers already know this layout by heart.',
    swatches: ['#0F7A47', '#E7F6EC', '#F59E0B', '#FFFFFF'],
    fonts: 'Plus Jakarta Sans',
  },
  {
    key: 'C',
    slug: 'wellness',
    goals: ['health'],
    name: 'Wellness',
    tag: 'Ayurveda-forward · calm',
    text: 'Leans into the herbs and kits: shop by health goal, a kit spotlight with real ingredients, and an apothecary shelf.',
    bestFor: 'Health seekers, herb and kit buyers',
    points: ['8 “shop by goal” cards linked to real products', 'Kit spotlight shows what is inside', 'Family-business story from your About page'],
    why: 'Ayurveda leaders like Kapiva sell by concern (sugar, hair, energy), because people shop by the problem, not the ingredient.',
    swatches: ['#F7F2E8', '#DCE5D2', '#1E3A2B', '#E0A43A'],
    fonts: 'Fraunces + DM Sans',
  },
  {
    key: 'D',
    slug: 'utsav',
    goals: ['gifting', 'indian'],
    name: 'Utsav',
    tag: 'Festive · gifting',
    text: 'A gifting-first store in maroon and marigold: ready-made mewa sets, a build-your-own gift box and a corporate gifting desk.',
    bestFor: 'Bhai Dooj, weddings, corporate orders',
    points: ['Ready-made gift sets added in one tap', 'Build-your-own box with a live price', 'Corporate and bulk gifting on WhatsApp'],
    why: 'Dry fruits are India’s classic festive gift. Bombay Sweet Shop and Vahdam open with gift sets, and wedding season runs to February.',
    swatches: ['#5E0B1E', '#F2A007', '#C99A3C', '#FFF6E6'],
    fonts: 'Rozha One + Mukta',
    isNew: true,
  },
  {
    key: 'E',
    slug: 'pansari',
    goals: ['indian', 'trust'],
    name: 'Pansari',
    tag: 'Heritage · Hindi + English',
    text: 'Your family shop, online: a hand-painted signboard, today’s prices on a chalkboard, bilingual names and a one-tap switch to Hindi.',
    bestFor: 'Families and Hindi-first shoppers in North India',
    points: ['English ⇄ हिंदी switch', '“Aaj ke daam” chalkboard with add buttons', 'Video-call the shop before you buy'],
    why: 'Hindi is India’s biggest local shopping language, and Hindi-first shoppers cluster in UP, Haryana, Rajasthan and Delhi-NCR, your home market.',
    swatches: ['#F3E7D3', '#A8261C', '#E2A50E', '#1E1A16'],
    fonts: 'Yatra One + Tiro Devanagari + Hind',
    isNew: true,
  },
  {
    key: 'F',
    slug: 'pop',
    goals: ['young'],
    name: 'Pop',
    tag: 'Playful · Gen Z',
    text: 'Loud colours, chunky stickers and a bento grid: snacks sorted by craving (4 PM hunger, gym bag, sweet tooth) plus ready-made snack packs.',
    bestFor: 'Students, young professionals, the Instagram crowd',
    points: ['Bento hero with live products', '“Pick your craving” tabs', 'Snack packs added in one tap'],
    why: 'Makhana is the go-to healthy snack for 65% of Indians, and Gen Z orders snacks weekly at twice the rate of older buyers (Farmley, 2025).',
    swatches: ['#FFF4E2', '#FF6B2C', '#FF8FC4', '#151515'],
    fonts: 'Bricolage Grotesque',
    isNew: true,
  },
  {
    key: 'G',
    slug: 'rasoi',
    goals: ['indian', 'cooking'],
    name: 'Rasoi',
    tag: 'Recipe-led · homely',
    text: 'Shop by dish: pick kheer, thandai, chai or laddoo and get every Mana ingredient in one tap, plus a masala-dabba spice box.',
    bestFor: 'Home cooks and festive cooking',
    points: ['Dishes with “add all ingredients”', 'Masala-dabba spice picker', 'Blue-pottery look, warm and homely'],
    why: 'Recipe bundles raise basket size, and festive cooking (kheer, laddoo, thandai) is when families buy dry fruits in bulk.',
    swatches: ['#FBFAF6', '#1D3F9A', '#F2A51A', '#C8361B'],
    fonts: 'Young Serif + Figtree',
    isNew: true,
  },
  {
    key: 'H',
    slug: 'fuel',
    goals: ['health', 'young'],
    name: 'Fuel',
    tag: 'Fitness · protein',
    text: 'Dark, sporty and data-led: protein per 30 g for every nut and seed, a daily-stack builder that works out a month’s supply, and the Gym Kit.',
    bestFor: 'Gym-goers, runners, protein seekers',
    points: ['Protein leaderboard (USDA values)', 'Daily stack → month’s supply', 'Gym Kit spotlight'],
    why: 'Health now drives snacking choices for 72% of Indians (Farmley, 2025), and your seeds and nuts are naturally rich in protein.',
    swatches: ['#0C0D0B', '#D6FF3D', '#FF6B2C', '#F2F2EE'],
    fonts: 'Anton + Archivo + JetBrains Mono',
    isNew: true,
  },
  {
    key: 'I',
    slug: 'mono',
    goals: ['fast'],
    name: 'Mono',
    tag: 'Minimal · fastest',
    text: 'The whole catalogue on one calm page: type to filter every product instantly, switch between list and gallery, add without leaving.',
    bestFor: 'People who know what they want; slow phones',
    points: ['Instant search across all products', 'List or gallery view', 'Nothing else in the way'],
    why: 'Baymard’s 2026 benchmark rates homepage navigation mediocre or worse on 61% of desktop and 65% of mobile stores. Here everything is one tap away.',
    swatches: ['#FFFFFF', '#F5F4F0', '#111111', '#9C7A2F'],
    fonts: 'Instrument Serif + Instrument Sans',
    isNew: true,
  },
  {
    key: 'J',
    slug: 'ask',
    goals: ['guided', 'fast'],
    name: 'Ask Mana',
    tag: 'Guided · chat-style',
    text: 'The homepage is a friendly chat: answer two quick questions (gift? health? snacks? budget?) and get real picks you can add right there.',
    bestFor: 'First-time buyers, gift shoppers, older users',
    points: ['Chat-style guided shopping (instant, no AI)', 'Live basket beside the chat', 'Hand-off to WhatsApp or a video call'],
    why: '86% of online adults in India message a business every week, the highest in the world (Kantar for Meta). Chatting is how people already shop.',
    swatches: ['#FAF6EF', '#0F5257', '#F59E4C', '#DDF0EC'],
    fonts: 'Nunito',
    isNew: true,
  },
]

export function prototypeBySlug(slug: string) {
  return PROTOTYPES.find(prototype => prototype.slug === slug)
}
