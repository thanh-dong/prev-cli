import React, { useState, useEffect, useRef } from 'react'
import type { PreviewUnit } from '../../content/preview-types'
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

interface PreviewMessage {
  type: 'ready' | 'init' | 'update' | 'built' | 'error'
  config?: unknown
  result?: unknown
  error?: string
}

interface ComponentPreviewProps {
  unit: PreviewUnit
}

// Detect if running in static build (no dev server)
const isStaticBuild = typeof window !== 'undefined' &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1')

export function ComponentPreview({ unit }: ComponentPreviewProps) {
  const [props, _setProps] = useState<Record<string, unknown>>({})
  const [schema, setSchema] = useState<unknown>(null)
  const [buildStatus, setBuildStatus] = useState<'loading' | 'building' | 'ready' | 'error'>('loading')
  const [buildError, setBuildError] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [viewport, setViewport] = useViewport()
  const { status: approvalStatus, changeStatus, getAuditLog } = useApprovalStatus(`components/${unit.name}`)
  const [annotationsEnabled, setAnnotationsEnabled] = useState(false)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showTokens, setShowTokens] = useState(false)
  const { snapshots, captureSnapshot, deleteSnapshot } = useSnapshots(`components/${unit.name}`)
  const { overrides: tokenOverrides, setOverride, removeOverride, resetAll, toCssOverrides } = useTokenOverrides()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load schema if available
  useEffect(() => {
    if (unit.files.schema) {
      import(`/_preview/components/${unit.name}/${unit.files.schema}`)
        .then(mod => setSchema(mod.schema))
        .catch(() => {})
    }
  }, [unit])

  // Build iframe URL - use static path for production, runtime for dev
  const baseUrl = typeof window !== 'undefined'
    ? (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
    : ''
  const iframeUrl = isStaticBuild
    ? `${baseUrl}/_preview/components/${unit.name}/`
    : `/_preview-runtime?preview=components/${unit.name}`

  // Skip spinner immediately for static builds (runs after hydration)
  useEffect(() => {
    if (isStaticBuild) {
      setBuildStatus('ready')
    }
  }, [])

  // Track iframe load state for opacity hint
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => setIframeLoaded(true)
    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [])

  // Initialize preview runtime - fetch config and send to iframe (dev mode only)
  useEffect(() => {
    if (isStaticBuild) return

    const iframe = iframeRef.current
    if (!iframe) return

    let configSent = false

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data as PreviewMessage

      if (msg.type === 'ready' && !configSent) {
        configSent = true
        setBuildStatus('building')

        fetch(`/_preview-config/components/${unit.name}`)
          .then(res => res.json())
          .then((config) => {
            iframe.contentWindow?.postMessage({ type: 'init', config } as PreviewMessage, '*')
          })
          .catch(err => {
            setBuildStatus('error')
            setBuildError(`Failed to load preview config: ${err.message}`)
          })
      }

      if (msg.type === 'built') {
        const result = msg.result as { success: boolean; error?: string }
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
        setBuildError(msg.error || 'Unknown error')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [unit.name])

  // Send token overrides to iframe
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const css = toCssOverrides()
    iframe.contentWindow.postMessage({ type: 'token-overrides', css }, '*')
  }, [tokenOverrides, buildStatus])

  // Status badge styles
  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'stable':
        return {
          backgroundColor: 'oklch(0.92 0.08 155)',
          color: 'oklch(0.35 0.12 155)',
          borderColor: 'oklch(0.85 0.10 155)',
        }
      case 'deprecated':
        return {
          backgroundColor: 'oklch(0.92 0.08 25)',
          color: 'oklch(0.45 0.15 25)',
          borderColor: 'oklch(0.85 0.12 25)',
        }
      default: // draft
        return {
          backgroundColor: 'oklch(0.94 0.06 85)',
          color: 'oklch(0.45 0.12 85)',
          borderColor: 'oklch(0.88 0.08 85)',
        }
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: 'var(--fd-card)',
        boxShadow: isHovered
          ? '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          : '0 4px 20px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header - Editorial style */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--fd-border)',
        background: 'linear-gradient(to bottom, var(--fd-card), var(--fd-muted))',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              {/* Component icon */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--fd-primary) 0%, oklch(0.45 0.12 280) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--fd-primary-foreground)',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.2)',
              }}>
                ◇
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--fd-foreground)',
                letterSpacing: '-0.02em',
              }}>
                {unit.config?.title || unit.name}
              </h2>
            </div>
            {unit.config?.description && (
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--fd-muted-foreground)',
                lineHeight: 1.5,
                paddingLeft: '44px',
              }}>
                {unit.config.description}
              </p>
            )}
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
              previewName: `components/${unit.name}`,
              stateOrStep: 'index',
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
            <ViewportControls viewport={viewport} onViewportChange={setViewport} />
            <StatusDropdown
              previewName={`components/${unit.name}`}
              status={approvalStatus}
              onStatusChange={changeStatus}
              getAuditLog={getAuditLog}
            />
            {/* Build status indicator */}
            {buildStatus === 'building' && (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'oklch(0.75 0.15 85)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            )}
            {buildStatus === 'ready' && (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'oklch(0.65 0.18 155)',
              }} />
            )}

            {unit.config?.status && (
              <span style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                ...getStatusStyle(unit.config.status),
              }}>
                {unit.config.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Canvas area - Component showcase */}
      <div style={{
        position: 'relative',
        padding: '40px',
        minHeight: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Elegant dot grid pattern
        backgroundColor: 'var(--fd-muted)',
        backgroundImage: `
          radial-gradient(circle at center, var(--fd-border) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        backgroundPosition: '12px 12px',
      }}>
        {/* Canvas container with subtle inner shadow */}
        <AnnotationLayer
          previewName={`components/${unit.name}`}
          stateOrStep="index"
          enabled={annotationsEnabled}
        >
          <div style={{
            position: 'relative',
            width: viewport === 'desktop' ? '100%' : VIEWPORT_WIDTHS[viewport],
            maxWidth: '600px',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: 'var(--fd-background)',
            borderRadius: '12px',
            boxShadow: `
              0 0 0 1px var(--fd-border),
              0 4px 16px -4px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
            `,
            overflow: 'hidden',
          }}>
            {/* Error overlay */}
            {buildStatus === 'error' && buildError && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(254, 242, 242, 0.95)',
                backdropFilter: 'blur(4px)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  fontSize: '24px',
                }}>
                  ✕
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#dc2626',
                  fontFamily: 'var(--fd-font-mono)',
                  textAlign: 'center',
                  maxWidth: '400px',
                  lineHeight: 1.5,
                }}>
                  {buildError}
                </p>
              </div>
            )}

            {/* Loading state */}
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
                border: 'none',
                width: '100%',
                height: '220px',
                display: 'block',
                opacity: (isStaticBuild ? iframeLoaded : buildStatus === 'ready') ? 1 : 0.3,
                transition: 'opacity 0.3s ease',
              }}
              title={`Preview: ${unit.name}`}
            />
          </div>
        </AnnotationLayer>
      </div>

      {/* Props panel - Refined */}
      {schema && (
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--fd-border)',
          backgroundColor: 'var(--fd-card)',
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--fd-muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Properties
          </h3>
          <pre style={{
            margin: 0,
            padding: '16px',
            fontSize: '12px',
            backgroundColor: 'var(--fd-muted)',
            borderRadius: '8px',
            fontFamily: 'var(--fd-font-mono)',
            overflow: 'auto',
            border: '1px solid var(--fd-border)',
          }}>
            {JSON.stringify(props, null, 2)}
          </pre>
        </div>
      )}

      {/* Tags - Pill style */}
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
                transition: 'all 0.15s ease',
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
