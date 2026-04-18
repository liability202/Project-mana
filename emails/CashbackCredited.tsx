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

function formatAmount(amount: number) {
  return `Rs. ${(amount / 100).toLocaleString('en-IN')}`
}

export function CashbackCreditedEmail(props: {
  customerName: string
  cashbackAmount: number
  walletBalance: number
  shopUrl: string
}) {
  return (
    <Html>
      <Head />
      <Preview>Your Mana cashback is ready to use</Preview>
      <Body style={{ backgroundColor: '#FDFAF4', fontFamily: 'Arial, sans-serif', color: '#1A1208' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          <Section style={{ backgroundColor: '#1C3D2E', color: '#ffffff', padding: '24px' }}>
            <Heading style={{ margin: 0, fontSize: '28px' }}>MANA</Heading>
            <Text style={{ margin: '8px 0 0', color: '#ffffff' }}>Cashback credited</Text>
          </Section>
          <Section style={{ padding: '24px' }}>
            <Heading style={{ fontSize: '24px', marginTop: 0 }}>Your cashback is ready to use!</Heading>
            <Text>Namaste {props.customerName}, we&apos;ve added cashback to your Mana wallet.</Text>
            <Text style={{ fontSize: '32px', fontWeight: 'bold', color: '#1C3D2E' }}>{formatAmount(props.cashbackAmount)}</Text>
            <Text>Current wallet balance: {formatAmount(props.walletBalance)}</Text>
            <Text>Use it on your next order.</Text>
            <Button
              href={props.shopUrl}
              style={{ backgroundColor: '#C4582A', color: '#ffffff', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none' }}
            >
              Shop Now
            </Button>
            <Section style={{ backgroundColor: '#FDFAF4', padding: '16px', borderRadius: '12px', marginTop: '20px' }}>
              <Text style={{ marginTop: 0, fontWeight: 'bold' }}>How to use it</Text>
              <Text style={{ margin: 0 }}>
                Go to /account - enter your phone - see wallet balance - it will be available at checkout.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
