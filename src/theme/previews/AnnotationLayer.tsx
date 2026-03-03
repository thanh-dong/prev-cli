import React, { useState, useRef, useEffect } from 'react'
import type { AnnotationCategory } from '../types'
import { useAnnotations } from '../hooks/useAnnotations'
import { AnnotationPin } from './AnnotationPin'
import { AnnotationThread } from './AnnotationThread'
import { Icon } from '../icons'

const CATEGORY_COLORS: Record<AnnotationCategory, string> = {
  bug: 'oklch(0.65 0.20 25)',
  copy: 'oklch(0.65 0.15 250)',
  design: 'oklch(0.65 0.18 310)',
  general: 'oklch(0.65 0.10 85)',
}

const CATEGORIES: AnnotationCategory[] = ['bug', 'copy', 'design', 'general']

interface AnnotationLayerProps {
  previewName: string
  stateOrStep: string
  enabled: boolean
  children: React.ReactNode
}

interface PendingPin {
  x: number
  y: number
}

export function AnnotationLayer({ previewName, stateOrStep, enabled, children }: AnnotationLayerProps) {
  const { annotations, createAnnotation, addComment, resolveAnnotation, deleteAnnotation } =
    useAnnotations(previewName, stateOrStep)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingPin | null>(null)
  const [pendingCategory, setPendingCategory] = useState<AnnotationCategory>('general')
  const [pendingText, setPendingText] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Filter annotations for the current state/step
  const visible = annotations.filter(a => a.stateOrStep === stateOrStep)

  // Close on outside click
  useEffect(() => {
    if (!activeId && !pending) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveId(null)
        setPending(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [activeId, pending])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setActiveId(null)
    setPending({ x, y })
    setPendingCategory('general')
    setPendingText('')
  }

  const handleCreate = () => {
    const text = pendingText.trim()
    if (!text || !pending) return
    createAnnotation(pending.x, pending.y, pendingCategory, text)
    setPending(null)
    setPendingText('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {children}

      {/* Clickable overlay when annotation mode is enabled */}
      {enabled && (
        <div
          onClick={handleOverlayClick}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'crosshair',
            zIndex: 15,
          }}
        />
      )}

      {/* Existing pins */}
      {visible.map((a, i) => (
        <AnnotationPin
          key={a.id}
          x={a.x}
          y={a.y}
          index={i + 1}
          category={a.category}
          resolved={a.resolved}
          isActive={activeId === a.id}
          onClick={() => {
            setActiveId(activeId === a.id ? null : a.id)
            setPending(null)
          }}
        />
      ))}

      {/* Active thread */}
      {activeId && (() => {
        const annotation = visible.find(a => a.id === activeId)
        if (!annotation) return null
        return (
          <AnnotationThread
            annotation={annotation}
            onAddComment={(text) => addComment(annotation.id, text)}
            onResolve={() => resolveAnnotation(annotation.id)}
            onDelete={() => {
              deleteAnnotation(annotation.id)
              setActiveId(null)
            }}
            onClose={() => setActiveId(null)}
          />
        )
      })()}

      {/* New annotation form */}
      {pending && (
        <div
          ref={formRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: `${pending.x}%`,
            top: `${pending.y}%`,
            transform: 'translate(12px, -12px)',
            width: '240px',
            backgroundColor: 'var(--fd-card)',
            borderRadius: '12px',
            boxShadow: '0 12px 40px -8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            zIndex: 30,
            overflow: 'hidden',
            fontSize: '13px',
          }}
        >
          {/* Category selector */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--fd-border)',
            backgroundColor: 'var(--fd-muted)',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--fd-muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '8px',
            }}>
              Category
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setPendingCategory(cat)}
                  title={cat}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: pendingCategory === cat
                      ? '2px solid var(--fd-foreground)'
                      : '2px solid transparent',
                    backgroundColor: CATEGORY_COLORS[cat],
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: pendingCategory === cat
                      ? `0 0 0 2px var(--fd-card), 0 0 0 4px ${CATEGORY_COLORS[cat]}`
                      : 'none',
                    transition: 'box-shadow 0.15s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Comment input */}
          <div style={{ padding: '10px 12px' }}>
            <textarea
              value={pendingText}
              onChange={e => setPendingText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleCreate()
                }
              }}
              placeholder="Describe the issue..."
              autoFocus
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12px',
                border: '1px solid var(--fd-border)',
                borderRadius: '6px',
                backgroundColor: 'var(--fd-background)',
                color: 'var(--fd-foreground)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid var(--fd-border)',
            display: 'flex',
            gap: '6px',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={() => setPending(null)}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 500,
                border: '1px solid var(--fd-border)',
                borderRadius: '6px',
                backgroundColor: 'var(--fd-background)',
                color: 'var(--fd-muted-foreground)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'var(--fd-primary)',
                color: 'var(--fd-primary-foreground)',
                cursor: 'pointer',
                opacity: pendingText.trim() ? 1 : 0.5,
              }}
              disabled={!pendingText.trim()}
            >
              Add Pin
            </button>
          </div>
        </div>
      )}

      {/* Pending pin marker */}
      {pending && (
        <div style={{
          position: 'absolute',
          left: `${pending.x}%`,
          top: `${pending.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: '2px solid white',
          backgroundColor: CATEGORY_COLORS[pendingCategory],
          boxShadow: `0 0 0 3px ${CATEGORY_COLORS[pendingCategory]}, 0 2px 8px rgba(0, 0, 0, 0.3)`,
          zIndex: 22,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon name="pin" size={14} style={{ color: 'white' }} />
        </div>
      )}
    </div>
  )
}
