import { scanPreviewUnits } from './src/vite/previews'

const units = await scanPreviewUnits('./test-scenario')
console.log('Found', units.length, 'preview units:\n')
for (const unit of units) {
  console.log(`  [${unit.type}] ${unit.name}`)
  console.log(`    Route: ${unit.route}`)
  console.log(`    Files: index=${unit.files.index}`)
  if (unit.files.states) console.log(`    States: ${unit.files.states.join(', ')}`)
  if (unit.files.schema) console.log(`    Schema: ${unit.files.schema}`)
  if (unit.config) console.log(`    Config: title="${unit.config.title}", tags=[${unit.config.tags?.join(', ')}]`)
  console.log()
}
