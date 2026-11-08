import type { Product } from '@/lib/supabase'
import { displayName } from '../_lib/shared'

/**
 * Hindi names for every product in the catalogue, matched on name + slug.
 * Order matters: the more specific entries come first ("walnut kernel" before
 * "walnut", "rosemary" before "rose", "medjool" before "dates").
 */
type NameEntry = {
  match: string[]
  hi: string
  /** What the store search understands (it already maps Hinglish like "badam"). */
  search: string
  /** Extra Hindi words people may type in the search box. */
  aliases?: string[]
}

const NAMES: NameEntry[] = [
  // Mewa and seeds
  { match: ['walnut-kernels', 'walnut kernel', 'akhrot giri'], hi: 'अखरोट गिरी', search: 'walnut', aliases: ['अखरोट', 'गिरी'] },
  { match: ['walnut', 'akhrot'], hi: 'कागज़ी अखरोट', search: 'walnut', aliases: ['कागजी', 'कागज़ी'] },
  { match: ['medjool'], hi: 'मेडजूल खजूर', search: 'medjool', aliases: ['मेडजूल'] },
  { match: ['dates', 'khajoor'], hi: 'खजूर', search: 'dates', aliases: ['खजूर', 'छुहारा'] },
  { match: ['cashew', 'kaju'], hi: 'काजू', search: 'kaju', aliases: ['काजू'] },
  { match: ['almond', 'badaam', 'badam'], hi: 'बादाम', search: 'badam', aliases: ['बादाम', 'बदाम'] },
  { match: ['pista'], hi: 'पिस्ता', search: 'pista', aliases: ['पिस्ता', 'पिस्ते'] },
  { match: ['raisin', 'kishmish'], hi: 'किशमिश', search: 'kishmish', aliases: ['किशमिश'] },
  { match: ['munnaka', 'munakka'], hi: 'मुनक्का', search: 'munnaka', aliases: ['मुनक्का', 'मुनक्के'] },
  { match: ['anjeer', 'fig'], hi: 'अंजीर', search: 'anjeer', aliases: ['अंजीर'] },
  { match: ['makhana', 'foxnut'], hi: 'मखाना', search: 'makhana', aliases: ['मखाना', 'मखाने'] },
  { match: ['blue-berry', 'blue berry', 'blueberr'], hi: 'ब्लूबेरी', search: 'blue berry', aliases: ['ब्लूबेरी'] },
  { match: ['craneberry', 'cranberr'], hi: 'क्रैनबेरी', search: 'craneberry', aliases: ['क्रैनबेरी', 'क्रेनबेरी'] },
  { match: ['black-current', 'black current', 'currant'], hi: 'ब्लैक करंट', search: 'black current', aliases: ['करंट'] },
  { match: ['seed-nut', 'seeds n nuts'], hi: 'बीज और मेवा मिक्स', search: 'seeds n nuts' },
  { match: ['muesli'], hi: 'म्यूसली मिक्स', search: 'muesli', aliases: ['म्यूसली', 'मुसली'] },
  { match: ['pumpkin'], hi: 'कद्दू के बीज', search: 'pumpkin', aliases: ['कद्दू'] },
  { match: ['sunflower'], hi: 'सूरजमुखी के बीज', search: 'sunflower', aliases: ['सूरजमुखी'] },
  { match: ['chia'], hi: 'चिया बीज', search: 'chia', aliases: ['चिया'] },
  { match: ['flex', 'flax', 'alsi'], hi: 'अलसी', search: 'alsi', aliases: ['अलसी'] },
  { match: ['sabja'], hi: 'सब्ज़ा बीज', search: 'sabja', aliases: ['सब्ज़ा', 'सब्जा', 'तुकमलंगा'] },
  { match: ['muskmelon', 'magaz'], hi: 'खरबूजे के बीज (मगज़)', search: 'muskmelon', aliases: ['खरबूजे', 'खरबूजा', 'मगज़', 'मगज'] },
  { match: ['protien-beans', 'protien beans', 'protein beans'], hi: 'प्रोटीन बीन्स', search: 'protien', aliases: ['प्रोटीन'] },
  { match: ['protien-booster', 'booster'], hi: 'प्रोटीन बूस्टर', search: 'protien' },
  // Jadi-booti
  { match: ['ashwagandha'], hi: 'अश्वगंधा', search: 'ashwagandha', aliases: ['अश्वगंधा', 'असगंध'] },
  { match: ['moringa'], hi: 'सहजन (मोरिंगा) पाउडर', search: 'moringa', aliases: ['सहजन', 'मोरिंगा'] },
  { match: ['triphala'], hi: 'त्रिफला चूर्ण', search: 'triphala', aliases: ['त्रिफला'] },
  { match: ['indigo'], hi: 'नील पाउडर', search: 'indigo', aliases: ['नील'] },
  { match: ['kasturi'], hi: 'कस्तूरी हल्दी', search: 'kasturi haldi', aliases: ['कस्तूरी'] },
  { match: ['amba-haldi', 'amba haldi'], hi: 'आंबा हल्दी पाउडर', search: 'amba haldi', aliases: ['आंबा', 'आमा हल्दी'] },
  { match: ['jamun'], hi: 'जामुन गुठली', search: 'jamun', aliases: ['जामुन', 'गुठली'] },
  { match: ['karela'], hi: 'करेले के बीज', search: 'karela', aliases: ['करेला', 'करेले'] },
  { match: ['neem'], hi: 'नीम पाउडर', search: 'neem', aliases: ['नीम'] },
  { match: ['hibiscus-gudhal-powder', 'gudhal) powder'], hi: 'गुड़हल पाउडर', search: 'hibiscus' },
  { match: ['hibiscus', 'gudhal'], hi: 'गुड़हल के फूल', search: 'hibiscus', aliases: ['गुड़हल', 'गुडहल'] },
  { match: ['safed-musli', 'safed musli'], hi: 'सफ़ेद मूसली', search: 'safed musli', aliases: ['मूसली', 'सफेद मूसली'] },
  { match: ['chirata', 'chirayta'], hi: 'चिरायता', search: 'chirata', aliases: ['चिरायता'] },
  { match: ['mulethi'], hi: 'मुलेठी', search: 'mulethi', aliases: ['मुलेठी', 'मुलैठी'] },
  { match: ['arjun'], hi: 'अर्जुन छाल', search: 'arjun', aliases: ['अर्जुन'] },
  { match: ['bhrami', 'brahmi'], hi: 'ब्राह्मी पाउडर', search: 'bhrami', aliases: ['ब्राह्मी', 'ब्रह्मी'] },
  { match: ['gond'], hi: 'गोंद कतीरा', search: 'gond katira', aliases: ['गोंद', 'कतीरा'] },
  { match: ['satavari', 'shatavari'], hi: 'शतावरी पाउडर', search: 'satavari', aliases: ['शतावरी'] },
  { match: ['koch', 'kaunch'], hi: 'कौंच बीज', search: 'koch beej', aliases: ['कौंच', 'कोंच'] },
  { match: ['paneer-doda', 'paneer doda'], hi: 'पनीर डोडा', search: 'paneer doda', aliases: ['पनीर डोडा', 'डोडा'] },
  { match: ['reetha', 'ritha'], hi: 'रीठा', search: 'reetha', aliases: ['रीठा'] },
  { match: ['shikakai'], hi: 'शिकाकाई', search: 'shikakai', aliases: ['शिकाकाई'] },
  { match: ['rosemary'], hi: 'रोज़मेरी', search: 'rosemary', aliases: ['रोज़मेरी', 'रोजमेरी'] },
  { match: ['amla'], hi: 'आंवला', search: 'amla', aliases: ['आंवला', 'आँवला', 'आमला'] },
  { match: ['rose'], hi: 'गुलाब की पंखुड़ियाँ', search: 'rose', aliases: ['गुलाब'] },
  // Masale
  { match: ['javitri'], hi: 'जावित्री', search: 'javitri', aliases: ['जावित्री', 'जावत्री'] },
  { match: ['black-pepper', 'kali mirch'], hi: 'काली मिर्च', search: 'kali mirch', aliases: ['काली मिर्च', 'कालीमिर्च', 'मिर्च'] },
  { match: ['pepali', 'pippali'], hi: 'पिप्पली', search: 'pepali', aliases: ['पिप्पली', 'पीपली'] },
  { match: ['clove'], hi: 'लौंग', search: 'laung', aliases: ['लौंग', 'लोंग'] },
  { match: ['star-anais', 'star anise', 'star anais'], hi: 'चक्र फूल', search: 'star', aliases: ['चक्र फूल', 'चक्रफूल', 'बादियान'] },
  { match: ['cardamom', 'elaichi'], hi: 'इलायची', search: 'elaichi', aliases: ['इलायची', 'इलाइची'] },
  // Kits
  { match: ['super-seeds', 'super seeds'], hi: 'सुपर सीड्स कॉम्बो पैक', search: 'super seeds' },
  { match: ['cool-summer', 'summer kit'], hi: 'कूल समर किट', search: 'summer' },
  { match: ['sugar'], hi: 'शुगर मैनेजमेंट किट', search: 'sugar' },
  { match: ['gym'], hi: 'जिम किट', search: 'gym' },
  { match: ['hair-care', 'hair care kit'], hi: 'हेयर केयर किट', search: 'hair care' },
]

function entryFor(text: string) {
  const haystack = text.toLowerCase()
  return NAMES.find(entry => entry.match.some(word => haystack.includes(word)))
}

/** "Almonds (Badaam)" → "बादाम". Works for kit contents too ("Pumpkin Seeds" → "कद्दू के बीज"). */
export function hindiName(name: string, slug = '') {
  return entryFor(`${name} ${slug}`)?.hi || ''
}

/** The English part only: "Almonds (Badaam)" → "Almonds", "Black Pepper/ Kali Mirch" → "Black Pepper". */
export function englishName(name: string) {
  return displayName(name)
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .split(' / ')[0]
    .replace(/\s+/g, ' ')
    .trim()
}

export function bilingual(product: Product) {
  const en = englishName(product.name)
  return { en, hi: hindiName(product.name, product.slug) || en }
}

/** "250 ग्राम", "1 किलो". */
export function gramsHi(grams: number) {
  return grams >= 1000 ? `${grams / 1000} किलो` : `${grams} ग्राम`
}

export const BADGE_HI: Record<string, string> = {
  Bestseller: 'बेस्टसेलर',
  Premium: 'प्रीमियम',
  'New crop': 'नई फ़सल',
  Superfood: 'सुपरफ़ूड',
}

const CATEGORY_WORDS: { words: string[]; href: string }[] = [
  { words: ['मेवा', 'मेवे', 'ड्राई फ्रूट'], href: '/products?category=dry-fruits' },
  { words: ['मसाला', 'मसाले'], href: '/products?category=spices' },
  { words: ['जड़ी', 'जडी', 'बूटी', 'जड़ी-बूटी'], href: '/products?category=herbs' },
  { words: ['किट'], href: '/kits' },
]

/**
 * The store search reads English and Hinglish ("badam"), not Devanagari.
 * Turn "बादाम" into a search it understands; leave anything else as typed.
 */
export function searchHref(query: string) {
  const text = query.trim()
  if (!text) return '/products'
  if (!/[ऀ-ॿ]/.test(text)) return `/products?q=${encodeURIComponent(text)}`

  let best: { search: string; length: number } | null = null
  for (const entry of NAMES) {
    const words = [entry.hi, ...(entry.aliases || [])]
    for (const word of words) {
      if (word.length >= 2 && text.includes(word) && (!best || word.length > best.length)) {
        best = { search: entry.search, length: word.length }
      }
    }
  }
  if (best) return `/products?q=${encodeURIComponent(best.search)}`
  const category = CATEGORY_WORDS.find(group => group.words.some(word => text.includes(word)))
  return category ? category.href : `/products?q=${encodeURIComponent(text)}`
}

/** What goes on the chalkboard: everyday staples, in the order a pansari would write them. */
export const CHALKBOARD = ['almond', 'cashew', 'pista', 'walnut kernel', 'raisin', 'makhana', 'anjeer', 'cardamom']

/** Shelf picks (photographed products only, via catalog.pick). */
export const SHELVES = {
  mewa: ['almond', 'cashew', 'pista', 'walnut kernel', 'raisin', 'dates', 'anjeer', 'makhana', 'munnaka', 'walnuts', 'chia', 'pumpkin'],
  jadi: ['ashwagandha', 'moringa', 'triphala', 'amla', 'mulethi', 'bhrami', 'satavari', 'safed musli', 'arjun', 'shikakai', 'reetha', 'gond katira'],
  masale: ['cardamom', 'black-pepper', 'clove', 'javitri', 'star', 'pepali'],
}
