type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>
}

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export type AdviceHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

function buildFallbackAdvice(userQuery: string, lang: string) {
  const isHindi = lang === 'Hindi'
  const text = userQuery.toLowerCase()

  if (text.includes('stress') || text.includes('sleep') || text.includes('tension')) {
    return isHindi
      ? '🌿 *Stress aur sleep ke liye:*\n\n• Ashwagandha - raat ko gungune doodh ke saath\n• Brahmi - subah halki garam pani ke saath\n\nAapke liye ye dono kaafi useful rahenge. Chahein to main order mein madad kar doon.'
      : '🌿 *For stress and sleep support:*\n\n• Ashwagandha - take with warm milk at night\n• Brahmi - take with lukewarm water in the morning\n\nThese are a very practical pair. I can help you order them if you like.'
  }

  if (text.includes('hair') || text.includes('baal')) {
    return isHindi
      ? '🌿 *Hair care ke liye:*\n\n• Amla Powder - vitamin C rich, roz le sakte hain\n• Bhringraj type herbs ya hair mix - scalp support ke liye useful hote hain\n\nAmla ko pani ya honey ke saath lein. Serious hair fall ho to doctor se bhi consult karein.'
      : '🌿 *For hair support:*\n\n• Amla Powder - rich in vitamin C and easy for daily use\n• Hair-support herbs or blends - helpful for scalp care\n\nTake amla with water or honey. If hair fall is severe, please consult your doctor too.'
  }

  return isHindi
    ? '🌿 *Aapke goal ke liye:*\n\n• Badam - roz 4-5 bhige hue\n• Chia Seeds - subah pani mein\n\nYe simple aur daily wellness friendly choice hai. Main aapke liye order bhi set kar sakta hoon.'
    : '🌿 *For your goal:*\n\n• Almonds - 4 to 5 soaked daily\n• Chia Seeds - in water each morning\n\nThis is a simple, premium daily routine. I can help you order these as well.'
}

function buildSystemPrompt(lang: string, productContext: string) {
  return `You are Mana's expert wellness advisor with deep knowledge of Ayurvedic herbs, dry fruits, spices, seeds and millets.
You work for Mana (India's Wellness Bhandar), a premium natural foods brand from Ghaziabad that sources directly from farmers across India.

Product catalog context:
${productContext}

Rules:
1. Answer in the same language the user writes in (${lang})
2. Keep answers concise and suitable for WhatsApp, under 250 words
3. Always relate advice to Mana's actual products when relevant
4. Include dosage or usage tips when discussing herbs
5. End every response with a relevant product recommendation from the catalog
6. Never give medical diagnoses; for serious conditions say to consult a doctor
7. Be warm, knowledgeable, and like a trusted family vaidya, not a corporate bot
8. Use simple Hindi terms warmly when in Hindi
9. If comparing products, explain simply and recommend which suits whom best`
}

export async function getAIAdvice(
  userQuery: string,
  lang: string,
  productContext: string,
  history: AdviceHistoryMessage[] = []
) {
  const openAiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!openAiKey && !anthropicKey) return buildFallbackAdvice(userQuery, lang)

  const recentHistory = history.slice(-10)
  const systemPrompt = buildSystemPrompt(lang, productContext)

  if (openAiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 350,
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentHistory,
          { role: 'user', content: userQuery },
        ],
      }),
    })

    if (response.ok) {
      const data = (await response.json()) as OpenAIResponse
      const text = data.choices?.[0]?.message?.content?.trim()
      if (text) return text
    }
  }

  if (!anthropicKey) return buildFallbackAdvice(userQuery, lang)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 350,
      system: systemPrompt,
      messages: [
        ...recentHistory.map((message) => ({ role: message.role, content: message.content })),
        { role: 'user', content: userQuery },
      ],
    }),
  })

  if (!response.ok) return buildFallbackAdvice(userQuery, lang)

  const data = (await response.json()) as AnthropicResponse
  const text = data.content?.find((item) => item.type === 'text')?.text?.trim()
  return text || buildFallbackAdvice(userQuery, lang)
}
