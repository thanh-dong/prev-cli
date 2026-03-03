import React, { useState, useRef, useEffect } from 'react'
import type { ApprovalStatus, AuditLogEntry } from '../types'
import { StatusBadge } from './StatusBadge'

const ALL_STATUSES: ApprovalStatus[] = ['draft', 'in-review', 'approved', 'needs-changes']

interface StatusDropdownProps {
  previewName: string
  status: ApprovalStatus
  onStatusChange: (status: ApprovalStatus) => void
  getAuditLog: () => AuditLogEntry[]
}

export function StatusDropdown({ previewName, status, onStatusChange, getAuditLog }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowLog(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const handleSelect = (s: ApprovalStatus) => {
    if (s !== status) onStatusChange(s)
    setIsOpen(false)
  }

  const handleToggleLog = () => {
    if (!showLog) setAuditLog(getAuditLog())
    setShowLog(!showLog)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
        title={`Status: ${status}`}
      >
        <StatusBadge status={status} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          backgroundColor: 'var(--fd-card)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          padding: '6px',
          zIndex: 50,
          minWidth: '180px',
        }}>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: s === status ? 600 : 400,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: s === status ? 'var(--fd-muted)' : 'transparent',
                color: 'var(--fd-foreground)',
                textAlign: 'left',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={e => {
                if (s !== status) e.currentTarget.style.backgroundColor = 'var(--fd-muted)'
              }}
              onMouseLeave={e => {
                if (s !== status) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <StatusBadge status={s} compact />
            </button>
          ))}

          <div style={{
            borderTop: '1px solid var(--fd-border)',
            marginTop: '4px',
            paddingTop: '4px',
          }}>
            <button
              onClick={handleToggleLog}
              style={{
                width: '100%',
                padding: '6px 12px',
                fontSize: '11px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: 'var(--fd-muted-foreground)',
                textAlign: 'left',
              }}
            >
              {showLog ? 'Hide' : 'Show'} History
            </button>

            {showLog && auditLog.length > 0 && (
              <div style={{
                maxHeight: '150px',
                overflowY: 'auto',
                padding: '4px 8px',
              }}>
                {auditLog.map((entry, i) => (
                  <div key={i} style={{
                    fontSize: '10px',
                    color: 'var(--fd-muted-foreground)',
                    padding: '3px 0',
                    borderBottom: i < auditLog.length - 1 ? '1px solid var(--fd-border)' : 'none',
                  }}>
                    <span style={{ fontWeight: 500 }}>{entry.changedBy}</span>
                    {' '}changed{' '}
                    <span style={{ textDecoration: 'line-through' }}>{entry.from}</span>
                    {' → '}{entry.to}
                    <div style={{ fontSize: '9px', opacity: 0.7 }}>
                      {new Date(entry.changedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showLog && auditLog.length === 0 && (
              <div style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--fd-muted-foreground)' }}>
                No history yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
