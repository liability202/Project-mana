import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

type Item = {
  product_name: string
  variant_name?: string
  quantity: number
  weight_grams?: number
  price: number
}

function formatWeight(weightGrams?: number) {
  if (!weightGrams) return ''
  if (weightGrams >= 1000) return `${(weightGrams / 1000).toFixed(1)}kg`
  return `${weightGrams}g`
}

function formatAmount(amount: number) {
  return `Rs. ${(amount / 100).toLocaleString('en-IN')}`
}

export function OrderConfirmationEmail(props: {
  customerName: string
  orderId: string
  items: Item[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  address: string
  city: string
  state?: string
  pincode: string
  whatsappUrl: string
}) {
  return (
    <Html>
      <Head />
      <Preview>Your Mana order is confirmed</Preview>
      <Body style={{ backgroundColor: '#FDFAF4', fontFamily: 'Arial, sans-serif', color: '#1A1208' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          <Section style={{ backgroundColor: '#1C3D2E', color: '#ffffff', padding: '24px' }}>
            <Heading style={{ margin: 0, fontSize: '28px' }}>MANA</Heading>
            <Text style={{ margin: '8px 0 0', color: '#ffffff' }}>The Essence of Nature</Text>
          </Section>
          <Section style={{ padding: '24px' }}>
            <Heading style={{ fontSize: '24px', marginTop: 0 }}>Namaste {props.customerName}! Your order is confirmed.</Heading>
            <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>Order #{props.orderId}</Text>
            {props.items.map((item, index) => (
              <Section key={index} style={{ borderBottom: '1px solid #EDE5D6', padding: '10px 0' }}>
                <Text style={{ margin: 0, fontWeight: 'bold' }}>{item.product_name}</Text>
                <Text style={{ margin: '4px 0', color: '#5c503f' }}>
                  {item.variant_name || 'Standard'} | Qty {item.quantity}
                  {item.weight_grams ? ` | ${formatWeight(item.weight_grams)}` : ''}
                </Text>
                <Text style={{ margin: 0 }}>{formatAmount(item.price * item.quantity)}</Text>
              </Section>
            ))}
            <Section style={{ padding: '16px 0' }}>
              <Text style={{ margin: '4px 0' }}>Subtotal: {formatAmount(props.subtotal)}</Text>
              <Text style={{ margin: '4px 0' }}>Shipping: {formatAmount(props.shipping)}</Text>
              <Text style={{ margin: '4px 0' }}>Discount: {formatAmount(props.discount)}</Text>
              <Text style={{ margin: '8px 0 0', fontWeight: 'bold', fontSize: '18px' }}>Total: {formatAmount(props.total)}</Text>
            </Section>
            <Section style={{ backgroundColor: '#FDFAF4', padding: '16px', borderRadius: '12px' }}>
              <Text style={{ marginTop: 0, fontWeight: 'bold' }}>Delivery Address</Text>
              <Text style={{ margin: 0 }}>{props.address}</Text>
              <Text style={{ margin: '4px 0 0' }}>
                {props.city}
                {props.state ? `, ${props.state}` : ''} - {props.pincode}
              </Text>
            </Section>
            <Text>Estimated delivery: 5-7 business days</Text>
            <Text>We&apos;ll start packing your order fresh right away.</Text>
            <Button
              href={props.whatsappUrl}
              style={{ backgroundColor: '#C4582A', color: '#ffffff', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none' }}
            >
              Contact on WhatsApp
            </Button>
          </Section>
          <Section style={{ padding: '20px 24px', borderTop: '1px solid #EDE5D6', fontSize: '12px', color: '#5c503f' }}>
            <Text>Ghaziabad, UP</Text>
            <Text>
              <a href="https://example.com/unsubscribe" style={{ color: '#1C3D2E' }}>
                Unsubscribe
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
