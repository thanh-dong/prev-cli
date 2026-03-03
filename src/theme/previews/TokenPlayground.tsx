import React, { useState } from 'react'
import { Icon } from '../icons'
import type { TokenOverride } from '../types'

interface TokenPlaygroundProps {
  tokens: Record<string, any>
  overrides: TokenOverride[]
  onSetOverride: (category: string, name: string, originalValue: string, newValue: string) => void
  onRemoveOverride: (category: string, name: string) => void
  onResetAll: () => void
  onClose: () => void
}

// --- helpers ---

function findOverride(overrides: TokenOverride[], category: string, name: string): TokenOverride | undefined {
  return overrides.find(o => o.category === category && o.name === name)
}

function parseNumeric(value: string | number): number {
  const n = parseFloat(String(value))
  return Number.isNaN(n) ? 0 : n
}

// --- sub-components ---

function ColorEditor({
  category, name, value, override, onSet, onRemove,
}: {
  category: string; name: string; value: string
  override: TokenOverride | undefined
  onSet: (cat: string, name: string, orig: string, val: string) => void
  onRemove: (cat: string, name: string) => void
}) {
  const current = override?.overrideValue ?? value
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="color"
        value={current}
        onChange={e => onSet(category, name, value, e.target.value)}
        style={{ width: '32px', height: '28px', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
      />
      <span style={monoStyle}>{current}</span>
      {override && <ResetButton onClick={() => onRemove(category, name)} />}
    </div>
  )
}

function RangeEditor({
  category, name, value, override, onSet, onRemove, max = 100, unit = 'px',
}: {
  category: string; name: string; value: string
  override: TokenOverride | undefined
  onSet: (cat: string, name: string, orig: string, val: string) => void
  onRemove: (cat: string, name: string) => void
  max?: number; unit?: string
}) {
  const current = override?.overrideValue ?? value
  const num = parseNumeric(current)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="range"
        min={0}
        max={max}
        value={num}
        onChange={e => onSet(category, name, value, `${e.target.value}${unit}`)}
        style={{ width: '100px', accentColor: 'oklch(0.65 0.15 250)' }}
      />
      <span style={monoStyle}>{current}</span>
      {override && <ResetButton onClick={() => onRemove(category, name)} />}
    </div>
  )
}

function NumberEditor({
  category, name, value, override, onSet, onRemove, unit = 'px',
}: {
  category: string; name: string; value: string | number
  override: TokenOverride | undefined
  onSet: (cat: string, name: string, orig: string, val: string) => void
  onRemove: (cat: string, name: string) => void
  unit?: string
}) {
  const current = override?.overrideValue ?? String(value)
  const num = parseNumeric(current)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="number"
        min={0}
        value={num}
        onChange={e => onSet(category, name, String(value), `${e.target.value}${unit}`)}
        style={{
          width: '72px',
          padding: '4px 6px',
          fontSize: '12px',
          fontFamily: 'monospace',
          border: '1px solid var(--fd-border)',
          borderRadius: '4px',
          background: 'var(--fd-background)',
          color: 'var(--fd-foreground)',
        }}
      />
      <span style={monoStyle}>{current}</span>
      {override && <ResetButton onClick={() => onRemove(category, name)} />}
    </div>
  )
}

function ReadOnlyValue({ value, category, name, override, onRemove }: {
  value: string | number
  category: string; name: string
  override: TokenOverride | undefined
  onRemove: (cat: string, name: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={monoStyle}>{override?.overrideValue ?? String(value)}</span>
      {override && <ResetButton onClick={() => onRemove(category, name)} />}
    </div>
  )
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Reset to original"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '22px',
        height: '22px',
        border: '1px solid var(--fd-border)',
        borderRadius: '4px',
        background: 'none',
        cursor: 'pointer',
        color: 'var(--fd-muted-foreground)',
        flexShrink: 0,
      }}
    >
      <Icon name="x" size={12} />
    </button>
  )
}

// --- category section ---

function CategorySection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ borderBottom: '1px solid var(--fd-border)' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 16px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'var(--fd-foreground)',
          fontSize: '13px',
          fontWeight: 600,
          textAlign: 'left',
        }}
      >
        {title}
        <Icon
          name="chevron-right"
          size={14}
          style={{
            transition: 'transform 0.15s',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {expanded && <div>{children}</div>}
    </div>
  )
}

function TokenRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 16px 6px 28px',
      gap: '8px',
      borderTop: '1px solid color-mix(in oklch, var(--fd-border) 40%, transparent)',
    }}>
      <span style={{
        fontSize: '12px',
        color: 'var(--fd-muted-foreground)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100px',
      }}>
        {label}
      </span>
      <div style={{ flexShrink: 0 }}>
        {children}
      </div>
    </div>
  )
}

// --- main ---

const monoStyle: React.CSSProperties = {
  fontSize: '11px',
  fontFamily: 'monospace',
  color: 'var(--fd-muted-foreground)',
  whiteSpace: 'nowrap',
}

export function TokenPlayground({
  tokens,
  overrides,
  onSetOverride,
  onRemoveOverride,
  onResetAll,
  onClose,
}: TokenPlaygroundProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    colors: true,
    spacing: false,
    radius: false,
    shadows: false,
    typography: false,
  })

  const toggle = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const renderEntries = (
    category: string,
    entries: Record<string, string | number>,
    editor: 'color' | 'range' | 'number' | 'readonly',
    editorProps?: { max?: number; unit?: string },
  ) =>
    Object.entries(entries).map(([name, value]) => {
      const ov = findOverride(overrides, category, name)
      return (
        <TokenRow key={name} label={name}>
          {editor === 'color' && (
            <ColorEditor
              category={category} name={name} value={String(value)}
              override={ov} onSet={onSetOverride} onRemove={onRemoveOverride}
            />
          )}
          {editor === 'range' && (
            <RangeEditor
              category={category} name={name} value={String(value)}
              override={ov} onSet={onSetOverride} onRemove={onRemoveOverride}
              max={editorProps?.max} unit={editorProps?.unit}
            />
          )}
          {editor === 'number' && (
            <NumberEditor
              category={category} name={name} value={value}
              override={ov} onSet={onSetOverride} onRemove={onRemoveOverride}
              unit={editorProps?.unit}
            />
          )}
          {editor === 'readonly' && (
            <ReadOnlyValue
              value={value} category={category} name={name}
              override={ov} onRemove={onRemoveOverride}
            />
          )}
        </TokenRow>
      )
    })

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '360px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--fd-background)',
      borderLeft: '1px solid var(--fd-border)',
      boxShadow: '-4px 0 24px oklch(0 0 0 / 0.12)',
      zIndex: 9999,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--fd-border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="palette" size={18} style={{ color: 'oklch(0.65 0.15 250)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fd-foreground)' }}>
            Token Playground
          </span>
        </div>
        <button
          onClick={onClose}
          title="Close panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            border: '1px solid var(--fd-border)',
            borderRadius: '6px',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--fd-muted-foreground)',
          }}
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Colors */}
        {tokens.colors && (
          <CategorySection title="Colors" expanded={!!expanded.colors} onToggle={() => toggle('colors')}>
            {renderEntries('colors', tokens.colors, 'color')}
          </CategorySection>
        )}

        {/* Spacing */}
        {tokens.spacing && (
          <CategorySection title="Spacing" expanded={!!expanded.spacing} onToggle={() => toggle('spacing')}>
            {renderEntries('spacing', tokens.spacing, 'range', { max: 100, unit: 'px' })}
          </CategorySection>
        )}

        {/* Radius */}
        {tokens.radius && (
          <CategorySection title="Radius" expanded={!!expanded.radius} onToggle={() => toggle('radius')}>
            {renderEntries('radius', tokens.radius, 'range', { max: 100, unit: 'px' })}
          </CategorySection>
        )}

        {/* Shadows */}
        {tokens.shadows && (
          <CategorySection title="Shadows" expanded={!!expanded.shadows} onToggle={() => toggle('shadows')}>
            {renderEntries('shadows', tokens.shadows, 'readonly')}
          </CategorySection>
        )}

        {/* Typography */}
        {tokens.typography && (
          <CategorySection title="Typography" expanded={!!expanded.typography} onToggle={() => toggle('typography')}>
            {tokens.typography.sizes && (
              <>
                <div style={{
                  padding: '6px 28px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--fd-muted-foreground)',
                  background: 'var(--fd-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Sizes
                </div>
                {renderEntries('typography-sizes', tokens.typography.sizes, 'number', { unit: 'px' })}
              </>
            )}
            {tokens.typography.weights && (
              <>
                <div style={{
                  padding: '6px 28px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--fd-muted-foreground)',
                  background: 'var(--fd-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Weights
                </div>
                {renderEntries('typography-weights', tokens.typography.weights, 'readonly')}
              </>
            )}
          </CategorySection>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--fd-border)',
        flexShrink: 0,
      }}>
        <button
          onClick={onResetAll}
          disabled={overrides.length === 0}
          style={{
            width: '100%',
            padding: '8px 0',
            fontSize: '13px',
            fontWeight: 500,
            border: '1px solid var(--fd-border)',
            borderRadius: '6px',
            background: overrides.length > 0 ? 'oklch(0.55 0.15 25)' : 'var(--fd-muted)',
            color: overrides.length > 0 ? 'white' : 'var(--fd-muted-foreground)',
            cursor: overrides.length > 0 ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          Reset All ({overrides.length} override{overrides.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  )
}
