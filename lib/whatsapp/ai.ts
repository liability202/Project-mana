type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>
}

function buildFallbackAdvice(userQuery: string, lang: string) {
  const isHindi = lang === 'Hindi'
  const text = userQuery.toLowerCase()

  if (text.includes('stress') || text.includes('sleep') || text.includes('तनाव')) {
    return isHindi
      ? '*तनाव या नींद के लिए*\n\n• Ashwagandha - रात को गुनगुने दूध के साथ\n• Brahmi - सुबह हल्के गर्म पानी के साथ\n\n💚 चाहें तो मैं order में मदद कर दूं।'
      : '*For stress or sleep support*\n\n• Ashwagandha - take with warm milk at night\n• Brahmi - take with lukewarm water in the morning\n\n💚 We stock both - shall I help you order?'
  }

  if (text.includes('digestion') || text.includes('acidity') || text.includes('पाचन')) {
    return isHindi
      ? '*पाचन के लिए*\n\n• Saunf - खाने के बाद थोड़ी मात्रा\n• Jeera - पानी या छाछ में\n\n💚 चाहें तो मैं order में मदद कर दूं।'
      : '*For digestion support*\n\n• Fennel - a small amount after meals\n• Cumin - add to warm water or buttermilk\n\n💚 We stock both - shall I help you order?'
  }

  return isHindi
    ? '*आपके goal के लिए*\n\n• Badam - रोज 4-5 भीगे हुए\n• Chia Seeds - सुबह पानी में\n\nसाफ, simple और daily use friendly choice है.\n\n💚 चाहें तो मैं order में मदद कर दूं।'
    : '*For your goal*\n\n• Almonds - 4 to 5 soaked daily\n• Chia Seeds - in water each morning\n\nA simple, premium daily routine.\n\n💚 We stock both - shall I help you order?'
}

export async function getAIAdvice(userQuery: string, lang: string, productContext: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return buildFallbackAdvice(userQuery, lang)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 300,
      system: `You are the premium WhatsApp product advisor for MANA, a dry fruits, spices, herbs, seeds, and pansari brand.

Keep replies short and polished for WhatsApp.
- 3 to 4 short sentences max
- Recommend 1 to 2 specific products from the live catalog below
- Give a simple consumption tip for each
- Avoid medical claims and diagnosis
- End by offering help with ordering
- Language: ${lang}

Live product catalog:
${productContext}`,
      messages: [
        {
          role: 'user',
          content: userQuery,
        },
      ],
    }),
  })

  if (!response.ok) {
    return buildFallbackAdvice(userQuery, lang)
  }

  const data = (await response.json()) as AnthropicResponse
  const text = data.content?.find((item) => item.type === 'text')?.text?.trim()
  return text || buildFallbackAdvice(userQuery, lang)
}
