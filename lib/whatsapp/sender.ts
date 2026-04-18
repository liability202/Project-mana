const WA_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`

function getHeaders() {
  const token = process.env.WHATSAPP_TOKEN
  if (!token) throw new Error('WHATSAPP_TOKEN is not configured.')

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function postWhatsAppMessage(payload: Record<string, unknown>) {
 if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
  console.log("⚠️ WhatsApp not configured, skipping send")
  return
}

  const response = await fetch(WA_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`WhatsApp API error (${response.status}): ${details}`)
  }

  return response.json()
}

export async function sendWhatsAppMessage(to: string, text: string) {
  return postWhatsAppMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text, preview_url: false },
  })
}

export async function sendWhatsAppList(
  to: string,
  buttonLabel: string,
  items: { id: string; title: string; description?: string }[],
  bodyText = 'Choose an option:'
) {
  return postWhatsAppMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: [
          {
            title: 'Options',
            rows: items.slice(0, 10).map((item) => ({
              id: item.id.slice(0, 200),
              title: item.title.slice(0, 24),
              description: item.description?.slice(0, 72) || undefined,
            })),
          },
        ],
      },
    },
  })
}

export async function sendWhatsAppButtons(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[]
) {
  return postWhatsAppMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((button) => ({
          type: 'reply',
          reply: {
            id: button.id.slice(0, 256),
            title: button.title.slice(0, 20),
          },
        })),
      },
    },
  })
}
