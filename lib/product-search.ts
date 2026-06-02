import type { Product } from '@/lib/supabase'

type Relevance = 'high' | 'medium' | 'low'

export type ProductSearchMatch = {
  product: Product
  relevance: Relevance
  score: number
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  'dry-fruits': ['dry fruits', 'dry fruit', 'nuts', 'mixed nuts', 'nut', 'dry'],
  spices: ['spices', 'masala', 'whole spices', 'spice'],
  herbs: ['herbs', 'ayurvedic', 'ayurveda', 'health'],
  kits: ['gifting', 'gift box', 'gift', 'hamper', 'combo'],
}

const QUERY_ALIASES: Record<string, string[]> = {
  badam: ['almonds', 'almond'],
  badaam: ['almonds', 'almond'],
  kaju: ['cashews', 'cashew nuts', 'cashew'],
  cashu: ['cashews', 'cashew nuts', 'cashew'],
  pista: ['pistachios', 'pistas', 'pistachio'],
  pistas: ['pistachios', 'pistachio'],
  akhrot: ['walnuts', 'walnut'],
  kishmish: ['raisins', 'raisin'],
  munakka: ['raisins', 'raisin'],
  anjeer: ['figs', 'fig'],
  khajoor: ['dates', 'date'],
  chhuara: ['dry dates', 'dates'],
  makhana: ['fox nuts', 'lotus seeds'],
  haldi: ['turmeric'],
  turmuric: ['turmeric'],
  jeera: ['cumin'],
  dhania: ['coriander'],
  methi: ['fenugreek'],
  ajwain: ['carom seeds', 'bishop weed'],
  saunf: ['fennel seeds', 'fennel'],
  'kali mirch': ['black pepper'],
  laung: ['cloves', 'clove'],
  elaichi: ['cardamom'],
  dalchini: ['cinnamon'],
  tejpatta: ['bay leaf'],
  hing: ['asafoetida'],
  amla: ['indian gooseberry', 'gooseberry'],
  ashwagandha: ['ashwagandha', 'winter cherry'],
  shatavari: ['asparagus racemosus'],
  mulethi: ['licorice root', 'licorice'],
  giloy: ['guduchi', 'tinospora'],
  tulsi: ['holy basil', 'basil'],
  neem: ['neem'],
  triphala: ['triphala'],
  chyawanprash: ['chyawanprash'],
  'gond katira': ['tragacanth gum'],
  sabja: ['basil seeds'],
  flax: ['flaxseeds', 'flax seeds', 'alsi'],
  alsi: ['flaxseeds', 'flax seeds'],
  seed: ['flaxseeds', 'sabja seeds', 'sesame seeds', 'melon seeds', 'pumpkin seeds'],
  black: ['black pepper', 'black raisins', 'black sesame'],
}

const INTENT_ALIASES: Record<string, string[]> = {
  'weight loss': ['flaxseeds', 'flax seeds', 'sabja seeds', 'amla'],
  diet: ['flaxseeds', 'flax seeds', 'sabja seeds', 'amla'],
  'immunity booster': ['amla', 'giloy', 'ashwagandha', 'turmeric'],
  immunity: ['amla', 'giloy', 'ashwagandha', 'turmeric'],
  sleep: ['ashwagandha'],
  stress: ['ashwagandha'],
  digestion: ['jeera', 'cumin', 'ajwain', 'saunf', 'fennel', 'triphala'],
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function singularize(value: string) {
  return value.endsWith('s') ? value.slice(0, -1) : value
}

function editDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 3
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j += 1) dp[0][j] = j
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
    }
  }
  return dp[a.length][b.length]
}

function expandQuery(query: string) {
  const normalized = normalize(query)
  const terms = new Set<string>([normalized, singularize(normalized)])
  const categoryMatches = new Set<string>()

  for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some(alias => normalized.includes(normalize(alias)))) {
      categoryMatches.add(category)
    }
  }

  for (const [alias, targets] of Object.entries({ ...QUERY_ALIASES, ...INTENT_ALIASES })) {
    const normalizedAlias = normalize(alias)
    if (normalized.includes(normalizedAlias) || editDistance(normalized, normalizedAlias) <= 1) {
      terms.add(normalizedAlias)
      targets.forEach(target => terms.add(normalize(target)))
    }
  }

  normalized.split(' ').forEach(token => {
    if (token.length > 1) {
      terms.add(token)
      terms.add(singularize(token))
    }
    for (const [alias, targets] of Object.entries(QUERY_ALIASES)) {
      const normalizedAlias = normalize(alias)
      if (editDistance(token, normalizedAlias) <= 1) {
        targets.forEach(target => terms.add(normalize(target)))
      }
    }
  })

  return {
    normalized,
    terms: Array.from(terms).filter(Boolean),
    categoryMatches: Array.from(categoryMatches),
  }
}

function searchableText(product: Product) {
  return normalize([
    product.name,
    product.slug,
    product.description,
    product.category,
    product.vendor,
    ...(product.tags || []),
  ].filter(Boolean).join(' '))
}

function relevance(score: number): Relevance {
  if (score >= 80) return 'high'
  if (score >= 35) return 'medium'
  return 'low'
}

export function matchCatalogProducts(products: Product[], query: string, limit = 24): ProductSearchMatch[] {
  const expanded = expandQuery(query)
  if (!expanded.normalized) return []

  return products
    .map(product => {
      const haystack = searchableText(product)
      const name = normalize(product.name)
      let score = 0

      if (expanded.categoryMatches.includes(product.category)) score += 70
      for (const term of expanded.terms) {
        if (!term) continue
        if (name === term) score += 120
        else if (name.includes(term)) score += 90
        else if (haystack.includes(term)) score += 55
        else if (term.split(' ').some(token => token.length > 2 && haystack.includes(token))) score += 18
      }

      return { product, relevance: relevance(score), score }
    })
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, limit)
}

