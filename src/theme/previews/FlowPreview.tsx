import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { PreviewUnit, FlowDefinition, FlowConfig, FlowStep } from '../../content/preview-types'
import { resolveRegionClick, navigateBack, canLinearNext } from './flow-navigation'
import { REGION_BRIDGE_SCRIPT } from '../../preview-runtime/region-bridge'

interface FlowPreviewProps {
  unit: PreviewUnit
}

interface FlowData {
  name: string
  description?: string
  steps: FlowStep[]
  _verification?: { errors: string[]; warnings: string[] }
}

// Detect if running in static build (no dev server)
const isStaticBuild = typeof window !== 'undefined' &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1')

export function FlowPreview({ unit }: FlowPreviewProps) {
  const [flow, setFlow] = useState<FlowData | null>(null)
  const [currentStepId, setCurrentStepId] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [outcomePicker, setOutcomePicker] = useState<{
    outcomes: Record<string, { goto: string; label?: string }>
  } | null>(null)
  const [regionRects, setRegionRects] = useState<Array<{ name: string; x: number; y: number; width: number; height: number }>>([])
  const [showOverlay, setShowOverlay] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null)

  // Load flow definition
  useEffect(() => {
    const config = unit.config as FlowConfig | undefined
    if (config?.steps && config.steps.length > 0) {
      const data: FlowData = {
        name: config.title || unit.name,
        description: config.description,
        steps: config.steps,
      }
      setFlow(data)
      const firstId = config.steps[0].id || 'step-0'
      setCurrentStepId(firstId)
      setHistory([firstId])
      setLoading(false)
      return
    }

    fetch(`/_preview-config/flows/${unit.name}`)
      .then(res => res.json())
      .then((data: FlowData & { _verification?: FlowData['_verification'] }) => {
        // Handle both legacy FlowDefinition and new FlowConfig format
        const steps = data.steps || (data as unknown as FlowDefinition).steps || []
        const flowData: FlowData = {
          name: data.name || (data as unknown as FlowDefinition).name || unit.name,
          description: data.description,
          steps,
          _verification: data._verification,
        }
        setFlow(flowData)
        if (steps.length > 0) {
          const firstId = steps[0].id || 'step-0'
          setCurrentStepId(firstId)
          setHistory([firstId])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [unit.name, unit.config])

  // Inject bridge script into iframe after load
  const injectBridge = useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe) return
    const tryInject = () => {
      try {
        const doc = iframe.contentDocument
        if (!doc) return
        // Inject bridge if not already present
        if (!doc.querySelector('[data-region-bridge]')) {
          const script = doc.createElement('script')
          script.setAttribute('data-region-bridge', 'true')
          script.textContent = REGION_BRIDGE_SCRIPT
          doc.body.appendChild(script)
        }

        // Highlight available regions for current step
        const step = currentStep
        if (step?.regions) {
          iframe.contentWindow?.postMessage({
            type: 'highlight-regions',
            regions: Object.keys(step.regions),
          }, '*')
        }
      } catch {
        // cross-origin — can't inject, bridge must be loaded separately
      }
    }
    // Try immediately and also on load
    tryInject()
    iframe.addEventListener('load', tryInject)
    return () => iframe.removeEventListener('load', tryInject)
  }, [flow, currentStepId])

  // Handle messages from iframe (region-click and region-rects)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return

      if (e.data.type === 'region-rects') {
        setRegionRects(e.data.rects || [])
        return
      }

      if (e.data.type !== 'region-click') return
      if (!flow || !currentStep) return

      const result = resolveRegionClick(currentStep, e.data.region)
      if (!result) return

      if (result.type === 'goto') {
        goToStep(result.stepId)
      } else if (result.type === 'pick') {
        setOutcomePicker({ outcomes: result.outcomes })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [flow, currentStepId])

  // Sync overlay toggle with iframe highlights
  useEffect(() => {
    const iframe = isFullscreen ? fullscreenIframeRef.current : iframeRef.current
    if (!iframe?.contentWindow || !currentStep) return
    if (showOverlay && currentStep.regions) {
      iframe.contentWindow.postMessage({
        type: 'highlight-regions',
        regions: Object.keys(currentStep.regions),
      }, '*')
    } else {
      iframe.contentWindow.postMessage({
        type: 'highlight-regions',
        regions: [],
      }, '*')
    }
  }, [showOverlay])

  // Derived state
  const steps = flow?.steps || []
  const currentStepIndex = steps.findIndex(s => s.id === currentStepId)
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null
  const hasRegions = currentStep?.regions && Object.keys(currentStep.regions).length > 0

  const goToStep = (stepId: string) => {
    setCurrentStepId(stepId)
    setHistory(prev => [...prev, stepId])
    setOutcomePicker(null)
    setRegionRects([]) // Clear overlay rects — will be re-reported after iframe loads
    // Highlight regions for new step
    setTimeout(() => {
      const iframe = isFullscreen ? fullscreenIframeRef.current : iframeRef.current
      const newStep = steps.find(s => s.id === stepId)
      if (iframe && newStep?.regions) {
        iframe.contentWindow?.postMessage({
          type: 'highlight-regions',
          regions: Object.keys(newStep.regions),
        }, '*')
      }
    }, 500) // Wait for iframe to load new content
  }

  const handleBack = () => {
    const result = navigateBack(history)
    if (result) {
      setCurrentStepId(result.stepId)
      setHistory(result.history)
      setOutcomePicker(null)
    }
  }

  const handleLinearNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1]
      const nextId = nextStep.id || `step-${currentStepIndex + 1}`
      goToStep(nextId)
    }
  }

  const handleLinearPrev = () => {
    if (currentStepIndex > 0) {
      handleBack()
    }
  }

  // Build iframe URL
  const screenName = currentStep
    ? (typeof currentStep.screen === 'string' ? currentStep.screen : currentStep.screen.ref)
    : ''
  const basePath = typeof window !== 'undefined'
    ? (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
    : ''
  const staticStatePath = currentStep?.state ? `${currentStep.state}/` : ''
  const iframeUrl = currentStep
    ? (isStaticBuild
        ? `${basePath}/_preview/screens/${screenName}/${staticStatePath}`
        : `/_preview-runtime?src=screens/${screenName}${currentStep.state ? `&state=${currentStep.state}` : ''}`)
    : ''

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

  if (!flow || steps.length === 0) {
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
          !
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

  const verificationWarnings = flow._verification?.warnings || []
  const verificationErrors = flow._verification?.errors || []

  // Region overlay click handler — same logic as region-click from iframe
  const handleOverlayRegionClick = (regionName: string) => {
    if (!currentStep) return
    const result = resolveRegionClick(currentStep, regionName)
    if (!result) return
    if (result.type === 'goto') {
      goToStep(result.stepId)
    } else if (result.type === 'pick') {
      setOutcomePicker({ outcomes: result.outcomes })
    }
  }

  // Figma-style region overlay rendered over the iframe
  const RegionOverlay = showOverlay && regionRects.length > 0 && (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 5,
    }}>
      {regionRects.map((rect, i) => (
        <div key={`${rect.name}-${i}`} style={{ position: 'absolute' }}>
          {/* Label badge */}
          <div style={{
            position: 'absolute',
            left: `${rect.x}px`,
            top: `${rect.y - 24}px`,
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'system-ui, sans-serif',
            color: 'white',
            backgroundColor: 'oklch(0.55 0.25 250)',
            padding: '2px 8px',
            borderRadius: '6px 6px 0 0',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            lineHeight: '18px',
          }}>
            {rect.name}
          </div>
          {/* Clickable region rectangle */}
          <div
            onClick={() => handleOverlayRegionClick(rect.name)}
            style={{
              position: 'absolute',
              left: `${rect.x}px`,
              top: `${rect.y}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              backgroundColor: 'oklch(0.65 0.25 250 / 0.12)',
              border: '2px solid oklch(0.65 0.25 250)',
              borderRadius: '4px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              animation: 'region-pulse 1.5s ease-out',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'oklch(0.65 0.25 250 / 0.22)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'oklch(0.65 0.25 250 / 0.12)'
            }}
            title={`Navigate: ${rect.name}`}
          />
        </div>
      ))}
      <style>{`
        @keyframes region-pulse {
          0% { opacity: 0; transform: scale(1.04); }
          50% { opacity: 1; transform: scale(1); }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )

  // Outcome picker overlay
  const OutcomePicker = outcomePicker && (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--fd-card)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.08)',
      padding: '16px',
      zIndex: 10,
      minWidth: '200px',
    }}>
      <p style={{
        margin: '0 0 12px',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--fd-muted-foreground)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Choose outcome
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {Object.entries(outcomePicker.outcomes).map(([key, outcome]) => (
          <button
            key={key}
            onClick={() => goToStep(outcome.goto)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid var(--fd-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: 'var(--fd-background)',
              color: 'var(--fd-foreground)',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--fd-primary)'
              e.currentTarget.style.color = 'var(--fd-primary-foreground)'
              e.currentTarget.style.borderColor = 'var(--fd-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--fd-background)'
              e.currentTarget.style.color = 'var(--fd-foreground)'
              e.currentTarget.style.borderColor = 'var(--fd-border)'
            }}
          >
            {outcome.label || key}
          </button>
        ))}
      </div>
      <button
        onClick={() => setOutcomePicker(null)}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          fontSize: '11px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          backgroundColor: 'transparent',
          color: 'var(--fd-muted-foreground)',
          width: '100%',
        }}
      >
        Cancel
      </button>
    </div>
  )

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'oklch(0.12 0.01 260)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Fullscreen header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: 'oklch(0.18 0.01 260)',
          borderBottom: '1px solid oklch(0.25 0.01 260)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {history.length > 1 && (
              <button
                onClick={handleBack}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  border: '1px solid oklch(0.35 0.01 260)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: 'oklch(0.25 0.01 260)',
                  color: 'oklch(0.9 0 0)',
                }}
              >
                Back
              </button>
            )}
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'oklch(0.95 0 0)' }}>
              {flow.name}
            </span>
            {currentStep?.title && (
              <span style={{
                padding: '2px 8px',
                fontSize: '11px',
                backgroundColor: 'oklch(0.25 0.01 260)',
                color: 'oklch(0.7 0 0)',
                borderRadius: '4px',
              }}>
                {currentStep.title}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Step indicator */}
            <span style={{ fontSize: '12px', color: 'oklch(0.6 0 0)' }}>
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            {hasRegions && (
              <button
                onClick={() => setShowOverlay(prev => !prev)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: showOverlay ? 'oklch(0.35 0.12 250)' : 'oklch(0.25 0.01 260)',
                  border: '1px solid oklch(0.35 0.01 260)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'oklch(0.9 0 0)',
                }}
                title={showOverlay ? 'Hide region overlay' : 'Show region overlay'}
              >
                {showOverlay ? '\u{1F441} Overlay' : '\u{1F441}\u{FE0F}\u{200D}\u{1F5E8}\u{FE0F} Overlay'}
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'oklch(0.25 0.01 260)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: 'oklch(0.9 0 0)',
              }}
            >
              Exit Fullscreen
            </button>
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <iframe
            ref={el => {
              (fullscreenIframeRef as React.MutableRefObject<HTMLIFrameElement | null>).current = el
              injectBridge(el)
            }}
            src={iframeUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'white',
              position: 'relative',
              zIndex: 0,
            }}
            title={`Flow: ${flow.name} - ${currentStep?.title || 'Step'}`}
          />
          {RegionOverlay}
          {OutcomePicker}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '16px',
      backgroundColor: 'var(--fd-card)',
      boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04)',
      flex: 1,
      minHeight: 0,
    }}>
      {/* Verification warnings banner */}
      {(verificationErrors.length > 0 || verificationWarnings.length > 0) && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: verificationErrors.length > 0 ? 'oklch(0.94 0.08 25)' : 'oklch(0.94 0.06 85)',
          borderBottom: '1px solid var(--fd-border)',
          fontSize: '12px',
          color: verificationErrors.length > 0 ? 'oklch(0.45 0.15 25)' : 'oklch(0.45 0.12 85)',
        }}>
          {verificationErrors.map((e, i) => <div key={`e${i}`}>Error: {e}</div>)}
          {verificationWarnings.map((w, i) => <div key={`w${i}`}>Warning: {w}</div>)}
        </div>
      )}

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
        {/* Left: Back + Flow name and step info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {history.length > 1 && (
            <button
              onClick={handleBack}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 500,
                border: '1px solid var(--fd-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: 'var(--fd-background)',
                color: 'var(--fd-foreground)',
                flexShrink: 0,
              }}
            >
              Back
            </button>
          )}
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
            {hasRegions ? '\u2B95' : '\u21E2'}
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
            {currentStep?.title && (
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: 'var(--fd-muted-foreground)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {currentStep.title}
                {hasRegions && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '1px 6px',
                    fontSize: '10px',
                    backgroundColor: 'oklch(0.92 0.08 250)',
                    color: 'oklch(0.45 0.18 250)',
                    borderRadius: '4px',
                  }}>
                    interactive
                  </span>
                )}
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
          {steps.map((s, i) => {
            const isVisited = history.includes(s.id || `step-${i}`)
            const isCurrent = i === currentStepIndex
            return (
              <React.Fragment key={s.id || i}>
                <button
                  onClick={() => goToStep(s.id || `step-${i}`)}
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
                    backgroundColor: isCurrent
                      ? 'var(--fd-primary)'
                      : isVisited
                      ? 'oklch(0.65 0.18 155)'
                      : 'var(--fd-background)',
                    color: isCurrent || isVisited
                      ? 'white'
                      : 'var(--fd-muted-foreground)',
                    transition: 'all 0.15s ease',
                  }}
                  title={s.title || `Step ${i + 1}`}
                >
                  {isVisited && !isCurrent ? '\u2713' : i + 1}
                </button>
                {i < steps.length - 1 && (
                  <div style={{
                    width: '12px',
                    height: '2px',
                    backgroundColor: isVisited && history.includes(steps[i + 1]?.id || `step-${i + 1}`)
                      ? 'oklch(0.65 0.18 155)'
                      : 'var(--fd-border)',
                  }} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Right: Navigation + fullscreen */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={handleLinearPrev}
            disabled={currentStepIndex <= 0}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid var(--fd-border)',
              borderRadius: '6px',
              cursor: currentStepIndex <= 0 ? 'not-allowed' : 'pointer',
              backgroundColor: 'var(--fd-background)',
              color: currentStepIndex <= 0 ? 'var(--fd-muted-foreground)' : 'var(--fd-foreground)',
              opacity: currentStepIndex <= 0 ? 0.5 : 1,
            }}
          >
            {'\u2190'}
          </button>
          {currentStep && canLinearNext(currentStep) && (
            <button
              onClick={handleLinearNext}
              disabled={currentStepIndex >= steps.length - 1}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                borderRadius: '6px',
                cursor: currentStepIndex >= steps.length - 1 ? 'not-allowed' : 'pointer',
                backgroundColor: currentStepIndex >= steps.length - 1 ? 'var(--fd-border)' : 'var(--fd-primary)',
                color: currentStepIndex >= steps.length - 1 ? 'var(--fd-muted-foreground)' : 'var(--fd-primary-foreground)',
                opacity: currentStepIndex >= steps.length - 1 ? 0.5 : 1,
              }}
            >
              {'\u2192'}
            </button>
          )}
          {hasRegions && (
            <button
              onClick={() => setShowOverlay(prev => !prev)}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 500,
                border: '1px solid var(--fd-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: showOverlay ? 'oklch(0.92 0.08 250)' : 'var(--fd-background)',
                color: showOverlay ? 'oklch(0.45 0.18 250)' : 'var(--fd-foreground)',
              }}
              title={showOverlay ? 'Hide region overlay' : 'Show region overlay'}
            >
              {showOverlay ? '\u25C9' : '\u25CE'}
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(true)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid var(--fd-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: 'var(--fd-background)',
              color: 'var(--fd-foreground)',
            }}
            title="Fullscreen"
          >
            {'\u26F6'}
          </button>
        </div>
      </div>

      {/* Preview canvas */}
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
        position: 'relative',
        flex: 1,
        minHeight: 0,
      }}>
        <div style={{
          width: '100%',
          backgroundColor: 'var(--fd-card)',
          borderRadius: '8px',
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1), 0 4px 20px -4px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
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
              {screenName}{currentStep?.state ? `/${currentStep.state}` : ''}
            </div>
          </div>

          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <iframe
              ref={el => {
                (iframeRef as React.MutableRefObject<HTMLIFrameElement | null>).current = el
                injectBridge(el)
              }}
              src={iframeUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                backgroundColor: 'white',
              }}
              title={`Flow: ${flow.name} - ${currentStep?.title || `Step ${currentStepIndex + 1}`}`}
            />
            {RegionOverlay}
          </div>
        </div>

        {/* Outcome picker floating panel */}
        {OutcomePicker}
      </div>
    </div>
  )
}
