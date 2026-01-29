import { Box, Text, toReact, type VNodeType } from '@prev/jsx'

function SimplePricing(): VNodeType {
  return Box({
    bg: 'background',
    padding: 'xl',
    children: Text({ size: 'xl', weight: 'bold', children: 'Hello from primitives!' })
  })
}

export default function Pricing() {
  return toReact(SimplePricing())
}
