/**
 * Long-form content for kit pages, keyed by kit slug — the kit equivalent of
 * lib/herb-content.ts. Same rules: describe traditional use, never promise to
 * treat or prevent a disease, keep amounts consistent with the herb guides,
 * and point to a doctor where it matters.
 *
 * `description`, `benefits`, `howToUse` and `itemRoles` are also written into
 * the database (the kit's own fields, which the kit builder and listings
 * show), so the admin panel and the page say the same thing.
 */

import type { HerbFaq } from '@/lib/herb-content'

export type KitContent = {
  title: string
  /** Other ways people search for this kit. */
  aka: string[]
  seoTitle: string
  seoDescription: string
  /** Short description stored on the kit (shown at the top and on kit cards). */
  description: string
  /** Three short points for the kit builder's "Benefits" tab. */
  benefits: string[]
  /** Plain-text routine for the kit builder's "How to Use" tab. */
  howToUse: string
  /** What each item does in the kit, keyed by product slug. */
  itemRoles: Record<string, string>
  intro: string[]
  routine: string[]
  whoFor: string[]
  precautions: string[]
  storage: string
  faqs: HerbFaq[]
  /** Show the "not medical advice" note (kits with herbs taken internally). */
  medicalNote?: boolean
}

export const KIT_CONTENT: Record<string, KitContent> = {
  'super-seeds-combo-pack': {
    title: 'Super Seeds Combo Pack',
    aka: ['Mixed Seeds Combo', 'Healthy Seeds Mix', 'Pumpkin Sunflower Chia Flax Seeds Combo', '5 Seeds Pack', 'Magaz Seeds Combo'],
    seoTitle: 'Super Seeds Combo – Pumpkin, Sunflower, Chia, Flax & Muskmelon Seeds',
    seoDescription: 'Five everyday seeds in one combo: pumpkin, sunflower, chia, flax (alsi) and muskmelon (magaz). Whole or ground, lab tested, packed fresh. How to use them daily.',
    description: 'Five everyday seeds in one pack: pumpkin, sunflower, chia, flax (alsi) and muskmelon (magaz) seeds. Together they add plant protein, fibre and healthy fats to breakfast, salads and snacks. Choose whole seeds, or ground for smoothies and atta. Lab tested and packed fresh, in 100 g, 200 g or 400 g of each seed.',
    benefits: ['Five seeds, one pack: plant protein, fibre & healthy fats', 'Easy to add to breakfast, salads, smoothies & atta', 'Choose whole or ground, in three sizes'],
    howToUse: '1. Mix the seeds and keep in a jar; use 1–2 tablespoons a day. 2. Chia: soak 1 teaspoon in water or milk for 20 minutes before eating. 3. Flax: best ground — add to smoothies, curd or roti atta. 4. Pumpkin, sunflower and muskmelon: eat as they are, or dry-roast lightly for 3–4 minutes. 5. Sprinkle on oats, poha, salads or raita.',
    itemRoles: {
      'pumpkin-seeds': 'Crunchy, mild — plant protein & magnesium',
      'sunflower-seeds': 'Nutty snack seed — vitamin E',
      'chia-seeds': 'Soaks into gel — fibre & omega-3',
      'flax-seeds': 'Alsi — best ground; fibre & omega-3',
      'muskmelon-seeds': 'Magaz — mild, used in sweets & thandai',
    },
    intro: [
      'The Super Seeds Combo puts five of the most useful everyday seeds in one pack: pumpkin, sunflower, chia, flax (alsi) and muskmelon (magaz) seeds. Each brings something different — protein and minerals from pumpkin and sunflower, fibre and omega-3 from chia and flax, and the mild sweetness of magaz used in Indian sweets and thandai.',
      'Order them whole for snacking and toppings, or ground for smoothies, curd and atta. Every batch is lab tested and packed fresh to order.',
    ],
    routine: [
      'Morning: stir 1 tablespoon of the mix into oats, poha, curd or a smoothie.',
      'Chia: soak 1 teaspoon in water or milk for 20 minutes until it turns to gel.',
      'Flax: grind before eating (or order the ground form) — whole flax often passes through undigested.',
      'Snack: a small handful of lightly roasted pumpkin, sunflower and magaz seeds.',
      'Baking: add ground seeds to roti atta, laddoos or homemade granola.',
    ],
    whoFor: [
      'Anyone wanting an easy daily source of plant protein, fibre and healthy fats.',
      'Vegetarian and fitness-focused diets.',
      'Families who want healthier toppings for breakfast and snacks.',
    ],
    precautions: [
      'Always soak chia seeds or take them with plenty of liquid — never eat a spoonful dry.',
      'Seeds are high in fibre: start with a small amount and drink enough water.',
      'Avoid if you are allergic to any of these seeds. If you take blood-thinning medicine, ask your doctor before eating flax daily.',
    ],
    storage: 'Keep in airtight jars in a cool, dark place. Seeds are rich in natural oils; refrigerate in hot months, and use ground seeds within a few weeks.',
    faqs: [
      { q: 'How much of the seed mix should I eat a day?', a: '1–2 tablespoons a day is a common amount. Start with less if you are not used to high-fibre foods.' },
      { q: 'Whole or ground — which should I choose?', a: 'Whole keeps longer and is best for snacking and toppings. Ground is easier to digest (especially flax) and mixes into smoothies and atta, but use it within a few weeks.' },
      { q: 'Do I need to soak chia seeds?', a: 'Yes — soak them in water or milk for about 20 minutes, or add them to a drink, so they swell before you eat them.' },
      { q: 'What are muskmelon (magaz) seeds?', a: 'Peeled seeds of the kharbooja (muskmelon). They are mild and slightly sweet, and used in Indian sweets, thandai and as a snack.' },
    ],
  },

  'cool-summer-kit': {
    title: 'Cool Summer Kit',
    aka: ['Summer Cooling Kit', 'Gond Katira Sabja Chia Combo', 'Summer Drinks Kit', 'Cooling Seeds Combo', 'Falooda Seeds Kit'],
    seoTitle: 'Cool Summer Kit – Gond Katira, Sabja & Chia Seeds for Summer Drinks',
    seoDescription: 'Gond Katira, Sabja (basil) seeds and Chia seeds in one summer kit for cooling sherbets, rose milk, nimbu pani and falooda. Lab tested, packed fresh. How to soak each.',
    description: 'Three traditional summer coolers in one kit: Gond Katira (tragacanth gum), Sabja (sweet basil) seeds and Chia seeds. Each swells into a soft jelly when soaked — add to sherbet, rose milk, nimbu pani, lassi or falooda for a cooling summer drink. Lab tested and packed fresh, in 150 g or 300 g of each.',
    benefits: ['Three classic summer coolers in one kit', 'Soak, swell & add to any summer drink', 'Gond Katira, Sabja & Chia — 150 g or 300 g each'],
    howToUse: '1. Gond Katira: soak 1 teaspoon of crystals in a large bowl of water overnight (6–8 hours) until it turns to soft jelly. 2. Sabja: soak 1–2 teaspoons in water for 15 minutes. 3. Chia: soak 1–2 teaspoons in water or milk for 20 minutes. 4. Add a spoonful of each to cold milk, rose sherbet, nimbu pani, lassi or falooda. Keep soaked jelly in the fridge and use within 2–3 days.',
    itemRoles: {
      'gond-katira': 'Tragacanth gum — swells into cooling jelly',
      'sabja-seeds': 'Sweet basil seeds — swell in 15 minutes',
      'chia-seeds': 'Soaks into gel — fibre & omega-3',
    },
    intro: [
      'The Cool Summer Kit brings together three things Indian kitchens have long reached for in hot weather: Gond Katira (tragacanth gum), Sabja (sweet basil) seeds and Chia seeds. All three swell into a soft, cooling jelly when soaked, and turn ordinary drinks into something more filling and refreshing.',
      'Use them in rose milk, sherbet, nimbu pani, lassi, falooda and kulfi. Every batch is lab tested and packed fresh to order.',
    ],
    routine: [
      'Night before: soak 1 teaspoon of Gond Katira crystals in a large bowl of water — it swells many times over.',
      'Sabja: soak 1–2 teaspoons in water for about 15 minutes until each seed has a translucent coat.',
      'Chia: soak 1–2 teaspoons in water or milk for about 20 minutes.',
      'Add a spoonful of each to rose milk, nimbu pani, sherbet or falooda.',
      'Refrigerate soaked jelly and seeds; use within 2–3 days.',
    ],
    whoFor: [
      'Families looking for traditional cooling drinks in the Indian summer.',
      'Anyone who wants more filling, fibre-rich summer drinks.',
      'Falooda, sherbet and dessert lovers.',
    ],
    precautions: [
      'Always soak fully before eating — never swallow dry Gond Katira, Sabja or Chia, and take them with plenty of liquid.',
      'For young children, make sure the seeds are well soaked and mixed into a drink.',
      'If you are pregnant, ask your doctor before having Sabja seeds regularly.',
    ],
    storage: 'Keep the dry crystals and seeds in airtight containers in a cool, dry place. Refrigerate anything soaked and use within 2–3 days.',
    faqs: [
      { q: 'How long should I soak each one?', a: 'Gond Katira: 6–8 hours or overnight. Sabja: about 15 minutes. Chia: about 20 minutes.' },
      { q: 'What is the difference between Sabja and Chia seeds?', a: 'Sabja are sweet basil seeds — black, they swell within minutes and are the traditional falooda seed. Chia are from a different plant, take a little longer to swell, and are higher in omega-3.' },
      { q: 'Is Gond Katira the same as the gond used in winter ladoos?', a: 'No. Winter ladoos use acacia gum, which is fried. Gond Katira is tragacanth gum — soaked, not fried, and used in summer.' },
      { q: 'How much makes one drink?', a: 'One or two spoonfuls of soaked jelly or seeds per glass. A teaspoon of dry Gond Katira makes a large bowl of jelly.' },
    ],
  },

  'sugar-management-kit': {
    title: 'Sugar Management Kit',
    aka: ['Karela Jamun Neem Chirata Kit', 'Herbal Kadha Kit for Sugar', 'Ayurvedic Bitter Herbs Kit', 'Paneer Doda Kit', 'Diabetic Herbal Kit'],
    seoTitle: 'Sugar Management Kit – Karela, Jamun Guthli, Neem, Chirata & Paneer Doda',
    seoDescription: 'Five traditional bitter herbs — Karela seeds, Jamun guthli, Neem, Chirata and Paneer Doda — for one morning kadha. Lab tested, packed fresh. How to make it and precautions.',
    description: 'Five traditional bitter herbs used together in Ayurvedic morning routines: Karela (bitter gourd) seeds, Jamun guthli, Neem, Chirata and Paneer Doda. Simmered together into one kadha (decoction), taken once a day. A traditional routine to go alongside — never instead of — diet, exercise and your doctor\'s advice. Lab tested and packed fresh, in 100 g or 200 g of each.',
    benefits: ['Five traditional bitter herbs in one kit', 'Brewed as one simple morning kadha', 'Used alongside diet, exercise & your doctor\'s advice'],
    howToUse: '1. Take ½ teaspoon each of Chirata, Neem, Jamun guthli and Karela seed powder. 2. Add 1–2 pieces of Paneer Doda. 3. Boil in 2 cups of water until it reduces to 1 cup. 4. Strain and drink warm, once a day in the morning. Start with half these amounts. If you take diabetes medicine, ask your doctor first and keep monitoring your sugar levels.',
    itemRoles: {
      'karela-seeds': 'Bitter gourd seeds',
      'jamun-guthli': 'Jamun seed powder',
      'neem-powder': 'Neem leaf powder',
      'chirata': 'Himalayan bitter herb',
      'paneer-doda': 'Withania coagulans fruit',
    },
    intro: [
      'This kit brings together five bitter herbs that have long been used side by side in Ayurvedic and traditional Indian routines: Karela (bitter gourd) seeds, Jamun guthli (jamun seed), Neem leaf, Chirata and Paneer Doda. Instead of buying and measuring each separately, the kit gives you all five for one simple morning kadha.',
      'It is a traditional routine, not a medicine. It is meant to go alongside a balanced diet, activity and your doctor\'s care — never to replace prescribed treatment. Every batch is lab tested and packed fresh to order.',
    ],
    routine: [
      'Measure ½ teaspoon each of Chirata, Neem, Jamun guthli and Karela seed powder (start with half this for the first week).',
      'Add 1–2 pieces of Paneer Doda.',
      'Boil in 2 cups of water until about 1 cup is left.',
      'Strain and drink warm, once a day, preferably in the morning.',
      'Expect a strongly bitter taste — that is normal for these herbs.',
    ],
    whoFor: [
      'Adults who want the traditional Ayurvedic bitter-herb kadha without sourcing five herbs separately.',
      'People already following their doctor\'s advice who want to add a traditional routine — with their doctor\'s approval.',
    ],
    precautions: [
      'These herbs may lower blood sugar. If you take diabetes medicine or insulin, use this only with your doctor\'s approval and monitor your levels — the combination can push sugar too low.',
      'Not for pregnancy, breastfeeding or children.',
      'Avoid Karela seeds if you have G6PD deficiency. Check with your doctor if you have liver or kidney problems.',
      'Stop and seek advice if you feel dizzy, shaky or unwell.',
    ],
    storage: 'Keep each herb in its airtight pack in a cool, dry place, away from moisture.',
    faqs: [
      { q: 'Can this replace my diabetes medicine?', a: 'No. This is a traditional herbal routine, not a treatment. Never stop or change prescribed medicine without your doctor.' },
      { q: 'How do I make the kadha?', a: 'Boil ½ teaspoon each of Chirata, Neem, Jamun guthli and Karela seed powder with 1–2 pieces of Paneer Doda in 2 cups of water until 1 cup is left. Strain and drink warm in the morning.' },
      { q: 'Why is it so bitter?', a: 'All five herbs are naturally bitter — bitterness (tikta rasa) is the property they are traditionally valued for.' },
      { q: 'Whole or powder — which should I choose?', a: 'Powder is ready to measure for the kadha. Choose whole if you prefer to grind fresh; Paneer Doda is used whole either way.' },
    ],
    medicalNote: true,
  },

  'gym-kit': {
    title: 'Gym Kit',
    aka: ['Gym & Strength Kit', 'Fitness Dry Fruits Kit', 'Ashwagandha Safed Musli Gym Kit', 'Protein Dry Fruit Combo', 'Workout Nutrition Kit'],
    seoTitle: 'Gym Kit – Ashwagandha, Safed Musli, Almonds, Dates, Pumpkin Seeds & Protein Beans',
    seoDescription: 'A gym and strength kit: Ashwagandha, Safed Musli, almonds, dates, pumpkin seeds and protein beans, with a simple daily routine. Lab tested, packed fresh.',
    description: 'A fitness kit that pairs two traditional Ayurvedic strength herbs — Ashwagandha and Safed Musli — with everyday protein and energy foods: almonds, dates, pumpkin seeds and crunchy protein beans. Herbs in warm milk at night, the rest as pre-workout fuel and snacks. Lab tested and packed fresh, in a trial size or a monthly size.',
    benefits: ['Ashwagandha & Safed Musli — traditional strength herbs', 'Protein from almonds, pumpkin seeds & protein beans', 'Dates for quick natural energy before workouts'],
    howToUse: '1. Night: ½–1 teaspoon each of Ashwagandha and Safed Musli in a cup of warm milk. 2. 30–45 minutes before a workout: 2–3 dates and a few almonds. 3. Snack anytime: a small handful of protein beans or pumpkin seeds. 4. Morning: 5–6 almonds soaked overnight.',
    itemRoles: {
      'ashwagandha-powder': 'Traditional strength & vitality herb',
      'safed-musli': 'Traditional stamina herb',
      'pumpkin-seeds': 'Plant protein & magnesium',
      'protein-beans': 'Crunchy protein snack',
      'almonds': 'Protein & healthy fats',
      'dates-khajoor': 'Quick natural energy',
    },
    intro: [
      'The Gym Kit combines two traditional Ayurvedic strength herbs with simple whole foods for training days. Ashwagandha and Safed Musli are classed in Ayurveda as rasayana herbs, traditionally taken in warm milk for strength and stamina. Almonds, pumpkin seeds and crunchy protein beans add plant protein and healthy fats, and dates give quick natural energy before a workout.',
      'Choose the trial size to start or the monthly size for a full month of routine. Every batch is lab tested and packed fresh to order.',
    ],
    routine: [
      'Night: ½–1 teaspoon each of Ashwagandha and Safed Musli stirred into a cup of warm milk.',
      'Morning: 5–6 almonds soaked overnight.',
      '30–45 minutes before training: 2–3 dates and a few almonds.',
      'Through the day: a small handful of protein beans or pumpkin seeds as a snack.',
    ],
    whoFor: [
      'People who train regularly and want simple, whole-food fuel and snacks.',
      'Anyone wanting the traditional Ashwagandha–Safed Musli milk routine.',
    ],
    precautions: [
      'Ashwagandha: avoid during pregnancy; check with your doctor first if you have a thyroid or autoimmune condition, or take sedatives, thyroid, blood-pressure or diabetes medicine.',
      'Safed Musli is heavy to digest — start with ½ teaspoon.',
      'Dates are naturally high in sugar — if you are diabetic, ask your doctor how many suit you.',
      'Avoid if you are allergic to nuts or seeds.',
    ],
    storage: 'Keep everything airtight in a cool, dry place. Refrigerate dates and almonds in hot months to keep them fresh.',
    faqs: [
      { q: 'How much Ashwagandha and Safed Musli should I take?', a: 'Traditionally ½–1 teaspoon each in warm milk, once a day. Start at ½ teaspoon. A practitioner can advise what suits you.' },
      { q: 'When should I eat the dates and almonds?', a: '2–3 dates with a few almonds about 30–45 minutes before a workout give quick energy; soaked almonds also work well in the morning.' },
      { q: 'Is this a protein supplement?', a: 'No — it is whole foods and traditional herbs. Almonds, pumpkin seeds and protein beans add plant protein to your diet, but it is not a protein powder.' },
      { q: 'What is the difference between the trial and monthly sizes?', a: 'The monthly size has double the quantity of every item — enough for a month of the daily routine.' },
    ],
    medicalNote: true,
  },

  'hair-care-kit': {
    title: 'Hair Care Kit',
    aka: ['Herbal Hair Wash Kit', 'Amla Reetha Shikakai Kit', 'Ayurvedic Hair Care Kit', 'Natural Shampoo Powder Kit', 'Hair Pack Kit'],
    seoTitle: 'Hair Care Kit – Amla, Reetha, Shikakai, Rosemary & Hibiscus (Gudhal)',
    seoDescription: 'Amla, Reetha, Shikakai, Rosemary and Hibiscus (Gudhal) in one herbal hair care kit — a natural hair wash and hair pack. Lab tested, packed fresh. How to use it.',
    description: 'The classic Indian herbal hair wash in one kit: Reetha and Shikakai to cleanse gently, Amla, Hibiscus (Gudhal) and Rosemary for scalp care and shine. Use as a paste or soak into a liquid wash, once or twice a week, instead of shampoo. Choose powder (ready to mix) or whole. Lab tested and packed fresh, in 100 g, 200 g or 400 g of each.',
    benefits: ['Reetha & Shikakai — gentle natural cleansers', 'Amla, Hibiscus & Rosemary for scalp care and shine', 'No added chemicals or fragrance'],
    howToUse: '1. Mix equal parts of all five powders — about 2–4 tablespoons in total, depending on hair length. 2. Add warm water to make a smooth, runny paste. 3. Apply to the scalp and hair. 4. Leave for 10–15 minutes. 5. Rinse thoroughly with water. Use once or twice a week. Keep away from the eyes. Whole form: soak Reetha, Shikakai and Amla overnight, boil for 10 minutes, cool, strain and use the liquid as shampoo.',
    itemRoles: {
      'amla': 'Indian gooseberry — conditioning & shine',
      'reetha': 'Soapnut — natural foaming cleanser',
      'shikakai': '"Fruit for hair" — mild cleanser',
      'rosemary': 'Fresh-scented scalp care',
      'hibiscus-gudhal-sabut': 'Gudhal — traditional hair flower',
    },
    intro: [
      'For generations, Indian homes washed hair with herbs instead of shampoo. This kit gives you the five most-used: Reetha (soapnut) and Shikakai, natural cleansers that foam lightly and don\'t strip the scalp; Amla for conditioning and shine; Hibiscus (Gudhal), a traditional hair flower; and Rosemary, now one of the most popular herbs for scalp care.',
      'Choose powder to mix a paste straight away, or whole to make a traditional liquid wash. Every batch is lab tested and packed fresh to order, with no added chemicals or fragrance.',
    ],
    routine: [
      'Paste wash: mix equal parts of all five powders (2–4 tablespoons in total) with warm water into a runny paste.',
      'Apply to wet scalp and hair, massage gently and leave for 10–15 minutes.',
      'Rinse thoroughly with plenty of water — no shampoo needed.',
      'Liquid wash (whole form): soak Reetha, Shikakai and Amla overnight, boil for 10 minutes, cool, strain and use like shampoo.',
      'Use once or twice a week. Oil your hair an hour before if it tends to feel dry.',
    ],
    whoFor: [
      'Anyone who wants to wash their hair with herbs instead of chemical shampoos.',
      'People looking for a traditional hair pack routine for scalp care and shine.',
    ],
    precautions: [
      'For external use only. Keep away from the eyes — Reetha and Shikakai sting; rinse with plenty of water if they get in.',
      'Do a patch test before first use.',
      'Hibiscus can leave a faint reddish tint on very light or grey hair.',
      'Herbal washes can feel drying at first — oiling before washing helps.',
    ],
    storage: 'Keep powders airtight and dry, and mix only what you need each time. Store whole herbs in a cool, dry place.',
    faqs: [
      { q: 'Powder or whole — which should I choose?', a: 'Powder is ready to mix into a paste. Whole is for the traditional soaked-and-boiled liquid wash, and keeps its strength longer.' },
      { q: 'Can I use this instead of shampoo?', a: 'Yes — Reetha and Shikakai are natural cleansers. It lathers less than shampoo, and that is normal.' },
      { q: 'How often should I use it?', a: 'Once or twice a week suits most hair. Oil your hair beforehand if it feels dry afterwards.' },
      { q: 'Will it colour my hair?', a: 'No, but Hibiscus can leave a faint reddish tint on very light or grey hair.' },
    ],
  },
}

export function getKitContent(slug: string | null | undefined): KitContent | null {
  if (!slug) return null
  return KIT_CONTENT[slug] ?? (slug === 'sugar-managment-kit' ? KIT_CONTENT['sugar-management-kit'] : null)
}
