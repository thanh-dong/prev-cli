import React, { useState, useEffect } from 'react'
import type { PreviewUnit, FlowDefinition } from '../../vite/preview-types'

interface FlowStep {
  id?: string
  title?: string
  description?: string
  screen: string
  state?: string
  note?: string
  trigger?: string
}

interface FlowConfig {
  title?: string
  description?: string
  steps?: FlowStep[]
}

interface FlowPreviewProps {
  unit: PreviewUnit
}

// Detect if running in static build (no dev server)
const isStaticBuild = typeof window !== 'undefined' &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1')

export function FlowPreview({ unit }: FlowPreviewProps) {
  const [flow, setFlow] = useState<FlowDefinition | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load flow definition - use config for static builds, fetch for dev
  useEffect(() => {
    // For static builds, use the config data embedded in the unit
    const config = unit.config as FlowConfig | undefined
    if (config?.steps && config.steps.length > 0) {
      setFlow({
        name: config.title || unit.name,
        description: config.description,
        steps: config.steps,
      } as FlowDefinition)
      setLoading(false)
      return
    }

    // Fall back to fetching for dev mode
    fetch(`/_preview-config/flows/${unit.name}`)
      .then(res => res.json())
      .then(data => {
        setFlow(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [unit.name, unit.config])

  if (loading) {
    return (
      <div style={{
        padding: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--fd-card)',
        borderRadius: '16px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid var(--fd-border)',
          borderTopColor: 'var(--fd-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (!flow || !flow.steps || flow.steps.length === 0) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        backgroundColor: 'var(--fd-card)',
        borderRadius: '16px',
        border: '1px solid var(--fd-border)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'oklch(0.94 0.06 85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '24px',
        }}>
          ⚠
        </div>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--fd-foreground)',
        }}>
          {flow?.name || 'Flow'}
        </h2>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--fd-muted-foreground)',
        }}>
          {flow ? 'This flow has no steps defined.' : 'Failed to load flow definition.'}
        </p>
      </div>
    )
  }

  const step = flow.steps[currentStep]
  const totalSteps = flow.steps.length

  // Build iframe URL for current step's screen
  const basePath = typeof window !== 'undefined'
    ? (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')
    : ''
  // For static builds: default state is in root, other states are in subdirs
  const staticStatePath = step?.state ? `${step.state}/` : ''
  const iframeUrl = step
    ? (isStaticBuild
        ? `${basePath}/_preview/screens/${step.screen}/${staticStatePath}`
        : `/_preview-runtime?preview=screens/${step.screen}${step.state ? `&state=${step.state}` : ''}`)
    : ''

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '16px',
      overflow: 'hidden',
      backgroundColor: 'var(--fd-card)',
      boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04)',
    }}>
      {/* Compact header with inline controls */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'var(--fd-muted)',
        borderBottom: '1px solid var(--fd-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {/* Left: Flow name and step info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, oklch(0.60 0.18 170) 0%, oklch(0.50 0.20 200) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            flexShrink: 0,
          }}>
            ⇢
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--fd-foreground)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {flow.name}
            </h2>
            {step && step.title && (
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: 'var(--fd-muted-foreground)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {step.title}
              </p>
            )}
          </div>
        </div>

        {/* Center: Progress dots */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
        }}>
          {flow.steps.map((s, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => setCurrentStep(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: i === currentStep
                    ? 'var(--fd-primary)'
                    : i < currentStep
                    ? 'oklch(0.65 0.18 155)'
                    : 'var(--fd-background)',
                  color: i <= currentStep
                    ? 'white'
                    : 'var(--fd-muted-foreground)',
                  transition: 'all 0.15s ease',
                }}
                title={s.title || `Step ${i + 1}`}
              >
                {i < currentStep ? '✓' : i + 1}
              </button>
              {i < flow.steps.length - 1 && (
                <div style={{
                  width: '12px',
                  height: '2px',
                  backgroundColor: i < currentStep
                    ? 'oklch(0.65 0.18 155)'
                    : 'var(--fd-border)',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Right: Navigation */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid var(--fd-border)',
              borderRadius: '6px',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              backgroundColor: 'var(--fd-background)',
              color: currentStep === 0 ? 'var(--fd-muted-foreground)' : 'var(--fd-foreground)',
              opacity: currentStep === 0 ? 0.5 : 1,
            }}
          >
            ←
          </button>
          <button
            onClick={() => setCurrentStep(s => Math.min(totalSteps - 1, s + 1))}
            disabled={currentStep === totalSteps - 1}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              borderRadius: '6px',
              cursor: currentStep === totalSteps - 1 ? 'not-allowed' : 'pointer',
              backgroundColor: currentStep === totalSteps - 1 ? 'var(--fd-border)' : 'var(--fd-primary)',
              color: currentStep === totalSteps - 1 ? 'var(--fd-muted-foreground)' : 'var(--fd-primary-foreground)',
              opacity: currentStep === totalSteps - 1 ? 0.5 : 1,
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Preview canvas - full width, minimal chrome */}
      <div style={{
        padding: '16px',
        backgroundColor: 'oklch(0.15 0.01 260)',
        backgroundImage: `
          linear-gradient(oklch(0.20 0.01 260) 1px, transparent 1px),
          linear-gradient(90deg, oklch(0.20 0.01 260) 1px, transparent 1px)
        `,
        backgroundSize: '16px 16px',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '900px',
          backgroundColor: 'var(--fd-card)',
          borderRadius: '8px',
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1), 0 4px 20px -4px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}>
          {/* Minimal browser chrome */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            backgroundColor: 'var(--fd-muted)',
            borderBottom: '1px solid var(--fd-border)',
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'oklch(0.70 0.18 25)' }} />
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'oklch(0.80 0.15 85)' }} />
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'oklch(0.70 0.18 145)' }} />
            </div>
            <div style={{
              flex: 1,
              marginLeft: '6px',
              padding: '3px 8px',
              backgroundColor: 'var(--fd-background)',
              borderRadius: '4px',
              fontSize: '9px',
              fontFamily: 'var(--fd-font-mono)',
              color: 'var(--fd-muted-foreground)',
            }}>
              {step.screen}{step.state ? `/${step.state}` : ''}
            </div>
          </div>

          <iframe
            src={iframeUrl}
            style={{
              width: '100%',
              height: '500px',
              border: 'none',
              display: 'block',
              backgroundColor: 'white',
            }}
            title={`Flow: ${flow.name} - Step ${currentStep + 1}`}
          />
        </div>
      </div>
    </div>
  )
}
