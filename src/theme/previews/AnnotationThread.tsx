import React, { useState } from 'react'
import type { Annotation, AnnotationCategory } from '../types'
import { Icon } from '../icons'

const CATEGORY_LABELS: Record<AnnotationCategory, string> = {
  bug: 'Bug',
  copy: 'Copy',
  design: 'Design',
  general: 'General',
}

const CATEGORY_STYLES: Record<AnnotationCategory, { bg: string; color: string; border: string }> = {
  bug: {
    bg: 'oklch(0.92 0.08 25)',
    color: 'oklch(0.45 0.15 25)',
    border: 'oklch(0.85 0.12 25)',
  },
  copy: {
    bg: 'oklch(0.92 0.08 250)',
    color: 'oklch(0.45 0.18 250)',
    border: 'oklch(0.85 0.10 250)',
  },
  design: {
    bg: 'oklch(0.92 0.08 310)',
    color: 'oklch(0.45 0.18 310)',
    border: 'oklch(0.85 0.10 310)',
  },
  general: {
    bg: 'oklch(0.94 0.06 85)',
    color: 'oklch(0.45 0.12 85)',
    border: 'oklch(0.88 0.08 85)',
  },
}

interface AnnotationThreadProps {
  annotation: Annotation
  onAddComment: (text: string) => void
  onResolve: () => void
  onDelete: () => void
  onClose: () => void
}

export function AnnotationThread({ annotation, onAddComment, onResolve, onDelete, onClose }: AnnotationThreadProps) {
  const [newComment, setNewComment] = useState('')
  const catStyle = CATEGORY_STYLES[annotation.category]

  const handleSubmit = () => {
    const text = newComment.trim()
    if (!text) return
    onAddComment(text)
    setNewComment('')
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: `${annotation.x}%`,
        top: `${annotation.y}%`,
        transform: 'translate(12px, -12px)',
        width: '280px',
        backgroundColor: 'var(--fd-card)',
        borderRadius: '12px',
        boxShadow: '0 12px 40px -8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.06)',
        zIndex: 30,
        overflow: 'hidden',
        fontSize: '13px',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--fd-border)',
        backgroundColor: 'var(--fd-muted)',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: 600,
          borderRadius: '6px',
          border: `1px solid ${catStyle.border}`,
          backgroundColor: catStyle.bg,
          color: catStyle.color,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: catStyle.color,
          }} />
          {CATEGORY_LABELS[annotation.category]}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'var(--fd-muted-foreground)',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Close"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Comments */}
      <div style={{
        maxHeight: '240px',
        overflowY: 'auto',
        padding: '8px 0',
      }}>
        {annotation.comments.map(comment => (
          <div key={comment.id} style={{
            padding: '6px 12px',
            borderBottom: '1px solid var(--fd-border)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '3px',
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--fd-foreground)',
              }}>
                {comment.author}
              </span>
              <span style={{
                fontSize: '10px',
                color: 'var(--fd-muted-foreground)',
                whiteSpace: 'nowrap',
              }}>
                {formatTime(comment.createdAt)}
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--fd-foreground)',
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}>
              {comment.text}
            </p>
          </div>
        ))}
      </div>

      {/* Add comment */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid var(--fd-border)',
        display: 'flex',
        gap: '6px',
      }}>
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="Add a comment..."
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '12px',
            border: '1px solid var(--fd-border)',
            borderRadius: '6px',
            backgroundColor: 'var(--fd-background)',
            color: 'var(--fd-foreground)',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'var(--fd-primary)',
            color: 'var(--fd-primary-foreground)',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
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
          onClick={onResolve}
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 500,
            border: '1px solid var(--fd-border)',
            borderRadius: '6px',
            backgroundColor: annotation.resolved ? 'oklch(0.92 0.08 85)' : 'oklch(0.92 0.08 155)',
            color: annotation.resolved ? 'oklch(0.45 0.12 85)' : 'oklch(0.35 0.12 155)',
            cursor: 'pointer',
          }}
        >
          {annotation.resolved ? 'Unresolve' : 'Resolve'}
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 500,
            border: '1px solid oklch(0.85 0.12 25)',
            borderRadius: '6px',
            backgroundColor: 'oklch(0.92 0.08 25)',
            color: 'oklch(0.45 0.15 25)',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
