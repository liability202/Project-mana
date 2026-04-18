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
}

export function OrderShippedEmail(props: {
  customerName: string
  orderId: string
  trackingNumber?: string
  courierName?: string
  trackingLink?: string
  expectedDelivery?: string
  items: Item[]
  whatsappUrl: string
}) {
  return (
    <Html>
      <Head />
      <Preview>Your Mana order is on its way</Preview>
      <Body style={{ backgroundColor: '#FDFAF4', fontFamily: 'Arial, sans-serif', color: '#1A1208' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          <Section style={{ backgroundColor: '#1C3D2E', color: '#ffffff', padding: '24px' }}>
            <Heading style={{ margin: 0, fontSize: '28px' }}>MANA</Heading>
            <Text style={{ margin: '8px 0 0', color: '#ffffff' }}>Your order is on the way</Text>
          </Section>
          <Section style={{ padding: '24px' }}>
            <Heading style={{ fontSize: '24px', marginTop: 0 }}>Great news! Your order has been shipped.</Heading>
            <Text>Order #{props.orderId}</Text>
            <Text>Courier: {props.courierName || 'Mana Delivery Partner'}</Text>
            <Text>Tracking Number: {props.trackingNumber || 'Will be shared soon'}</Text>
            <Text>Expected delivery: {props.expectedDelivery || 'Within 5-7 business days'}</Text>
            {props.trackingLink ? (
              <Button
                href={props.trackingLink}
                style={{ backgroundColor: '#C4582A', color: '#ffffff', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', marginBottom: '16px' }}
              >
                Track Shipment
              </Button>
            ) : null}
            {props.items.map((item, index) => (
              <Section key={index} style={{ borderBottom: '1px solid #EDE5D6', padding: '10px 0' }}>
                <Text style={{ margin: 0, fontWeight: 'bold' }}>{item.product_name}</Text>
                <Text style={{ margin: '4px 0 0', color: '#5c503f' }}>
                  {item.variant_name || 'Standard'} | Qty {item.quantity}
                </Text>
              </Section>
            ))}
            <Button
              href={props.whatsappUrl}
              style={{ backgroundColor: '#C4582A', color: '#ffffff', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', marginTop: '20px' }}
            >
              WhatsApp for Help
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
