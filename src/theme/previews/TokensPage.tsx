// src/theme/previews/TokensPage.tsx
// Visual showcase page for design tokens at /_prev/tokens
import React, { useState } from 'react'
import { tokens } from 'virtual:prev-tokens'

interface TokenRowProps {
  name: string
  value: string | number
  preview?: React.ReactNode
  category: string
}

function TokenRow({ name, value, preview, category }: TokenRowProps) {
  const [copied, setCopied] = useState(false)

  const copyToken = () => {
    const prompt = `Use the ${category} token "${name}" (value: ${value})`
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      data-token={name}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--fd-border)',
      }}
    >
      {/* Preview swatch */}
      <div style={{ width: '48px', height: '48px', flexShrink: 0 }}>
        {preview}
      </div>

      {/* Token info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, color: 'var(--fd-foreground)' }}>{name}</div>
        <div data-value style={{ fontSize: '14px', color: 'var(--fd-muted-foreground)', fontFamily: 'monospace' }}>
          {String(value)}
        </div>
      </div>

      {/* Copy button */}
      <button
        data-copy
        onClick={copyToken}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          border: '1px solid var(--fd-border)',
          borderRadius: '4px',
          background: copied ? 'var(--fd-accent)' : 'var(--fd-background)',
          color: copied ? 'var(--fd-accent-foreground)' : 'var(--fd-foreground)',
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function ColorSwatch({ color }: { color: string }) {
  return (
    <div style={{
      width: '48px',
      height: '48px',
      backgroundColor: color,
      borderRadius: '6px',
      border: '1px solid var(--fd-border)',
    }} />
  )
}

function SpacingSwatch({ size }: { size: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '48px',
      height: '48px',
    }}>
      <div style={{
        width: size,
        height: size,
        backgroundColor: 'var(--fd-primary)',
        borderRadius: '2px',
      }} />
    </div>
  )
}

function RadiusSwatch({ radius }: { radius: string }) {
  return (
    <div style={{
      width: '48px',
      height: '48px',
      backgroundColor: 'var(--fd-primary)',
      borderRadius: radius,
    }} />
  )
}

function ShadowSwatch({ shadow }: { shadow: string }) {
  return (
    <div style={{
      width: '48px',
      height: '48px',
      backgroundColor: 'var(--fd-background)',
      borderRadius: '6px',
      boxShadow: shadow,
      border: shadow === 'none' ? '1px solid var(--fd-border)' : 'none',
    }} />
  )
}

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <section data-section={title.toLowerCase()} style={{ marginBottom: '32px' }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: 600,
        color: 'var(--fd-foreground)',
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: '2px solid var(--fd-border)',
      }}>
        {title}
      </h2>
      <div style={{
        border: '1px solid var(--fd-border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </section>
  )
}

export function TokensPage() {
  const [copyAllStatus, setCopyAllStatus] = useState<string>('Copy All as Prompt')

  // Tokens are pre-resolved at build time via virtual:prev-tokens

  const copyAllAsPrompt = () => {
    const lines = [
      '# Design Tokens',
      '',
      '## Colors',
      ...Object.entries(tokens.colors).map(([name, value]) => `- ${name}: ${value}`),
      '',
      '## Backgrounds',
      ...Object.entries(tokens.backgrounds).map(([name, value]) => `- ${name}: ${value}`),
      '',
      '## Spacing',
      ...Object.entries(tokens.spacing).map(([name, value]) => `- ${name}: ${value}`),
      '',
      '## Typography Sizes',
      ...Object.entries(tokens.typography.sizes).map(([name, value]) => `- ${name}: ${value}`),
      '',
      '## Typography Weights',
      ...Object.entries(tokens.typography.weights).map(([name, value]) => `- ${name}: ${value}`),
      '',
      '## Border Radius',
      ...Object.entries(tokens.radius).map(([name, value]) => `- ${name}: ${value}`),
      '',
      '## Shadows',
      ...Object.entries(tokens.shadows).map(([name, value]) => `- ${name}: ${value}`),
    ]

    navigator.clipboard.writeText(lines.join('\n'))
    setCopyAllStatus('Copied!')
    setTimeout(() => setCopyAllStatus('Copy All as Prompt'), 2000)
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '32px 24px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--fd-foreground)',
          margin: 0,
        }}>
          Design Tokens
        </h1>
        <button
          data-copy-all
          onClick={copyAllAsPrompt}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid var(--fd-primary)',
            borderRadius: '6px',
            background: 'var(--fd-primary)',
            color: 'var(--fd-primary-foreground)',
            cursor: 'pointer',
          }}
        >
          {copyAllStatus}
        </button>
      </div>

      {/* Colors Section */}
      <Section title="Colors">
        {Object.entries(tokens.colors as Record<string, string>).map(([name, value]) => (
          <TokenRow
            key={name}
            name={name}
            value={value}
            category="color"
            preview={<ColorSwatch color={value} />}
          />
        ))}
      </Section>

      {/* Backgrounds Section */}
      <Section title="Backgrounds">
        {Object.entries(tokens.backgrounds as Record<string, string>).map(([name, value]) => (
          <TokenRow
            key={name}
            name={name}
            value={value}
            category="background"
            preview={<ColorSwatch color={value} />}
          />
        ))}
      </Section>

      {/* Spacing Section */}
      <Section title="Spacing">
        {Object.entries(tokens.spacing as Record<string, string>).map(([name, value]) => (
          <TokenRow
            key={name}
            name={name}
            value={value}
            category="spacing"
            preview={<SpacingSwatch size={value} />}
          />
        ))}
      </Section>

      {/* Typography Section */}
      <Section title="Typography">
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--fd-muted)', fontSize: '12px', fontWeight: 500, color: 'var(--fd-muted-foreground)' }}>
          Sizes
        </div>
        {Object.entries(tokens.typography.sizes as Record<string, string>).map(([name, value]) => (
          <TokenRow
            key={name}
            name={name}
            value={value}
            category="typography size"
            preview={
              <div style={{ fontSize: value, lineHeight: 1, color: 'var(--fd-foreground)' }}>
                Aa
              </div>
            }
          />
        ))}
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--fd-muted)', fontSize: '12px', fontWeight: 500, color: 'var(--fd-muted-foreground)' }}>
          Weights
        </div>
        {Object.entries(tokens.typography.weights as Record<string, number>).map(([name, value]) => (
          <TokenRow
            key={name}
            name={name}
            value={value}
            category="typography weight"
            preview={
              <div style={{ fontWeight: value, fontSize: '24px', color: 'var(--fd-foreground)' }}>
                Aa
              </div>
            }
          />
        ))}
      </Section>

      {/* Radius Section */}
      <Section title="Radius">
        {Object.entries(tokens.radius as Record<string, string>).map(([name, value]) => (
          <TokenRow
            key={name}
            name={name}
            value={value}
            category="radius"
            preview={<RadiusSwatch radius={value} />}
          />
        ))}
      </Section>

      {/* Shadows Section */}
      <Section title="Shadows">
        {Object.entries(tokens.shadows as Record<string, string>).map(([name, value]) => (
          <TokenRow
            key={name}
            name={name}
            value={value}
            category="shadow"
            preview={<ShadowSwatch shadow={value} />}
          />
        ))}
      </Section>
    </div>
  )
}
