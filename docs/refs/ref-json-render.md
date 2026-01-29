# Reference: json-render (Vercel Labs)

> Summary of vercel-labs/json-render for architectural inspiration.

## What It Does

json-render enables AI to safely generate user interfaces by constraining output to predefined components and schemas. The core concept: **AI → JSON → UI**.

**Use cases:**
- AI-powered dashboard generation
- Dynamic widget creation from prompts
- Generative UI in chatbots
- Data visualization from natural language

## How It Works

**Four-stage pipeline:**

1. **Define Guardrails** → Developers specify allowed components, actions, data bindings
2. **User Prompting** → End users describe desired UI in natural language
3. **AI Generation** → LLM produces JSON constrained to predefined catalog
4. **Progressive Rendering** → React components render as JSON streams

## Component Catalog

```typescript
const catalog = createCatalog({
  components: {
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
      }),
      hasChildren: true,
    },
    Metric: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        format: z.enum(['currency', 'percent', 'number']),
      }),
    },
  },
  actions: {
    export_report: { description: 'Export dashboard to PDF' },
  },
});
```

## Generated JSON Output

```json
{
  "type": "Card",
  "props": {
    "title": "Dashboard",
    "description": "Performance metrics"
  },
  "children": [
    {
      "type": "Metric",
      "props": {
        "label": "Revenue",
        "valuePath": "/metrics/revenue",
        "format": "currency"
      }
    }
  ]
}
```

## Key Mechanisms

**Visibility conditions:**
```json
{
  "type": "AdminPanel",
  "visible": { "auth": "signedIn" }
}
```

**Data binding** via JSON Pointer paths:
- `/form/email`, `/ui/success`, `/metrics/revenue`
- Dynamic value resolution: `${path}`

**Rich actions:**
```json
{
  "type": "Button",
  "props": {
    "label": "Refund",
    "action": {
      "name": "refund",
      "params": { "orderId": "${/form/orderId}" },
      "onSuccess": { "set": { "/ui/success": true } }
    }
  }
}
```

## Key Takeaways for prev-cli

| json-render | prev-cli adaptation |
|-------------|---------------------|
| Component catalog with Zod schemas | JSON Schema for components/screens/flows/atlas |
| JSON tree → React renderer | Config → Renderer adapter (React/Solid/HTML) |
| AI generates constrained JSON | AI or humans author validated configs |
| Progressive streaming | Static build + HMR dev mode |
| Data binding paths | Cross-type references (`screens/login`) |

## Resources

- [GitHub - vercel-labs/json-render](https://github.com/vercel-labs/json-render)
- [json-render.org](https://json-render.org/)
