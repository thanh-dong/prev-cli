import React, { useState, useEffect, useRef } from 'react'
import type { PreviewUnit } from '../../content/preview-types'
import type { PreviewConfig, PreviewMessage, BuildResult } from '../../preview-runtime/types'
import { useViewport, VIEWPORT_WIDTHS } from '../hooks/useViewport'
import { ViewportControls } from './ViewportControls'
import { useApprovalStatus } from '../hooks/useApprovalStatus'
import { StatusDropdown } from './StatusDropdown'
import { AnnotationLayer } from './AnnotationLayer'
import { SnapshotButton } from './SnapshotButton'
import { SnapshotPanel } from './SnapshotPanel'
import { useSnapshots } from '../hooks/useSnapshots'
import { useTokenOverrides } from '../hooks/useTokenOverrides'
import { TokenPlayground } from './TokenPlayground'
import { Icon } from '../icons'
import { tokens as designTokens } from 'virtual:prev-tokens'

interface ScreenPreviewProps {
  unit: PreviewUnit
  initialState?: string
}

// Detect if running in static build (no dev server)
const isStaticBuild = typeof window !== 'undefined' &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1')

export function ScreenPreview({ unit, initialState }: ScreenPreviewProps) {
  const states = ['index', ...(unit.files.states || []).map(s => s.replace(/\.(tsx|jsx)$/, ''))]
  const [activeState, setActiveState] = useState(initialState || 'index')
  const [viewport, setViewport] = useViewport()
  const { status: approvalStatus, changeStatus, getAuditLog } = useApprovalStatus(`screens/${unit.name}`)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [buildStatus, setBuildStatus] = useState<'loading' | 'building' | 'ready' | 'error'>('loading')
  const [buildError, setBuildError] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [annotationsEnabled, setAnnotationsEnabled] = useState(false)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showTokens, setShowTokens] = useState(false)
  const { snapshots, captureSnapshot, deleteSnapshot } = useSnapshots(`screens/${unit.name}`)
  const { overrides: tokenOverrides, setOverride, removeOverride, resetAll, toCssOverrides } = useTokenOverrides()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null)

  // Build iframe URL - use static path for production, runtime for dev
  const baseUrl = typeof window !== 'undefined'
    ? (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
    : ''
  // For static builds: default state is in root, other states are in subdirs
  const staticStatePath = activeState === 'index' ? '' : `${activeState}/`
  const iframeUrl = isStaticBuild
    ? `${baseUrl}/_preview/screens/${unit.name}/${staticStatePath}`
    : `/_preview-runtime?preview=screens/${unit.name}&state=${activeState}`

  // Skip spinner immediately for static builds (runs after hydration)
  useEffect(() => {
    if (isStaticBuild) {
      setBuildStatus('ready')
    }
  }, [])

  // Track iframe load state for opacity hint
  useEffect(() => {
    const iframe = isFullscreen ? fullscreenIframeRef.current : iframeRef.current
    if (!iframe) return

    const handleLoad = () => setIframeLoaded(true)
    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [isFullscreen])

  // Initialize preview runtime - fetch config and send to iframe (dev mode only)
  useEffect(() => {
    if (isStaticBuild) return

    const iframe = isFullscreen ? fullscreenIframeRef.current : iframeRef.current
    if (!iframe) return

    let configSent = false

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data as PreviewMessage

      if (msg.type === 'ready' && !configSent) {
        configSent = true
        setBuildStatus('building')

        fetch(`/_preview-config/screens/${unit.name}`)
          .then(res => res.json())
          .then((config: PreviewConfig) => {
            iframe.contentWindow?.postMessage({ type: 'init', config } as PreviewMessage, '*')
          })
          .catch(err => {
            setBuildStatus('error')
            setBuildError(`Failed to load preview config: ${err.message}`)
          })
      }

      if (msg.type === 'built') {
        const result = msg.result as BuildResult
        if (result.success) {
          setBuildStatus('ready')
          setBuildError(null)
        } else {
          setBuildStatus('error')
          setBuildError(result.error || 'Build failed')
        }
      }

      if (msg.type === 'error') {
        setBuildStatus('error')
        setBuildError(msg.error)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [unit.name, activeState, isFullscreen])

  // Send token overrides to iframe
  useEffect(() => {
    const iframe = isFullscreen ? fullscreenIframeRef.current : iframeRef.current
    if (!iframe?.contentWindow) return
    const css = toCssOverrides()
    iframe.contentWindow.postMessage({ type: 'token-overrides', css }, '*')
  }, [tokenOverrides, isFullscreen, buildStatus])

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
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'oklch(0.95 0 0)',
            }}>
              {unit.config?.title || unit.name}
            </span>
            <span style={{
              padding: '2px 8px',
              fontSize: '11px',
              backgroundColor: 'oklch(0.25 0.01 260)',
              color: 'oklch(0.7 0 0)',
              borderRadius: '4px',
            }}>
              {activeState === 'index' ? 'default' : activeState}
            </span>
          </div>
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
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.35 0.01 260)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.25 0.01 260)'
            }}
          >
            Exit Fullscreen
          </button>
        </div>
        <iframe
          ref={fullscreenIframeRef}
          src={iframeUrl}
          style={{
            width: '100%',
            flex: 1,
            border: 'none',
            backgroundColor: 'white',
          }}
          title={`Screen: ${unit.name}`}
        />
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '16px',
      overflow: 'hidden',
      backgroundColor: 'var(--fd-card)',
      boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04)',
    }}>
      {/* Header with state tabs */}
      <div style={{
        padding: '16px 24px',
        background: 'linear-gradient(to bottom, var(--fd-card), var(--fd-muted))',
        borderBottom: '1px solid var(--fd-border)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Screen icon */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, oklch(0.55 0.15 250) 0%, oklch(0.45 0.18 280) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.25)',
            }}>
              ▣
            </div>

            <div>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--fd-foreground)',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                {unit.config?.title || unit.name}
                {buildStatus === 'building' && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'oklch(0.75 0.15 85)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                )}
              </h2>
              {unit.config?.description && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: 'var(--fd-muted-foreground)',
                }}>
                  {unit.config.description}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setAnnotationsEnabled(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: annotationsEnabled ? 'oklch(0.92 0.08 250)' : 'var(--fd-muted)',
                color: annotationsEnabled ? 'oklch(0.45 0.18 250)' : 'var(--fd-muted-foreground)',
                transition: 'all 0.15s ease',
              }}
              title={annotationsEnabled ? 'Disable annotations' : 'Enable annotations'}
            >
              <Icon name="pin" size={14} />
            </button>
            <SnapshotButton onCapture={() => captureSnapshot(iframeRef, {
              previewName: `screens/${unit.name}`,
              stateOrStep: activeState,
              viewport,
            })} />
            <button
              onClick={() => setShowSnapshots(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: 'var(--fd-muted)',
                color: 'var(--fd-muted-foreground)',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              title="View snapshots"
            >
              <Icon name="camera" size={14} />
              {snapshots.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--fd-primary)',
                  color: 'var(--fd-primary-foreground)',
                  fontSize: '9px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>{snapshots.length}</span>
              )}
            </button>
            <button
              onClick={() => setShowTokens(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: showTokens ? 'oklch(0.92 0.08 310)' : 'var(--fd-muted)',
                color: showTokens ? 'oklch(0.45 0.18 310)' : 'var(--fd-muted-foreground)',
                transition: 'all 0.15s ease',
              }}
              title="Token playground"
            >
              <Icon name="palette" size={14} />
            </button>
            <StatusDropdown
              previewName={`screens/${unit.name}`}
              status={approvalStatus}
              onStatusChange={changeStatus}
              getAuditLog={getAuditLog}
            />
          </div>

          {/* State tabs */}
          {states.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '2px',
              backgroundColor: 'var(--fd-muted)',
              padding: '3px',
              borderRadius: '10px',
            }}>
              {states.map(state => (
                <button
                  key={state}
                  onClick={() => setActiveState(state)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    backgroundColor: activeState === state ? 'var(--fd-background)' : 'transparent',
                    color: activeState === state ? 'var(--fd-foreground)' : 'var(--fd-muted-foreground)',
                    boxShadow: activeState === state ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {state === 'index' ? 'Default' : state}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Build error display */}
      {buildError && (
        <div style={{
          padding: '16px 24px',
          backgroundColor: 'oklch(0.97 0.02 25)',
          borderBottom: '1px solid oklch(0.90 0.05 25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'oklch(0.65 0.20 25)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            flexShrink: 0,
          }}>!</div>
          <pre style={{
            margin: 0,
            fontSize: '12px',
            color: 'oklch(0.45 0.15 25)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--fd-font-mono)',
            overflow: 'auto',
            maxHeight: '100px',
            flex: 1,
          }}>
            {buildError}
          </pre>
        </div>
      )}

      {/* Preview canvas with browser frame */}
      <div style={{
        padding: '32px',
        backgroundColor: 'var(--fd-muted)',
        // Subtle cross-hatch pattern
        backgroundImage: `
          linear-gradient(45deg, transparent 48%, var(--fd-border) 49%, var(--fd-border) 51%, transparent 52%),
          linear-gradient(-45deg, transparent 48%, var(--fd-border) 49%, var(--fd-border) 51%, transparent 52%)
        `,
        backgroundSize: '12px 12px',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '500px',
      }}>
        {/* Browser frame */}
        <div
          style={{
            width: viewport === 'desktop' ? '100%' : VIEWPORT_WIDTHS[viewport],
            maxWidth: '100%',
            backgroundColor: 'var(--fd-card)',
            borderRadius: '12px',
            boxShadow: `
              0 0 0 1px var(--fd-border),
              0 8px 32px -8px rgba(0, 0, 0, 0.15),
              0 20px 60px -15px rgba(0, 0, 0, 0.1)
            `,
            overflow: 'hidden',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Browser chrome */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'var(--fd-muted)',
            borderBottom: '1px solid var(--fd-border)',
          }}>
            {/* Traffic lights */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'oklch(0.70 0.18 25)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'oklch(0.80 0.15 85)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'oklch(0.70 0.18 145)' }} />
            </div>

            {/* URL bar */}
            <div style={{
              flex: 1,
              marginLeft: '8px',
              padding: '6px 12px',
              backgroundColor: 'var(--fd-background)',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'var(--fd-font-mono)',
              color: 'var(--fd-muted-foreground)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              screens/{unit.name}/{activeState === 'index' ? '' : activeState}
            </div>

            {/* Fullscreen button */}
            <button
              onClick={() => setIsFullscreen(true)}
              style={{
                padding: '6px 10px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--fd-muted-foreground)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--fd-secondary)'
                e.currentTarget.style.color = 'var(--fd-foreground)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--fd-muted-foreground)'
              }}
              title="Fullscreen"
            >
              ⛶
            </button>
          </div>

          {/* Screen content */}
          <AnnotationLayer
            previewName={`screens/${unit.name}`}
            stateOrStep={activeState}
            enabled={annotationsEnabled}
          >
            <div style={{ position: 'relative' }}>
              {buildStatus === 'loading' && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'var(--fd-background)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
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
              )}
              <iframe
                ref={iframeRef}
                src={iframeUrl}
                style={{
                  width: '100%',
                  height: '500px',
                  border: 'none',
                  display: 'block',
                  backgroundColor: 'white',
                  opacity: (isStaticBuild ? iframeLoaded : buildStatus === 'ready') ? 1 : 0.5,
                  transition: 'opacity 0.3s ease',
                }}
                title={`Screen: ${unit.name} - ${activeState}`}
              />
            </div>
          </AnnotationLayer>
        </div>
      </div>

      {/* Viewport controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        borderTop: '1px solid var(--fd-border)',
        backgroundColor: 'var(--fd-card)',
      }}>
        <ViewportControls viewport={viewport} onViewportChange={setViewport} />
      </div>

      {/* Tags */}
      {unit.config?.tags && unit.config.tags.length > 0 && (
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--fd-border)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          backgroundColor: 'var(--fd-card)',
        }}>
          {unit.config.tags.map(tag => (
            <span
              key={tag}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: 'var(--fd-muted)',
                color: 'var(--fd-muted-foreground)',
                borderRadius: '100px',
                border: '1px solid var(--fd-border)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Panels */}
      {showSnapshots && (
        <SnapshotPanel
          snapshots={snapshots}
          onDelete={deleteSnapshot}
          onClose={() => setShowSnapshots(false)}
        />
      )}
      {showTokens && (
        <TokenPlayground
          tokens={designTokens}
          overrides={tokenOverrides}
          onSetOverride={setOverride}
          onRemoveOverride={removeOverride}
          onResetAll={resetAll}
          onClose={() => setShowTokens(false)}
        />
      )}

      {/* Inline styles for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
