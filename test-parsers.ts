import { parsePreviewConfig, parseFlowDefinition, parseAtlasDefinition } from './src/vite/config-parser'

console.log('=== Testing Config Parser ===\n')

// Test component config
const buttonConfig = await parsePreviewConfig('./test-scenario/previews/components/button/config.yaml')
console.log('Button config:')
console.log('  title:', buttonConfig?.title)
console.log('  tags:', buttonConfig?.tags)
console.log('  status:', buttonConfig?.status)
console.log()

// Test flow definition
const checkoutFlow = await parseFlowDefinition('./test-scenario/previews/flows/checkout/index.yaml')
console.log('Checkout flow:')
console.log('  name:', checkoutFlow?.name)
console.log('  description:', checkoutFlow?.description)
console.log('  steps:', checkoutFlow?.steps.length)
checkoutFlow?.steps.forEach((step, i) => {
  console.log(`    Step ${i + 1}: screen=${step.screen}, state=${step.state || 'default'}`)
})
console.log()

// Test atlas definition
const appAtlas = await parseAtlasDefinition('./test-scenario/previews/atlas/app/index.yaml')
console.log('App atlas:')
console.log('  name:', appAtlas?.name)
console.log('  root:', appAtlas?.hierarchy.root)
console.log('  areas:', Object.keys(appAtlas?.hierarchy.areas || {}).join(', '))
console.log('  relationships:', appAtlas?.relationships?.length)
