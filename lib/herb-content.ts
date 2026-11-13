/**
 * Long-form content for herb product pages, keyed by product slug.
 *
 * Why this exists: people search for a herb by many names — Hindi, English,
 * regional spellings, the botanical name — plus "benefits", "how to use",
 * "side effects". A page only ranks for the names and questions it actually
 * contains, so each herb gets every name it is known by and answers to the
 * questions people ask (the same structure the top herb stores use).
 *
 * Writing rules (Indian advertising law and Google's health-content policy):
 * describe TRADITIONAL uses ("traditionally used for…"), never promise to
 * treat, cure or prevent a disease; always point to a qualified practitioner
 * for dosage and medical conditions.
 *
 * To add a herb: add an entry keyed by its exact product slug. The product
 * page, metadata, schema and the /ayurvedic-herbs index pick it up.
 */

import { RENAMED_SLUGS } from '@/lib/product-lookup'

export type HerbFaq = { q: string; a: string }

export type HerbContent = {
  /** Name to lead the page title with, e.g. "Ashwagandha Powder". */
  title: string
  /** Hindi name in Devanagari. */
  hindi: string
  /** Botanical (Latin) name(s). */
  botanical: string
  /** Every other name and spelling people search for. */
  aka: string[]
  /** <title> tag (brand suffix is added by the layout template). */
  seoTitle: string
  /** Meta description, ≤ 160 characters. */
  seoDescription: string
  /** Opening paragraphs: what it is. */
  intro: string[]
  /** Traditional uses — phrased as tradition, not medical claims. */
  traditionalUses: string[]
  howToUse: string[]
  /** Commonly cited amount, always with the "ask a practitioner" caveat. */
  typicalAmount: string
  precautions: string[]
  storage: string
  faqs: HerbFaq[]
}

const PRACTITIONER = 'Amounts vary by person; check with a qualified Ayurvedic practitioner or doctor for what suits you.'

export const HERB_CONTENT: Record<string, HerbContent> = {
  'ashwagandha-powder': {
    title: 'Ashwagandha Powder',
    hindi: 'अश्वगंधा',
    botanical: 'Withania somnifera',
    aka: ['Asgandh', 'Ashvagandha', 'Aswagandha', 'Winter Cherry', 'Indian Ginseng', 'Ashwagandha Churna', 'Ashwagandha Root Powder'],
    seoTitle: 'Ashwagandha Powder (Asgandh) – Buy Pure Ashwagandha Churna Online',
    seoDescription: 'Buy pure Ashwagandha root powder (Asgandh, Withania somnifera) online. Lab tested, packed fresh to order. Uses, how to take it, typical amount and precautions.',
    intro: [
      'Ashwagandha (अश्वगंधा), also called Asgandh, Winter Cherry or Indian Ginseng, is the dried root of Withania somnifera — one of the best-known herbs in Ayurveda. Its Sanskrit name refers to the root\'s strong, horse-like smell.',
      'Mana Ashwagandha is sold as a fine root powder (churna) and as whole dried root. Every batch is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Classed in Ayurveda as a rasayana — a herb traditionally taken for strength, stamina and general vitality.',
      'Traditionally taken in the evening with warm milk as part of a calming, restful routine.',
      'Commonly combined with Shatavari, Safed Musli and Kaunch Beej in traditional preparations.',
    ],
    howToUse: [
      'Stir the powder into a cup of warm milk; add honey or jaggery once the milk has cooled slightly.',
      'Or mix with warm water, or blend into a smoothie to soften the earthy, slightly bitter taste.',
      'Whole roots can be simmered in milk or water (as a decoction) and strained.',
    ],
    typicalAmount: `Traditionally about ½–1 teaspoon (roughly 3–5 g) of powder once or twice a day. ${PRACTITIONER}`,
    precautions: [
      'Avoid during pregnancy, and speak to a doctor first if breastfeeding.',
      'Check with your doctor first if you have a thyroid condition, an autoimmune condition, liver problems, or take sedatives, thyroid, blood-pressure or diabetes medicine.',
      'Stop use and seek advice if you notice stomach upset or any unusual symptoms.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place away from sunlight. Use a dry spoon so the powder does not clump.',
    faqs: [
      { q: 'What is Ashwagandha called in Hindi?', a: 'In Hindi it is अश्वगंधा (Ashwagandha), often shortened to Asgandh. In English it is sometimes called Winter Cherry or Indian Ginseng; its botanical name is Withania somnifera.' },
      { q: 'How do I take Ashwagandha powder?', a: 'The traditional way is ½–1 teaspoon stirred into warm milk, usually in the evening. It can also be taken with warm water or honey, or added to a smoothie.' },
      { q: 'Is Ashwagandha powder better than the whole root?', a: 'The powder is ready to use. Whole root keeps its aroma longer and is preferred for decoctions; you can grind it as needed. Both are the same plant part.' },
      { q: 'Who should avoid Ashwagandha?', a: 'Pregnant women, and anyone with a thyroid or autoimmune condition, liver problems, or on sedative, thyroid, blood-pressure or diabetes medicine should consult a doctor before using it.' },
      { q: 'Why does Ashwagandha smell strong?', a: 'A strong, earthy smell is natural for the root — it is where the name ("smell of a horse") comes from. It is not a sign of spoilage.' },
    ],
  },

  'shatavari-powder': {
    title: 'Shatavari Powder',
    hindi: 'शतावरी',
    botanical: 'Asparagus racemosus',
    aka: ['Satavari', 'Shatawari', 'Satawari', 'Shatavari Churna', 'Indian Asparagus', 'Shatavari Root Powder'],
    seoTitle: 'Shatavari Powder (Satavari) – Buy Pure Shatavari Churna Online',
    seoDescription: 'Buy pure Shatavari root powder (Satavari, Asparagus racemosus) online. Lab tested, packed fresh to order. Uses, how to take it, typical amount and precautions.',
    intro: [
      'Shatavari (शतावरी), also spelt Satavari or Shatawari, is the dried root of Asparagus racemosus, a climbing plant related to garden asparagus. It is one of the classic rejuvenating herbs of Ayurveda.',
      'Mana Shatavari is a finely ground root powder (churna). Every batch is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Classed in Ayurveda as a rasayana, traditionally associated with women\'s wellness at different stages of life.',
      'Traditionally taken with warm milk as a nourishing, cooling tonic.',
      'Often combined with Ashwagandha and Safed Musli in traditional preparations.',
    ],
    howToUse: [
      'Stir into warm milk and sweeten with a little honey, jaggery or mishri.',
      'Or mix with warm water, or add to a smoothie or porridge.',
    ],
    typicalAmount: `Traditionally about ½–1 teaspoon (roughly 3–5 g) once or twice a day. ${PRACTITIONER}`,
    precautions: [
      'Consult a doctor before use if you are pregnant or breastfeeding.',
      'Avoid if you are allergic to asparagus.',
      'Check with your doctor if you have a hormone-sensitive condition, or take diuretics or diabetes medicine.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place. Shatavari powder absorbs moisture easily, so always use a dry spoon.',
    faqs: [
      { q: 'Is it Shatavari or Satavari?', a: 'Both — they are spellings of the same herb, शतावरी. You will also see Shatawari and Satawari. The botanical name is Asparagus racemosus.' },
      { q: 'How do I take Shatavari powder?', a: 'The traditional way is ½–1 teaspoon in warm milk, sweetened lightly. It can also be taken with warm water.' },
      { q: 'What does Shatavari taste like?', a: 'Mildly sweet and slightly bitter, with a starchy texture. Milk and a little sweetener make it easy to take.' },
      { q: 'Can Shatavari and Ashwagandha be taken together?', a: 'They are commonly paired in traditional Ayurvedic preparations. If you are on medication or have a health condition, ask a practitioner first.' },
    ],
  },

  'brahmi-powder': {
    title: 'Brahmi Powder',
    hindi: 'ब्राह्मी',
    botanical: 'Bacopa monnieri',
    aka: ['Bhrami', 'Brahmi Booti', 'Bacopa', 'Water Hyssop', 'Brahmi Churna', 'Brahmi Leaf Powder'],
    seoTitle: 'Brahmi Powder (Bacopa) – Buy Pure Brahmi Churna Online',
    seoDescription: 'Buy pure Brahmi leaf powder (Bacopa monnieri, Brahmi booti) online. Lab tested, packed fresh to order. Uses, how to take it, typical amount and precautions.',
    intro: [
      'Brahmi (ब्राह्मी), also called Brahmi booti, Bacopa or Water Hyssop, is a small creeping herb that grows in wet, marshy ground. Its leaves have been used in Ayurveda for centuries.',
      'Mana Brahmi is a fine powder made from the dried leaves. Every batch is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally regarded in Ayurveda as a medhya rasayana — a herb for the mind, associated with memory, focus and calm.',
      'Often combined with Shankhpushpi in traditional preparations.',
      'Also used in traditional hair oils and hair packs.',
    ],
    howToUse: [
      'Mix with warm water or warm milk; a little honey or ghee softens its bitter taste.',
      'For hair, mix with water or curd into a paste, apply, and rinse after 20–30 minutes.',
    ],
    typicalAmount: `Traditionally about ¼–½ teaspoon (roughly 1–3 g) once or twice a day. ${PRACTITIONER}`,
    precautions: [
      'Can cause stomach upset or loose motions in some people — start with a small amount.',
      'Consult a doctor before use if you are pregnant or breastfeeding, or take thyroid medicine or sedatives.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place away from sunlight.',
    faqs: [
      { q: 'What is Brahmi called in English?', a: 'Brahmi (ब्राह्मी) is called Bacopa or Water Hyssop in English; its botanical name is Bacopa monnieri. It is also sold as Brahmi booti.' },
      { q: 'Is Brahmi the same as Mandukaparni (Gotu Kola)?', a: 'No. In some parts of India the name "Brahmi" is also used for Mandukaparni (Centella asiatica, Gotu Kola), a different plant. Mana Brahmi is Bacopa monnieri.' },
      { q: 'How do I take Brahmi powder?', a: 'Traditionally a small amount — about ¼–½ teaspoon — is mixed into warm water or milk, often with honey or ghee.' },
      { q: 'Can Brahmi powder be used for hair?', a: 'Yes, it is a common ingredient in traditional hair packs and oils. Mix with water or curd, apply to scalp and hair, and rinse after 20–30 minutes.' },
      { q: 'Why is Brahmi bitter?', a: 'Brahmi is naturally bitter. Honey, ghee or warm milk make it easier to take.' },
    ],
  },

  'triphala-powder': {
    title: 'Triphala Powder',
    hindi: 'त्रिफला',
    botanical: 'Phyllanthus emblica, Terminalia chebula and Terminalia bellirica',
    aka: ['Triphala Churna', 'Trifala', 'Amla Harad Baheda Powder', 'Haritaki Bibhitaki Amalaki', 'Triphala Choorna'],
    seoTitle: 'Triphala Churna – Buy Pure Triphala Powder (Amla, Harad, Baheda)',
    seoDescription: 'Buy pure Triphala churna online — Amla, Harad and Baheda in equal parts. Lab tested, packed fresh to order. Uses, how to take it, typical amount and precautions.',
    intro: [
      'Triphala (त्रिफला) means "three fruits". It is a blend of three dried fruits in equal parts: Amla (Amalaki, Phyllanthus emblica), Harad (Haritaki, Terminalia chebula) and Baheda (Bibhitaki, Terminalia bellirica). It is one of the most widely used formulations in Ayurveda.',
      'Mana Triphala is a fine churna (powder). Every batch is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally taken for digestion and regular bowel movements, usually at night.',
      'Used as a gentle, everyday cleansing formula in Ayurvedic routines.',
      'Also used traditionally as an eye wash and a mouth rinse (only when properly prepared and strained).',
    ],
    howToUse: [
      'Mix into a glass of warm water and drink, usually at bedtime.',
      'Or soak in water overnight and drink the strained water in the morning.',
      'Honey or a little ghee can be added to soften its sour, astringent taste.',
    ],
    typicalAmount: `Traditionally about ½–1 teaspoon (roughly 3–5 g) once a day, usually at night. ${PRACTITIONER}`,
    precautions: [
      'Has a natural laxative effect — start small, and avoid if you have diarrhoea.',
      'Avoid during pregnancy, and consult a doctor if breastfeeding.',
      'Check with your doctor if you take blood-thinning or diabetes medicine.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place. Triphala is hygroscopic and clumps if left open.',
    faqs: [
      { q: 'What is Triphala made of?', a: 'Equal parts of three dried fruits: Amla (Amalaki), Harad (Haritaki) and Baheda (Bibhitaki).' },
      { q: 'When is the best time to take Triphala?', a: 'Traditionally at night before bed with warm water. Some people prefer drinking Triphala water (soaked overnight) in the morning.' },
      { q: 'How do I take Triphala churna?', a: 'Mix about ½–1 teaspoon into warm water. Start with less to see how your body responds — it has a natural laxative effect.' },
      { q: 'Why does Triphala taste sour and bitter?', a: 'Amla is sour and Harad and Baheda are astringent and bitter. That mixed taste is normal for a genuine blend.' },
      { q: 'Is Triphala churna the same as Triphala powder?', a: 'Yes — churna is the Ayurvedic word for a fine powder.' },
    ],
  },

  'moringa-powder': {
    title: 'Moringa Powder',
    hindi: 'सहजन',
    botanical: 'Moringa oleifera',
    aka: ['Sahjan', 'Sahjan Patta Powder', 'Drumstick Leaf Powder', 'Shevga', 'Murungai', 'Munga', 'Moringa Leaf Powder'],
    seoTitle: 'Moringa Powder (Sahjan / Drumstick Leaf) – Buy Pure Moringa Online',
    seoDescription: 'Buy pure Moringa leaf powder (Sahjan, drumstick leaves, Moringa oleifera) online. Lab tested, packed fresh to order. How to use it, typical amount and precautions.',
    intro: [
      'Moringa powder is made from the dried leaves of the drumstick tree, Moringa oleifera — known as Sahjan (सहजन) in Hindi, Shevga in Marathi and Murungai in Tamil. The same tree gives the drumstick pods used in sambar.',
      'The leaves are naturally rich in plant protein, vitamins and minerals, which is why moringa is often called a superfood. Every batch of Mana Moringa is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Drumstick leaves have long been cooked as a leafy vegetable in Indian homes.',
      'Used as a simple way to add greens and plant nutrients to everyday food.',
    ],
    howToUse: [
      'Stir into smoothies, juices, lassi or warm water.',
      'Sprinkle over dal, sabzi, soups, chilla or paratha dough.',
      'Add after cooking where possible — gentle heat keeps more of its colour and flavour.',
    ],
    typicalAmount: `Commonly about 1–2 teaspoons (roughly 3–6 g) a day, added to food or drinks. ${PRACTITIONER}`,
    precautions: [
      'Start with a small amount; large amounts can upset the stomach.',
      'Consult a doctor before use if you are pregnant, or take blood-pressure, diabetes or thyroid medicine.',
    ],
    storage: 'Keep in an airtight, opaque container in a cool, dry place. Light and moisture fade its green colour.',
    faqs: [
      { q: 'What is Moringa called in Hindi?', a: 'Moringa is सहजन (Sahjan) in Hindi. It is also called drumstick leaves, Shevga (Marathi), Murungai (Tamil) and Munga.' },
      { q: 'How do I use Moringa powder?', a: 'Add 1–2 teaspoons to smoothies, juices, warm water, dal, soups or dough. It has a mild, grassy taste.' },
      { q: 'Is Moringa powder made from leaves or pods?', a: 'Mana Moringa powder is made from the leaves. The pods are the drumsticks used in cooking.' },
      { q: 'Why is Moringa powder green?', a: 'The bright green colour comes from the leaves. It fades with light and moisture, so store it in a closed, opaque container.' },
    ],
  },
}

export function getHerbContent(slug: string | null | undefined): HerbContent | null {
  if (!slug) return null
  return HERB_CONTENT[slug] ?? HERB_CONTENT[RENAMED_SLUGS[slug] ?? ''] ?? null
}
