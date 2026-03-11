import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { crGroups } from 'virtual:prev-crs'
import type { CRGroup } from 'virtual:prev-crs'
import { Icon } from './icons'
import './CRPanel.css'

interface CRPanelProps {
  onClose: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: 'Draft',          color: '#92400e', bg: '#fef3c7' },
  pending_review: { label: 'In Review',      color: '#1e40af', bg: '#dbeafe' },
  approved:       { label: 'Approved',       color: '#065f46', bg: '#d1fae5' },
  merged:         { label: 'Merged',         color: '#5b21b6', bg: '#ede9fe' },
  rejected:       { label: 'Rejected',       color: '#991b1b', bg: '#fee2e2' },
}

function CRStatusBadge({ status }: { status?: string }) {
  if (!status) return null
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#374151', bg: '#f3f4f6' }
  return (
    <span className="cr-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  )
}

function CRGroupItem({ group, currentPath, onNavigate }: {
  group: CRGroup
  currentPath: string
  onNavigate: () => void
}) {
  const [isOpen, setIsOpen] = useState(() =>
    group.pages.some(p => p.route === currentPath)
  )

  const hasPages = group.pages.length > 0
  const label = group.slug
    ? group.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : group.cr_id

  return (
    <div className="cr-group">
      <button
        className="cr-group-header"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
      >
        <Icon
          name="chevron-right"
          size={13}
          className={`cr-chevron ${isOpen ? 'open' : ''}`}
        />
        <span className="cr-group-id">{group.cr_id}</span>
        <span className="cr-group-label">{label}</span>
        <CRStatusBadge status={group.status} />
      </button>

      {isOpen && hasPages && (
        <div className="cr-group-pages">
          {group.pages.map(page => {
            const isActive = currentPath === page.route
            return (
              <Link
                key={page.route}
                to={page.route}
                className={`cr-page-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <Icon name="file" size={12} className="cr-page-icon" />
                {page.title}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CRPanel({ onClose }: CRPanelProps) {
  const location = useLocation()
  const panelRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const isEmpty = crGroups.length === 0

  const content = (
    <>
      <div className="cr-panel-header">
        <div className="cr-panel-title">
          <Icon name="git-pr" size={15} />
          <span>Change Requests</span>
          {!isEmpty && (
            <span className="cr-count-badge">{crGroups.length}</span>
          )}
        </div>
        <button className="cr-close-btn" onClick={onClose}>
          <Icon name="x" size={16} />
        </button>
      </div>

      <div className="cr-panel-body">
        {isEmpty ? (
          <div className="cr-empty">
            <Icon name="git-pr" size={28} className="cr-empty-icon" />
            <p>No change requests found.</p>
            <p className="cr-empty-hint">
              Add <code>cr: cr-001</code> and <code>cr-status: pending_review</code>
              {' '}to page frontmatter to track changes here.
            </p>
          </div>
        ) : (
          <div className="cr-group-list">
            {crGroups.map(group => (
              <CRGroupItem
                key={group.cr_id}
                group={group}
                currentPath={location.pathname}
                onNavigate={isMobile ? onClose : () => {}}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )

  if (isMobile) {
    return (
      <div className="cr-overlay">
        <div className="cr-overlay-content" ref={panelRef}>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="cr-dropdown" ref={panelRef}>
      {content}
    </div>
  )
}
