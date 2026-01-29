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
  const iframeUrl = step
    ? (isStaticBuild
        ? `${basePath}/_preview/screens/${step.screen}/`
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
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: 'linear-gradient(to bottom, var(--fd-card), var(--fd-muted))',
        borderBottom: '1px solid var(--fd-border)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Flow icon */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, oklch(0.60 0.18 170) 0%, oklch(0.50 0.20 200) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.25)',
            }}>
              ⇢
            </div>

            <div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--fd-foreground)',
                letterSpacing: '-0.02em',
              }}>
                {flow.name}
              </h2>
              {flow.description && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: 'var(--fd-muted-foreground)',
                }}>
                  {flow.description}
                </p>
              )}
            </div>
          </div>

          {/* Step counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            backgroundColor: 'var(--fd-muted)',
            borderRadius: '8px',
          }}>
            <span style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--fd-foreground)',
            }}>
              {currentStep + 1}
            </span>
            <span style={{
              fontSize: '14px',
              color: 'var(--fd-muted-foreground)',
            }}>
              / {totalSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Progress timeline */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: 'var(--fd-muted)',
        borderBottom: '1px solid var(--fd-border)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          {flow.steps.map((s, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => setCurrentStep(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: i === currentStep
                    ? 'var(--fd-primary)'
                    : i < currentStep
                    ? 'oklch(0.65 0.18 155)'
                    : 'var(--fd-background)',
                  color: i <= currentStep
                    ? 'white'
                    : 'var(--fd-muted-foreground)',
                  boxShadow: i === currentStep
                    ? '0 2px 8px -2px rgba(0, 0, 0, 0.3)'
                    : '0 1px 2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  transform: i === currentStep ? 'scale(1.1)' : 'scale(1)',
                }}
                title={s.title || `Step ${i + 1}`}
              >
                {i < currentStep ? '✓' : i + 1}
              </button>
              {i < flow.steps.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: i < currentStep
                    ? 'oklch(0.65 0.18 155)'
                    : 'var(--fd-border)',
                  transition: 'background-color 0.3s ease',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Current step info */}
        {step && (step.title || step.description) && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: 'var(--fd-background)',
            borderRadius: '8px',
            border: '1px solid var(--fd-border)',
          }}>
            {step.title && (
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--fd-foreground)',
              }}>
                {step.title}
              </h3>
            )}
            {step.description && (
              <p style={{
                margin: step.title ? '4px 0 0 0' : 0,
                fontSize: '13px',
                color: 'var(--fd-muted-foreground)',
              }}>
                {step.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Preview canvas */}
      <div style={{
        padding: '32px',
        backgroundColor: 'oklch(0.15 0.01 260)',
        // Subtle grid pattern
        backgroundImage: `
          linear-gradient(oklch(0.20 0.01 260) 1px, transparent 1px),
          linear-gradient(90deg, oklch(0.20 0.01 260) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '450px',
      }}>
        {/* Screen frame */}
        <div style={{
          width: '100%',
          maxWidth: '800px',
          backgroundColor: 'var(--fd-card)',
          borderRadius: '12px',
          boxShadow: `
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 8px 40px -8px rgba(0, 0, 0, 0.4),
            0 25px 80px -15px rgba(0, 0, 0, 0.3)
          `,
          overflow: 'hidden',
        }}>
          {/* Mini browser chrome */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: 'var(--fd-muted)',
            borderBottom: '1px solid var(--fd-border)',
          }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'oklch(0.70 0.18 25)' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'oklch(0.80 0.15 85)' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'oklch(0.70 0.18 145)' }} />
            </div>
            <div style={{
              flex: 1,
              marginLeft: '8px',
              padding: '4px 10px',
              backgroundColor: 'var(--fd-background)',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'var(--fd-font-mono)',
              color: 'var(--fd-muted-foreground)',
            }}>
              {step.screen}
            </div>
          </div>

          <iframe
            src={iframeUrl}
            style={{
              width: '100%',
              height: '400px',
              border: 'none',
              display: 'block',
              backgroundColor: 'white',
            }}
            title={`Flow: ${flow.name} - Step ${currentStep + 1}`}
          />
        </div>
      </div>

      {/* Navigation controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderTop: '1px solid var(--fd-border)',
        backgroundColor: 'var(--fd-card)',
      }}>
        <button
          onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid var(--fd-border)',
            borderRadius: '8px',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            backgroundColor: 'var(--fd-background)',
            color: currentStep === 0 ? 'var(--fd-muted-foreground)' : 'var(--fd-foreground)',
            opacity: currentStep === 0 ? 0.5 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          ← Previous
        </button>

        {/* Step notes */}
        {step && (step.note || step.trigger) && (
          <div style={{
            flex: 1,
            maxWidth: '400px',
            margin: '0 24px',
            padding: '8px 16px',
            backgroundColor: 'var(--fd-muted)',
            borderRadius: '8px',
            fontSize: '12px',
            textAlign: 'center',
          }}>
            {step.trigger && (
              <span style={{
                color: 'oklch(0.55 0.15 250)',
                fontWeight: 500,
              }}>
                {step.trigger}
              </span>
            )}
            {step.trigger && step.note && ' → '}
            {step.note && (
              <span style={{ color: 'var(--fd-muted-foreground)' }}>
                {step.note}
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => setCurrentStep(s => Math.min(totalSteps - 1, s + 1))}
          disabled={currentStep === totalSteps - 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            borderRadius: '8px',
            cursor: currentStep === totalSteps - 1 ? 'not-allowed' : 'pointer',
            backgroundColor: currentStep === totalSteps - 1 ? 'var(--fd-muted)' : 'var(--fd-primary)',
            color: currentStep === totalSteps - 1 ? 'var(--fd-muted-foreground)' : 'var(--fd-primary-foreground)',
            opacity: currentStep === totalSteps - 1 ? 0.5 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
