// src/vite/preview-types.ts
import { z } from 'zod'

// Preview content types
export type PreviewType = 'component' | 'screen' | 'flow' | 'atlas'

// Config.yaml schema
export const configSchema = z.object({
  // Allow both string and array for tags (YAML allows `tags: core` as scalar)
  tags: z.union([
    z.array(z.string()),
    z.string().transform(s => [s])
  ]).optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'stable', 'deprecated']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
})

export type PreviewConfig = z.infer<typeof configSchema>

// Extended preview unit with type awareness
export interface PreviewUnit {
  type: PreviewType
  name: string
  path: string
  route: string
  config: PreviewConfig | null
  files: {
    index: string           // Main entry file
    states?: string[]       // For screens: additional state files
    schema?: string         // For components: schema.ts
    docs?: string           // docs.mdx if present
  }
}

// Flow step definition (from index.yaml)
export interface FlowStep {
  screen: string
  state?: string
  note?: string
  trigger?: string
  highlight?: string[]
}

// Flow definition
export interface FlowDefinition {
  name: string
  description?: string
  steps: FlowStep[]
}

// Atlas area definition
export interface AtlasArea {
  title: string
  description?: string
  parent?: string
  children?: string[]
  access?: string
}

// Atlas definition (from index.yaml)
export interface AtlasDefinition {
  name: string
  description?: string
  hierarchy: {
    root: string
    areas: Record<string, AtlasArea>
  }
  routes?: Record<string, { area: string; screen: string; guard?: string }>
  navigation?: Record<string, Array<{ area?: string; icon?: string; action?: string }>>
  relationships?: Array<{ from: string; to: string; type: string }>
}
