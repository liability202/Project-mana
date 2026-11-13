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

  'amla': {
    title: 'Amla Powder',
    hindi: 'आंवला',
    botanical: 'Phyllanthus emblica (Emblica officinalis)',
    aka: ['Aonla', 'Amalaki', 'Indian Gooseberry', 'Amla Churna', 'Nellikai', 'Avla', 'Amla Fruit Powder'],
    seoTitle: 'Amla Powder (Indian Gooseberry) – Buy Pure Amla Churna Online',
    seoDescription: 'Buy pure Amla powder (Aonla, Amalaki, Indian gooseberry) online for daily use and hair care. Lab tested, packed fresh. How to use, typical amount and precautions.',
    intro: [
      'Amla (आंवला), also called Aonla, Amalaki or Indian Gooseberry, is the sour green fruit of Phyllanthus emblica. Dried and ground, it is one of the most widely used ingredients in Ayurveda — on its own and as one of the three fruits in Triphala.',
      'Mana Amla Powder is made from dried amla fruit and is naturally rich in vitamin C. Every batch is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Classed in Ayurveda as a rasayana, traditionally taken every day for general wellness and digestion.',
      'A staple of traditional hair care, mixed with Shikakai, Reetha and Bhringraj in hair packs and washes.',
      'One of the three fruits in Triphala, with Harad and Baheda.',
    ],
    howToUse: [
      'Mix into a glass of water, or take with honey.',
      'For hair, mix with water or curd into a paste, apply for 30 minutes and rinse; or add to a Shikakai–Reetha wash.',
    ],
    typicalAmount: `Traditionally about ½–1 teaspoon (roughly 3–5 g) once or twice a day. ${PRACTITIONER}`,
    precautions: [
      'Amla is sour and can aggravate acidity in some people — take after food if so.',
      'Check with your doctor if you take blood-thinning or diabetes medicine.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place. Amla powder absorbs moisture and hardens if left open.',
    faqs: [
      { q: 'What is Amla called in English?', a: 'Indian Gooseberry. In Hindi it is आंवला (Amla or Aonla), in Sanskrit Amalaki, and its botanical name is Phyllanthus emblica.' },
      { q: 'How do I take Amla powder?', a: 'Traditionally ½–1 teaspoon in water or with honey. It tastes sour and slightly bitter.' },
      { q: 'Can Amla powder be used for hair?', a: 'Yes — it is one of the most common traditional hair-care ingredients, used alone as a paste or with Shikakai, Reetha and Bhringraj.' },
      { q: 'Is Amla powder the same as Triphala?', a: 'No. Triphala is a blend of three fruits, of which Amla is one. Amla powder is Amla alone.' },
    ],
  },

  'amba-haldi': {
    title: 'Amba Haldi Powder',
    hindi: 'आम्बा हल्दी',
    botanical: 'Curcuma amada',
    aka: ['Aamba Haldi', 'Amba Halad', 'Mango Ginger', 'Mango Turmeric', 'Amra Haridra', 'Amba Haldi Churna'],
    seoTitle: 'Amba Haldi Powder (Mango Ginger) – Buy Pure Amba Haldi Online',
    seoDescription: 'Buy pure Amba Haldi powder (mango ginger, Curcuma amada) online. Lab tested, packed fresh to order. Traditional uses, how to use it and precautions.',
    intro: [
      'Amba Haldi (आम्बा हल्दी), also called Mango Ginger, is the rhizome of Curcuma amada — a relative of turmeric whose fresh root smells distinctly of raw mango. It is used in Indian cooking and in traditional home remedies.',
      'Mana Amba Haldi is a fine powder of the dried rhizome. Every batch is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally applied as a paste (lepa) over bruises and sprains in Ayurvedic home care.',
      'Traditionally taken in warm milk, much like turmeric, for general wellness and digestion.',
      'Used in homemade skin packs, and in pickles and chutneys for its mango-like aroma.',
    ],
    howToUse: [
      'Stir a small amount into warm milk with honey, or into warm water.',
      'For a paste, mix with water or warm milk and apply to the skin; rinse once dry.',
    ],
    typicalAmount: `Traditionally about ¼–½ teaspoon (roughly 1–2 g) in milk or water once a day. ${PRACTITIONER}`,
    precautions: [
      'Check with your doctor if you are pregnant, have gallbladder problems, or take blood-thinning medicine.',
      'Do a patch test before applying to the skin; like turmeric it can stain fabric.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place away from sunlight.',
    faqs: [
      { q: 'What is Amba Haldi in English?', a: 'Mango Ginger. Its botanical name is Curcuma amada; it is a relative of turmeric (Curcuma longa).' },
      { q: 'Is Amba Haldi the same as regular haldi or Kasturi Haldi?', a: 'No. Regular haldi is Curcuma longa and Kasturi Haldi is Curcuma aromatica. Amba Haldi (Curcuma amada) has a lighter colour and a raw-mango aroma.' },
      { q: 'How is Amba Haldi traditionally used for bruises?', a: 'It is mixed into a warm paste and applied over the area as a traditional home remedy. For any real injury, see a doctor.' },
      { q: 'Can Amba Haldi be taken with milk?', a: 'Yes — a small amount stirred into warm milk with honey is the common traditional way.' },
    ],
  },

  'arjun-chal': {
    title: 'Arjun Chhal Powder',
    hindi: 'अर्जुन छाल',
    botanical: 'Terminalia arjuna',
    aka: ['Arjun Chal', 'Arjun Ki Chhal', 'Arjuna Bark', 'Arjun Bark Powder', 'Arjuna Churna', 'Arjun Chaal'],
    seoTitle: 'Arjun Chhal Powder (Arjuna Bark) – Buy Pure Arjun Chal Online',
    seoDescription: 'Buy pure Arjun chhal (Arjuna bark, Terminalia arjuna) powder online. Lab tested, packed fresh to order. Traditional uses, how to prepare it and precautions.',
    intro: [
      'Arjun Chhal (अर्जुन छाल) is the bark of the Arjuna tree, Terminalia arjuna, a large tree that grows along rivers across India. It is one of the best-known barks in Ayurveda.',
      'Mana Arjun Chhal is a powder of the dried bark. Every batch is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally associated in Ayurveda with heart wellness (hridya).',
      'Classically prepared as Arjuna ksheerapaka — boiled in milk and water — or as a decoction with methi dana and saunf.',
    ],
    howToUse: [
      'Milk decoction: simmer the powder in a cup of milk and a cup of water until about one cup is left; strain and drink warm.',
      'Water decoction: boil in two cups of water, with a pinch of methi and saunf if you like, until reduced by half; strain.',
    ],
    typicalAmount: `Traditionally about 1 teaspoon (roughly 3–5 g) boiled into a decoction once or twice a day. ${PRACTITIONER}`,
    precautions: [
      'If you have a heart condition or take heart, blood-pressure, blood-thinning or diabetes medicine, use it only with your doctor\'s advice — never as a replacement for prescribed treatment.',
      'Avoid during pregnancy and breastfeeding unless advised by a doctor.',
      'Can cause constipation or stomach upset in some people.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place.',
    faqs: [
      { q: 'Is it Arjun Chal or Arjun Chhal?', a: 'Both spellings are used for अर्जुन छाल, the bark of the Arjuna tree (Terminalia arjuna). "Chhal" means bark.' },
      { q: 'How is Arjun Chhal traditionally taken?', a: 'As a decoction — boiled in milk and water (ksheerapaka) or in water with methi and saunf — then strained and drunk warm.' },
      { q: 'Can I take Arjun Chhal with my heart medicine?', a: 'Only with your doctor\'s approval. Arjun Chhal is a traditional herb, not a replacement for prescribed treatment, and it may interact with some medicines.' },
      { q: 'What does Arjun Chhal taste like?', a: 'Astringent and slightly bitter. Boiling it in milk makes it milder.' },
    ],
  },

  'chirata': {
    title: 'Chirata',
    hindi: 'चिरायता',
    botanical: 'Swertia chirayita',
    aka: ['Chirayita', 'Chirayata', 'Chiretta', 'Kirata', 'Kiratatikta', 'Chirata Herb'],
    seoTitle: 'Chirata (Chirayita) – Buy Pure Chirayata Herb Online',
    seoDescription: 'Buy pure Chirata (Chirayita, Swertia chirayita) herb online. Lab tested, packed fresh to order. How to prepare it, typical amount and precautions.',
    intro: [
      'Chirata (चिरायता), also spelt Chirayita or Chirayata, is the dried whole herb of Swertia chirayita, a plant from the Himalayan slopes. It is famous for being one of the most bitter herbs in Ayurveda — its Sanskrit name Kiratatikta means "the bitter one of the Kiratas".',
      'Every batch of Mana Chirata is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally taken as a bitter tonic (tikta rasa) for digestion and appetite.',
      'Commonly used in traditional routines for healthy blood sugar, often alongside Neem, Giloy, Karela seeds and Jamun guthli.',
    ],
    howToUse: [
      'Soak a small piece overnight in a glass of water and drink the strained water in the morning.',
      'Or boil in two cups of water until reduced by half, then strain and drink warm.',
    ],
    typicalAmount: `Traditionally a small pinch to about 1–2 g, soaked or boiled in water, once a day. It is very bitter — start small. ${PRACTITIONER}`,
    precautions: [
      'May lower blood sugar — if you take diabetes medicine, check with your doctor first.',
      'Avoid during pregnancy and breastfeeding, and if you have stomach ulcers.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place.',
    faqs: [
      { q: 'What is Chirata called in English?', a: 'Chiretta. In Hindi it is चिरायता (Chirayita or Chirata) and its botanical name is Swertia chirayita.' },
      { q: 'How do I prepare Chirata water?', a: 'Soak a small piece in a glass of water overnight and drink the strained water in the morning, or boil it into a decoction.' },
      { q: 'Why is Chirata so bitter?', a: 'Strong bitterness is natural for Chirata — it is the property it is traditionally valued for.' },
      { q: 'Can Chirata be taken with Karela and Jamun seeds?', a: 'They are often combined in traditional preparations. If you take diabetes medicine, ask your doctor first.' },
    ],
  },

  'gond-katira': {
    title: 'Gond Katira',
    hindi: 'गोंद कतीरा',
    botanical: 'Tragacanth gum (Astragalus species)',
    aka: ['Gond Kateera', 'Katira Gond', 'Tragacanth Gum', 'Gum Tragacanth', 'Badam Pisin', 'Kathira'],
    seoTitle: 'Gond Katira (Tragacanth Gum) – Buy Pure Gond Katira Online',
    seoDescription: 'Buy pure Gond Katira (tragacanth gum) online for summer drinks and desserts. Lab tested, packed fresh. How to soak it, typical amount and precautions.',
    intro: [
      'Gond Katira (गोंद कतीरा) is a natural edible gum, known in English as Tragacanth Gum. The dry crystals are hard and translucent; soaked in water they swell many times over into a soft, cooling jelly.',
      'It is a summer staple in Indian homes — in sherbets, falooda, milk and desserts. Every batch of Mana Gond Katira is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally taken in hot weather as a cooling food.',
      'Used in sherbets, rose and sabja drinks, falooda, kheer and other desserts.',
      'Naturally rich in soluble fibre.',
    ],
    howToUse: [
      'Soak a teaspoon of crystals in a large bowl of water for 6–8 hours or overnight until fully swollen into jelly.',
      'Add a spoonful of the jelly to cold milk, nimbu pani, rose sherbet or falooda; it pairs well with sabja or chia seeds.',
    ],
    typicalAmount: `Commonly about 1 teaspoon of dry crystals, soaked, per day. ${PRACTITIONER}`,
    precautions: [
      'Always soak fully before eating — never swallow the dry crystals — and drink plenty of water.',
      'Check with your doctor if you are pregnant or have digestive problems.',
    ],
    storage: 'Keep the dry crystals in an airtight container. Refrigerate soaked jelly and use within 2–3 days.',
    faqs: [
      { q: 'What is Gond Katira called in English?', a: 'Tragacanth Gum (gum tragacanth). It is also sold as Katira Gond or Gond Kateera.' },
      { q: 'Is Gond Katira the same as gond used in ladoos?', a: 'No. The gond used in winter ladoos (gond ke laddu) is usually acacia gum, which is fried. Gond Katira is a different, cooling gum that is soaked, not fried.' },
      { q: 'How long should Gond Katira be soaked?', a: 'At least 6–8 hours, or overnight, until it has fully swollen into a soft jelly. A teaspoon makes a large bowl.' },
      { q: 'Can I mix Gond Katira with sabja or chia seeds?', a: 'Yes — they are often combined in summer drinks.' },
    ],
  },

  'hibiscus-gudhal-sabut': {
    title: 'Hibiscus (Gudhal) Flowers',
    hindi: 'गुड़हल',
    botanical: 'Hibiscus rosa-sinensis',
    aka: ['Gudhal Phool', 'Gurhal', 'Jaswand', 'Japa Pushpa', 'China Rose', 'Dried Hibiscus Flowers', 'Shoe Flower'],
    seoTitle: 'Dried Hibiscus Flowers (Gudhal Phool) – Buy Online for Tea & Hair',
    seoDescription: 'Buy dried hibiscus flowers (Gudhal phool, Jaswand, Hibiscus rosa-sinensis) online for herbal tea and hair care. Lab tested, packed fresh to order.',
    intro: [
      'Gudhal (गुड़हल), also called Jaswand, Japa Pushpa or China Rose, is the red hibiscus, Hibiscus rosa-sinensis, found in gardens and temples across India. Its dried flowers are used for herbal tea and in traditional hair care.',
      'Mana Hibiscus Flowers are whole, naturally dried flowers. Every batch is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Brewed into a tart, deep-red herbal tea, often with rose petals or lemongrass.',
      'A traditional hair-care flower — boiled into hair oils or soaked to make hair rinses.',
    ],
    howToUse: [
      'Tea: steep 2–3 flowers in a cup of hot water for 5–7 minutes; strain and add honey or lemon.',
      'Hair oil: gently heat a handful of flowers in coconut oil, cool, strain and store.',
      'Hair rinse: soak flowers overnight, crush, strain and use the water after shampoo.',
    ],
    typicalAmount: `Commonly 1–2 cups of hibiscus tea a day. ${PRACTITIONER}`,
    precautions: [
      'Avoid during pregnancy.',
      'May lower blood pressure — check with your doctor if you take blood-pressure or diabetes medicine.',
    ],
    storage: 'Keep in an airtight container away from light and moisture to preserve the colour.',
    faqs: [
      { q: 'What is Gudhal called in English?', a: 'Hibiscus, or China Rose. Its botanical name is Hibiscus rosa-sinensis. In Marathi it is Jaswand.' },
      { q: 'How do I make hibiscus tea from dried flowers?', a: 'Steep 2–3 dried flowers in a cup of hot water for 5–7 minutes, strain, and add honey or lemon to taste.' },
      { q: 'Flowers or powder — which is better for hair?', a: 'Whole flowers are best for hair oils and rinses; Hibiscus Powder is easier for hair masks and packs.' },
      { q: 'Why does hibiscus tea turn red?', a: 'The natural pigments in the petals give the tea its deep red colour. Adding lemon turns it brighter.' },
    ],
  },

  'hibiscus-gudhal-powder': {
    title: 'Hibiscus (Gudhal) Powder',
    hindi: 'गुड़हल पाउडर',
    botanical: 'Hibiscus rosa-sinensis',
    aka: ['Gudhal Powder', 'Gurhal Powder', 'Jaswand Powder', 'Hibiscus Flower Powder', 'Japa Pushpa Churna', 'China Rose Powder'],
    seoTitle: 'Hibiscus Powder (Gudhal Powder) – Buy Pure Hibiscus for Hair Online',
    seoDescription: 'Buy pure hibiscus flower powder (Gudhal, Jaswand) online for hair masks and herbal drinks. Lab tested, packed fresh. How to use it and precautions.',
    intro: [
      'Hibiscus Powder is made from dried Gudhal (गुड़हल) flowers — the red hibiscus, Hibiscus rosa-sinensis, also called Jaswand or China Rose. Ground fine, it mixes easily into hair masks.',
      'Mana Hibiscus Powder is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'A traditional hair-care ingredient, mixed with Amla, Bhringraj and Shikakai in hair masks.',
      'Also used in herbal drinks and wellness preparations.',
    ],
    howToUse: [
      'Hair mask: mix 2–3 tablespoons with water, curd or aloe gel into a paste; apply to scalp and hair for 30–45 minutes, then rinse.',
      'Combine with Amla or Shikakai powder for a fuller hair pack.',
    ],
    typicalAmount: `For hair, 2–3 tablespoons per mask, depending on hair length. For drinks, a small pinch. ${PRACTITIONER}`,
    precautions: [
      'Do a patch test before applying to the scalp. It can tint very light hair slightly.',
      'If taking internally, avoid during pregnancy and check with your doctor if you take blood-pressure medicine.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place away from light.',
    faqs: [
      { q: 'How do I use hibiscus powder for hair?', a: 'Mix it with water, curd or aloe gel into a paste, apply to scalp and hair for 30–45 minutes, and rinse with water or a mild shampoo.' },
      { q: 'Can hibiscus powder be mixed with Amla and Shikakai?', a: 'Yes — that is a classic traditional hair-pack combination.' },
      { q: 'Will hibiscus powder colour my hair?', a: 'It can leave a faint reddish tint on very light or grey hair. It is not a hair dye.' },
      { q: 'What is Gudhal powder made from?', a: 'Dried flowers of the red hibiscus, Hibiscus rosa-sinensis.' },
    ],
  },

  'indigo-powder': {
    title: 'Indigo Powder',
    hindi: 'नील',
    botanical: 'Indigofera tinctoria',
    aka: ['Neel Powder', 'Nili', 'Indigo Leaf Powder', 'Natural Indigo Hair Dye', 'Indigo Hair Colour', 'Neeli'],
    seoTitle: 'Indigo Powder (Neel) – Buy Natural Indigo Leaf Powder for Hair',
    seoDescription: 'Buy natural Indigo leaf powder (Neel, Indigofera tinctoria) online for dark brown to black hair with henna. Lab tested. How to use it and precautions.',
    intro: [
      'Indigo Powder (नील, Neel) is made from the dried leaves of Indigofera tinctoria, the plant behind the famous Indian indigo dye. In hair care it is used after henna to turn the henna\'s red-orange into dark brown or black.',
      'Mana Indigo Powder is pure leaf powder with no added colours or chemicals, lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'A natural hair colourant, traditionally used in a two-step process with henna (mehendi).',
      'Often used alongside Amla, Bhringraj and Neem in herbal hair-care routines.',
    ],
    howToUse: [
      'Step 1: apply henna, leave for the usual time, then rinse with water only (no shampoo) and dry.',
      'Step 2: mix indigo with lukewarm water (a pinch of salt helps) into a yogurt-like paste, apply within 15–20 minutes of mixing, leave for 1–2 hours and rinse with water.',
      'Avoid shampoo for 24–48 hours — the colour deepens over two days.',
    ],
    typicalAmount: 'About 50–100 g for short hair and 100–200 g for long hair, used in the same quantity as the henna.',
    precautions: [
      'For external use only. Do a patch test 48 hours before full use.',
      'Not for eyebrows or eyelashes. Wear gloves — it stains skin and fabric.',
      'Used alone, without henna first, it can leave a blue or greenish tint, especially on grey hair.',
    ],
    storage: 'Keep dry in an airtight container away from light. Mix fresh each time — mixed indigo loses dye quickly.',
    faqs: [
      { q: 'Do I need henna before indigo?', a: 'For brown-to-black shades, yes. Henna first, then indigo. Indigo alone tends to give a blue or green tint.' },
      { q: 'Why should indigo be applied right after mixing?', a: 'Indigo\'s dye starts fading soon after it is mixed with water, so use it within 15–20 minutes.' },
      { q: 'How long does indigo take to show its colour?', a: 'The shade keeps deepening for 24–48 hours after rinsing. Avoid shampoo during that time.' },
      { q: 'What is Neel powder?', a: 'Neel (नील) is the Hindi name for indigo — the powdered leaves of Indigofera tinctoria.' },
    ],
  },

  'jamun-guthli': {
    title: 'Jamun Guthli Powder',
    hindi: 'जामुन गुठली',
    botanical: 'Syzygium cumini (seed)',
    aka: ['Jamun Seed Powder', 'Jamun Beej', 'Jamun Ki Guthli', 'Jambul Seed', 'Java Plum Seed', 'Black Plum Seed Powder'],
    seoTitle: 'Jamun Guthli Powder (Jamun Seed) – Buy Pure Jamun Beej Online',
    seoDescription: 'Buy pure Jamun guthli powder (jamun seed, Syzygium cumini) online. Lab tested, packed fresh to order. How to take it, typical amount and precautions.',
    intro: [
      'Jamun Guthli (जामुन गुठली) is the seed of the jamun fruit, Syzygium cumini — the purple Indian black plum, also called Jambul or Java Plum. The seeds are dried and ground into a fine powder.',
      'Every batch of Mana Jamun Guthli Powder is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally used in Ayurveda and Unani routines for healthy blood sugar.',
      'Often combined with Karela seeds, Methi, Neem and Chirata in traditional preparations.',
    ],
    howToUse: [
      'Mix into a glass of water and drink, traditionally on an empty stomach in the morning.',
      'Its taste is astringent and slightly bitter.',
    ],
    typicalAmount: `Traditionally about ½–1 teaspoon (roughly 3–5 g) once or twice a day. ${PRACTITIONER}`,
    precautions: [
      'May lower blood sugar — if you take diabetes medicine, use it only with your doctor\'s advice and monitor your levels.',
      'Avoid during pregnancy and breastfeeding unless advised by a doctor.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place.',
    faqs: [
      { q: 'What is Jamun Guthli?', a: 'The seed (guthli) of the jamun fruit, Syzygium cumini, dried and powdered. In English it is jamun or jambul seed powder.' },
      { q: 'How do I take Jamun seed powder?', a: 'Traditionally ½–1 teaspoon mixed into water, usually in the morning before food.' },
      { q: 'Can I take Jamun Guthli with my diabetes medicine?', a: 'Only with your doctor\'s advice. It is a traditional herb, not a replacement for prescribed treatment.' },
      { q: 'Can Jamun Guthli be mixed with Karela and Methi?', a: 'They are commonly combined in traditional preparations. Ask a practitioner about amounts.' },
    ],
  },

  'karela-seeds': {
    title: 'Karela Seeds',
    hindi: 'करेला बीज',
    botanical: 'Momordica charantia (seed)',
    aka: ['Karela Beej', 'Bitter Gourd Seeds', 'Bitter Melon Seeds', 'Karele Ke Beej', 'Karela Seed Powder'],
    seoTitle: 'Karela Seeds (Bitter Gourd Seeds) – Buy Karela Beej Online',
    seoDescription: 'Buy Karela seeds (Karela beej, bitter gourd seeds, Momordica charantia) online. Lab tested, packed fresh to order. How to use them and precautions.',
    intro: [
      'Karela Seeds (करेला बीज) are the dried seeds of bitter gourd, Momordica charantia — the same vegetable cooked in Indian kitchens. They are used in traditional herbal preparations.',
      'Every batch of Mana Karela Seeds is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally used in routines for healthy blood sugar and metabolism.',
      'Often combined with Jamun seed powder, Neem and Chirata in traditional formulations.',
    ],
    howToUse: [
      'Dry-roast lightly and grind into a powder; mix a small amount with water.',
      'Or add to a traditional blend with Jamun guthli and Methi powder.',
    ],
    typicalAmount: `Traditionally a small amount — about ¼–½ teaspoon of powder once a day. ${PRACTITIONER}`,
    precautions: [
      'May lower blood sugar — if you take diabetes medicine, use only with your doctor\'s advice.',
      'Avoid during pregnancy and breastfeeding, and do not give to children.',
      'People with G6PD deficiency should avoid bitter gourd seeds.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place.',
    faqs: [
      { q: 'What are Karela seeds called in English?', a: 'Bitter gourd or bitter melon seeds. The botanical name is Momordica charantia.' },
      { q: 'How are Karela seeds used?', a: 'Usually lightly roasted, powdered, and a small amount taken with water, often in a blend with Jamun seed and Methi.' },
      { q: 'Who should not take Karela seeds?', a: 'Pregnant or breastfeeding women, children, people with G6PD deficiency, and anyone on diabetes medicine without their doctor\'s advice.' },
      { q: 'Can Karela seeds be sown?', a: 'These seeds are packed for consumption, not as certified planting seed.' },
    ],
  },

  'kasturi-haldi': {
    title: 'Kasturi Haldi Powder',
    hindi: 'कस्तूरी हल्दी',
    botanical: 'Curcuma aromatica',
    aka: ['Kasturi Manjal', 'Kasthuri Manjal', 'Wild Turmeric', 'Aromatic Turmeric', 'Vana Haridra', 'Kasturi Turmeric'],
    seoTitle: 'Kasturi Haldi (Wild Turmeric) – Buy Pure Kasturi Manjal Powder',
    seoDescription: 'Buy pure Kasturi Haldi powder (Kasturi manjal, wild turmeric, Curcuma aromatica) online for face packs. Lab tested. How to use it and precautions.',
    intro: [
      'Kasturi Haldi (कस्तूरी हल्दी), known in the south as Kasturi Manjal, is wild turmeric — Curcuma aromatica. Unlike kitchen turmeric it is not used in cooking: it is a beauty ingredient, prized for its fragrance and for face packs.',
      'Mana Kasturi Haldi is a fine powder, lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'A traditional face-pack and bathing ingredient, used for a clear, glowing look.',
      'Mixed with rose water, milk, curd or sandalwood powder in beauty rituals.',
    ],
    howToUse: [
      'Mix ½–1 teaspoon with rose water, milk or curd into a smooth paste.',
      'Apply to clean skin, leave for 10–15 minutes and rinse with water.',
    ],
    typicalAmount: 'For a face pack, about ½–1 teaspoon per use, 2–3 times a week.',
    precautions: [
      'For external use. Do a patch test before first use and keep away from the eyes.',
      'It stains much less than kitchen turmeric, but may still tint fabric.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place away from sunlight.',
    faqs: [
      { q: 'What is the difference between Kasturi Haldi and normal haldi?', a: 'Normal haldi is Curcuma longa, used in cooking. Kasturi Haldi is wild turmeric (Curcuma aromatica), used on the skin — it is more fragrant and stains much less.' },
      { q: 'Can Kasturi Haldi be eaten?', a: 'It is traditionally used externally, not in cooking. Use regular haldi for food.' },
      { q: 'How do I make a Kasturi Haldi face pack?', a: 'Mix ½–1 teaspoon with rose water, milk or curd, apply for 10–15 minutes and rinse.' },
      { q: 'What is Kasturi Manjal?', a: 'Kasturi Manjal is the Tamil name for Kasturi Haldi — the same wild turmeric.' },
    ],
  },

  'kaunch-beej': {
    title: 'Kaunch Beej',
    hindi: 'कौंच बीज',
    botanical: 'Mucuna pruriens',
    aka: ['Koch Beej', 'Konch Beej', 'Kawach Beej', 'Kapikacchu', 'Velvet Bean', 'Kaunch Seeds'],
    seoTitle: 'Kaunch Beej (Kapikacchu, Velvet Bean) – Buy Konch Beej Online',
    seoDescription: 'Buy Kaunch beej (Konch beej, Kapikacchu, Mucuna pruriens seeds) online. Lab tested, packed fresh to order. Traditional uses, how to use and precautions.',
    intro: [
      'Kaunch Beej (कौंच बीज), also spelt Konch, Koch or Kawach Beej, are the seeds of Mucuna pruriens — the velvet bean, called Kapikacchu in Ayurveda. They are one of the classic vitality herbs.',
      'Every batch of Mana Kaunch Beej is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally taken in Ayurveda for strength, stamina and vitality.',
      'Often combined with Ashwagandha, Safed Musli and Shatavari in traditional preparations.',
      'In traditional practice the seeds are usually purified (boiled in milk, then dried and powdered) before use.',
    ],
    howToUse: [
      'Use the powdered seed in warm milk with honey or mishri.',
      'Traditionally the seeds are boiled in milk, dried and ground before use.',
    ],
    typicalAmount: `Traditionally about ½ teaspoon (roughly 2–3 g) of powdered seed once or twice a day. ${PRACTITIONER}`,
    precautions: [
      'Contains natural L-dopa. Do not use with Parkinson\'s medicine, antidepressants (especially MAO inhibitors) or if you have a mental-health condition, unless your doctor approves.',
      'Avoid during pregnancy and breastfeeding.',
      'Check with your doctor if you have diabetes, heart disease or low blood pressure.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place.',
    faqs: [
      { q: 'Is it Kaunch, Konch or Koch Beej?', a: 'All three are spellings of कौंच बीज, the seeds of Mucuna pruriens (velvet bean), called Kapikacchu in Sanskrit.' },
      { q: 'How is Kaunch Beej traditionally taken?', a: 'As a powder in warm milk with honey or mishri, usually after the seeds have been purified by boiling in milk.' },
      { q: 'Who should avoid Kaunch Beej?', a: 'Pregnant or breastfeeding women, and anyone on Parkinson\'s medicine, antidepressants or with a mental-health condition, unless their doctor approves.' },
      { q: 'Are the pods itchy?', a: 'The pod hairs of the plant cause intense itching. Mana sells only the cleaned seeds.' },
    ],
  },

  'mulethi': {
    title: 'Mulethi',
    hindi: 'मुलेठी',
    botanical: 'Glycyrrhiza glabra',
    aka: ['Mulethi Powder', 'Mulethi Root', 'Licorice Root', 'Liquorice', 'Yashtimadhu', 'Jethimadh', 'Mulhatti'],
    seoTitle: 'Mulethi (Licorice Root) – Buy Pure Mulethi / Yashtimadhu Online',
    seoDescription: 'Buy pure Mulethi (licorice root, Yashtimadhu, Glycyrrhiza glabra) online for herbal tea and throat comfort. Lab tested. How to use it and precautions.',
    intro: [
      'Mulethi (मुलेठी), also called Licorice root, Yashtimadhu or Jethimadh, is the dried root of Glycyrrhiza glabra. It is naturally sweet — Yashtimadhu means "sweet stick".',
      'Every batch of Mana Mulethi is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally used for throat comfort and in winter herbal teas and kadha.',
      'Often combined with Tulsi and ginger in traditional preparations.',
    ],
    howToUse: [
      'Chew a small piece of the root slowly, or simmer a small amount in water as tea or kadha.',
      'Powder can be taken with honey or mixed into warm water.',
    ],
    typicalAmount: `Traditionally a small amount — about ¼–½ teaspoon (1–3 g) a day, for short periods only. ${PRACTITIONER}`,
    precautions: [
      'Do not take regularly or for long periods. Large amounts can raise blood pressure and lower potassium.',
      'Avoid if you have high blood pressure, heart or kidney disease, or low potassium, and during pregnancy.',
      'Check with your doctor if you take blood-pressure medicine, diuretics, steroids or heart medicine.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place.',
    faqs: [
      { q: 'What is Mulethi called in English?', a: 'Licorice (liquorice) root. In Sanskrit it is Yashtimadhu, in Gujarati Jethimadh; its botanical name is Glycyrrhiza glabra.' },
      { q: 'How is Mulethi used for the throat?', a: 'Traditionally a small piece is chewed slowly, or it is simmered into a tea or kadha with Tulsi and ginger.' },
      { q: 'Can Mulethi be taken every day?', a: 'Only in small amounts for short periods. Long-term or large use can raise blood pressure. Ask a doctor if unsure.' },
      { q: 'Why is Mulethi sweet?', a: 'The root naturally contains glycyrrhizin, which is much sweeter than sugar.' },
    ],
  },

  'neem-powder': {
    title: 'Neem Powder',
    hindi: 'नीम',
    botanical: 'Azadirachta indica (leaf)',
    aka: ['Neem Leaf Powder', 'Neem Patta Powder', 'Nimba', 'Margosa', 'Indian Lilac', 'Neem Churna'],
    seoTitle: 'Neem Powder (Neem Leaf Powder) – Buy Pure Neem for Skin & Hair',
    seoDescription: 'Buy pure Neem leaf powder (Nimba, Azadirachta indica) online for face packs and hair masks. Lab tested, packed fresh. How to use it and precautions.',
    intro: [
      'Neem (नीम), Azadirachta indica, is called the "village pharmacy" of India — nearly every part of the tree has a traditional use. Neem powder is made from its dried leaves.',
      'Mana Neem Powder is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'A traditional face-pack and skin-care ingredient, often mixed with Multani Mitti, Tulsi or aloe vera.',
      'Used in hair masks and scalp care.',
      'Neem leaves are also traditionally added to bath water.',
    ],
    howToUse: [
      'Face pack: mix 1 teaspoon with rose water or water (and Multani Mitti if you like), apply for 10–15 minutes and rinse.',
      'Hair mask: mix with water, curd or aloe gel, apply to the scalp for 20–30 minutes and wash.',
    ],
    typicalAmount: 'For a face pack, about 1 teaspoon; for a hair mask, 2–3 tablespoons. Do not take neem internally except on a practitioner\'s advice.',
    precautions: [
      'Do a patch test before first use and keep away from the eyes.',
      'Do not swallow, or give to children, unless a practitioner advises it. Avoid internal use during pregnancy or if trying to conceive.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place.',
    faqs: [
      { q: 'How do I make a Neem face pack?', a: 'Mix 1 teaspoon of Neem powder with rose water or water — add Multani Mitti for oily skin — apply for 10–15 minutes and rinse.' },
      { q: 'Can Neem powder be used on hair?', a: 'Yes, mixed with water, curd or aloe gel as a scalp mask, then washed off after 20–30 minutes.' },
      { q: 'Can I eat Neem powder?', a: 'Only on the advice of a qualified practitioner. It is very bitter and not suitable for children, pregnancy or anyone trying to conceive.' },
      { q: 'What is Neem called in English?', a: 'Neem is also called Margosa or Indian Lilac; its botanical name is Azadirachta indica.' },
    ],
  },

  'paneer-doda': {
    title: 'Paneer Doda',
    hindi: 'पनीर डोडा',
    botanical: 'Withania coagulans',
    aka: ['Paneer Phool', 'Paneer Ke Phool', 'Paneer Dodi', 'Indian Rennet', 'Vegetable Rennet', 'Rishyagandha'],
    seoTitle: 'Paneer Doda (Paneer Phool) – Buy Pure Withania Coagulans Online',
    seoDescription: 'Buy pure Paneer Doda (Paneer phool, Indian rennet, Withania coagulans) online. Lab tested, packed fresh to order. How to use it and precautions.',
    intro: [
      'Paneer Doda (पनीर डोडा), also called Paneer Phool or Indian Rennet, is the dried fruit of Withania coagulans — a close relative of Ashwagandha. Its name comes from its ability to curdle milk, a use that gave it the name "vegetable rennet".',
      'Every batch of Mana Paneer Doda is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Traditionally soaked overnight and the water drunk in the morning, as part of routines for healthy blood sugar.',
      'Used in herbal decoctions and blended with other Ayurvedic herbs.',
      'Traditionally used to curdle milk for cheese.',
    ],
    howToUse: [
      'Soak 5–7 pieces in a glass of water overnight; strain and drink the water in the morning on an empty stomach.',
      'Or boil into a decoction and strain.',
    ],
    typicalAmount: `Traditionally 5–7 pieces soaked in a glass of water, once a day. ${PRACTITIONER}`,
    precautions: [
      'May lower blood sugar — if you take diabetes medicine, use only with your doctor\'s advice.',
      'Avoid during pregnancy and breastfeeding.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place.',
    faqs: [
      { q: 'What is Paneer Doda?', a: 'The dried fruit of Withania coagulans, also called Paneer Phool or Indian Rennet. It is related to Ashwagandha (Withania somnifera).' },
      { q: 'How do I take Paneer Doda water?', a: 'Soak 5–7 pieces in a glass of water overnight, then strain and drink the water in the morning.' },
      { q: 'Why is it called Paneer Doda?', a: 'Because it can curdle milk — it was traditionally used as a vegetarian rennet to make paneer and cheese.' },
      { q: 'Can I take Paneer Doda with diabetes medicine?', a: 'Only with your doctor\'s advice. It is not a replacement for prescribed treatment.' },
    ],
  },

  'reetha': {
    title: 'Reetha Powder',
    hindi: 'रीठा',
    botanical: 'Sapindus mukorossi',
    aka: ['Ritha', 'Aritha', 'Soapnut', 'Soap Nut', 'Soapberry', 'Washnut', 'Reetha Powder'],
    seoTitle: 'Reetha Powder (Ritha, Soapnut) – Buy Pure Aritha Online',
    seoDescription: 'Buy pure Reetha powder (Ritha, Aritha, soapnut, Sapindus mukorossi) online — a natural hair cleanser. Lab tested, packed fresh. How to use and precautions.',
    intro: [
      'Reetha (रीठा), also spelt Ritha or Aritha, is the soapnut — the dried fruit of Sapindus mukorossi. Its shell is rich in natural saponins, which foam in water and clean gently. It has been India\'s traditional shampoo and laundry soap for generations.',
      'Mana Reetha Powder is made from dried soapnuts, lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'A traditional hair and scalp cleanser, usually combined with Shikakai and Amla.',
      'Mixed with Neem as a natural soap, and used for washing delicate fabrics and silver.',
    ],
    howToUse: [
      'Hair wash: mix 1–2 tablespoons with water into a runny paste (add Shikakai and Amla if you like), massage into wet hair and rinse well.',
      'Liquid shampoo: soak the powder in warm water for a few hours or boil briefly, cool, strain and use.',
    ],
    typicalAmount: 'About 1–2 tablespoons per hair wash, depending on hair length.',
    precautions: [
      'For external use only — do not eat.',
      'Keep away from the eyes; it stings. Rinse with plenty of water if it gets in.',
      'Can feel drying on some hair — oil your hair before washing, or add Amla.',
    ],
    storage: 'Keep in an airtight container in a dry place.',
    faqs: [
      { q: 'What is Reetha called in English?', a: 'Soapnut, soapberry or washnut. Its botanical name is Sapindus mukorossi. Ritha and Aritha are other Hindi spellings.' },
      { q: 'Why does Reetha foam?', a: 'Soapnut shells contain natural saponins, which lather in water — that is what makes Reetha a natural cleanser.' },
      { q: 'How do I wash my hair with Reetha?', a: 'Mix 1–2 tablespoons with water (often with Shikakai and Amla), massage into wet hair and scalp, and rinse thoroughly.' },
      { q: 'Can Reetha be used for laundry?', a: 'Yes — it is traditionally used to wash woollens, silks and delicate fabrics.' },
    ],
  },

  'rose': {
    title: 'Rose Petal Powder',
    hindi: 'गुलाब',
    botanical: 'Rosa species (rose petals)',
    aka: ['Gulab Powder', 'Gulab Pankhuri', 'Gulab Patti', 'Rose Petals', 'Dried Rose Petals', 'Rose Powder'],
    seoTitle: 'Rose Petal Powder (Gulab Powder) – Buy Pure Rose for Face Packs',
    seoDescription: 'Buy pure rose petal powder (Gulab powder, Gulab pankhuri) online for face packs and hair mixes. Lab tested, packed fresh. How to use it and precautions.',
    intro: [
      'Rose Petal Powder is made from dried gulab (गुलाब) petals and keeps their natural fragrance. It is a classic Indian beauty ingredient.',
      'Mana Rose Petal Powder is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'A traditional face-pack ingredient, mixed with rose water, Multani Mitti, sandalwood or curd.',
      'Added to herbal hair-care mixes for fragrance.',
    ],
    howToUse: [
      'Face pack: mix 1 teaspoon with rose water or curd (add Multani Mitti or sandalwood if you like), apply for 10–15 minutes and rinse.',
      'Add a spoonful to herbal hair masks.',
    ],
    typicalAmount: 'About 1 teaspoon per face pack, 2–3 times a week.',
    precautions: [
      'Do a patch test before first use, especially if you have sensitive skin.',
      'Keep away from the eyes.',
    ],
    storage: 'Keep in an airtight container away from light and moisture to keep the colour and fragrance.',
    faqs: [
      { q: 'How do I make a rose face pack?', a: 'Mix 1 teaspoon of rose petal powder with rose water or curd — add Multani Mitti for oily skin or sandalwood for fragrance — apply for 10–15 minutes and rinse.' },
      { q: 'Can rose petal powder be used in hair masks?', a: 'Yes, it is often added to herbal hair packs for its fragrance.' },
      { q: 'What is Gulab Pankhuri?', a: 'Gulab pankhuri means rose petals in Hindi. Mana grinds the dried petals into a fine powder.' },
      { q: 'Does rose powder smell of rose?', a: 'Yes — dried petals keep a natural, soft rose fragrance, which fades if stored open.' },
    ],
  },

  'rosemary': {
    title: 'Rosemary Powder',
    hindi: 'रोज़मेरी',
    botanical: 'Salvia rosmarinus (Rosmarinus officinalis)',
    aka: ['Rosemary Leaf Powder', 'Rosemary Leaves', 'Dried Rosemary', 'Rosemary for Hair', 'Rusmari'],
    seoTitle: 'Rosemary Powder – Buy Pure Rosemary Leaf Powder for Hair Online',
    seoDescription: 'Buy pure rosemary leaf powder (Salvia rosmarinus) online for hair masks, rosemary water and herbal tea. Lab tested, packed fresh. How to use and precautions.',
    intro: [
      'Rosemary (रोज़मेरी) is a fragrant Mediterranean herb, Salvia rosmarinus (formerly Rosmarinus officinalis). It has become one of the most popular natural hair-care herbs in India.',
      'Mana Rosemary Powder is made from dried rosemary leaves, lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Used in hair masks, rosemary water and herbal hair oils for scalp care and healthy-looking hair.',
      'Often combined with Bhringraj, Amla, Reetha and Shikakai.',
      'Also brewed as a herbal tea and used as a culinary herb.',
    ],
    howToUse: [
      'Rosemary water: simmer 1–2 teaspoons in two cups of water for 10 minutes, cool, strain into a spray bottle and use on the scalp. Refrigerate and use within a week.',
      'Hair mask: mix with Amla, Shikakai or curd into a paste, apply for 20–30 minutes and rinse.',
      'Tea: steep a small pinch in hot water for 5 minutes.',
    ],
    typicalAmount: 'For hair, 1–2 teaspoons per batch of rosemary water or mask. As tea, a small pinch per cup.',
    precautions: [
      'Do a patch test before using on the scalp.',
      'Avoid concentrated or medicinal amounts during pregnancy, and check with your doctor if you have epilepsy or take blood-thinning medicine.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place to retain its aroma.',
    faqs: [
      { q: 'How do I make rosemary water for hair?', a: 'Simmer 1–2 teaspoons of rosemary powder in two cups of water for about 10 minutes, cool, strain and spray onto the scalp. Keep it in the fridge and use within a week.' },
      { q: 'Can rosemary be mixed with Amla and Shikakai?', a: 'Yes — it is often added to traditional Indian hair packs with Amla, Shikakai, Reetha and Bhringraj.' },
      { q: 'Can rosemary powder be used in cooking?', a: 'Yes, rosemary is a culinary herb — use a small pinch in soups, breads and roasted vegetables.' },
      { q: 'Is rosemary powder the same as rosemary oil?', a: 'No. The powder is ground dried leaves. Rosemary essential oil is a concentrated extract and must be diluted before use.' },
    ],
  },

  'safed-musli': {
    title: 'Safed Musli',
    hindi: 'सफ़ेद मूसली',
    botanical: 'Chlorophytum borivilianum',
    aka: ['Safed Musli Powder', 'Shweta Musli', 'White Musli', 'Dholi Musli', 'Safed Moosli', 'Musli Root'],
    seoTitle: 'Safed Musli – Buy Pure Safed Musli (Chlorophytum borivilianum) Online',
    seoDescription: 'Buy pure Safed Musli (Shweta musli, white musli, Chlorophytum borivilianum) online. Lab tested, packed fresh to order. How to take it and precautions.',
    intro: [
      'Safed Musli (सफ़ेद मूसली), also called Shweta Musli or White Musli, is the dried white root of Chlorophytum borivilianum. It is one of the most valued vitality herbs in Ayurveda.',
      'Every batch of Mana Safed Musli is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'Classed as a rasayana and vajikarana herb, traditionally taken for stamina, strength and vitality.',
      'Often combined with Ashwagandha, Shatavari and Kaunch Beej in traditional preparations.',
    ],
    howToUse: [
      'Mix the powder into warm milk with honey or mishri, or take with a little ghee.',
      'Grind whole roots to powder before use.',
    ],
    typicalAmount: `Traditionally about ½–1 teaspoon (roughly 3–5 g) once or twice a day. ${PRACTITIONER}`,
    precautions: [
      'It is heavy to digest — start with a small amount; it can cause bloating in some people.',
      'Consult a doctor before use if you are pregnant or breastfeeding, have diabetes, or take regular medicine.',
    ],
    storage: 'Keep in an airtight container in a cool, dry place.',
    faqs: [
      { q: 'What is Safed Musli?', a: 'The dried white root of Chlorophytum borivilianum, also called Shweta or White Musli — a traditional Ayurvedic vitality herb.' },
      { q: 'How is Safed Musli traditionally taken?', a: 'As a powder in warm milk with honey or mishri, often combined with Ashwagandha and Shatavari.' },
      { q: 'Can Safed Musli be taken with Ashwagandha?', a: 'They are commonly combined in traditional preparations. Ask a practitioner about amounts if you have a health condition.' },
      { q: 'Why is Safed Musli white?', a: 'The peeled, dried roots are naturally white to creamy — that is where the name "safed" (white) comes from.' },
    ],
  },

  'shikakai': {
    title: 'Shikakai Powder',
    hindi: 'शिकाकाई',
    botanical: 'Acacia concinna (Senegalia rugata)',
    aka: ['Sheekakai', 'Shikakai Powder', 'Soap Pod', 'Acacia Concinna', 'Seeyakkai', 'Shikakai Phali'],
    seoTitle: 'Shikakai Powder – Buy Pure Shikakai (Acacia Concinna) for Hair',
    seoDescription: 'Buy pure Shikakai powder (Acacia concinna, soap pod) online — a natural hair cleanser. Lab tested, packed fresh. How to use it with Reetha and Amla.',
    intro: [
      'Shikakai (शिकाकाई) means "fruit for hair". It is the dried pod of Acacia concinna, a climbing shrub, and has been used in India as a mild, natural hair cleanser for centuries.',
      'Mana Shikakai Powder is lab tested and packed fresh to order.',
    ],
    traditionalUses: [
      'A traditional shampoo that cleans without stripping the scalp\'s natural oils.',
      'Classically combined with Reetha and Amla as a complete herbal hair wash.',
    ],
    howToUse: [
      'Hair wash: mix 1–2 tablespoons with water into a runny paste, massage into wet scalp and hair, and rinse well.',
      'Liquid wash: soak Shikakai, Reetha and Amla overnight or boil briefly, cool, strain and use as shampoo.',
      'Hair mask: mix with curd or aloe gel and apply for 20–30 minutes before rinsing.',
    ],
    typicalAmount: 'About 1–2 tablespoons per wash, depending on hair length.',
    precautions: [
      'For external use only.',
      'Keep away from the eyes; it stings.',
      'Can feel drying for some hair types — oil hair beforehand or mix with Amla.',
    ],
    storage: 'Keep in an airtight container in a dry place.',
    faqs: [
      { q: 'What does Shikakai mean?', a: '"Fruit for hair". It is the dried pod of Acacia concinna.' },
      { q: 'How do I use Shikakai with Reetha and Amla?', a: 'Mix the three powders with water into a paste or soak them overnight to make a liquid wash, then use it like shampoo.' },
      { q: 'Does Shikakai foam like shampoo?', a: 'It foams lightly. Adding Reetha gives more lather.' },
      { q: 'Can Shikakai be used every day?', a: 'Many people use it 2–3 times a week. If your hair feels dry, oil it before washing.' },
    ],
  },
}

// The same product listed twice in the catalogue shares one guide.
HERB_CONTENT['gond-katira-1'] = HERB_CONTENT['gond-katira']

export function getHerbContent(slug: string | null | undefined): HerbContent | null {
  if (!slug) return null
  return HERB_CONTENT[slug] ?? HERB_CONTENT[RENAMED_SLUGS[slug] ?? ''] ?? null
}
