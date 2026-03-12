import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import type { PageTree } from 'fumadocs-core/server'
import { previewUnits } from 'virtual:prev-previews'
import { Icon } from './icons'
import { useDevTools } from './DevToolsContext'
import './Toolbar.css'

interface ToolbarProps {
  tree: PageTree.Root
  onThemeToggle: () => void
  onWidthToggle: () => void
  isDark: boolean
  isFullWidth: boolean
  onTocToggle: () => void
  tocOpen: boolean
  onCRToggle: () => void
  crOpen: boolean
  hasCRs: boolean
  onBoardsToggle: () => void
  boardsOpen: boolean
}

export function Toolbar({ tree, onThemeToggle, onWidthToggle, isDark, isFullWidth, onTocToggle, tocOpen, onCRToggle, crOpen, hasCRs, onBoardsToggle, boardsOpen }: ToolbarProps) {
  const [position, setPosition] = useState({ x: 20, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 600 })
  const [dragging, setDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const dragStart = useRef({ x: 0, y: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const isOnPreviews = location.pathname.startsWith('/previews')
  const { devToolsContent } = useDevTools()

  // Track mobile state
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Disable dragging on mobile
    if (isMobile) return
    if ((e.target as HTMLElement).closest('button, a')) return
    setDragging(true)
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }

  useEffect(() => {
    if (!dragging || isMobile) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragStart.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragStart.current.y))
      })
    }

    const handleMouseUp = () => setDragging(false)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, isMobile])

  return (
    <div
      ref={toolbarRef}
      className="prev-toolbar"
      style={isMobile ? undefined : { left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <button
        className={`toolbar-btn ${tocOpen ? 'active' : ''}`}
        onClick={onTocToggle}
        title="Table of Contents"
      >
        <Icon name="menu" size={18} />
      </button>

      {previewUnits && previewUnits.length > 0 && (
        <Link to="/previews" className={`toolbar-btn ${isOnPreviews ? 'active' : ''}`} title="Previews">
          <Icon name="grid" size={18} />
        </Link>
      )}

      {hasCRs && (
        <button
          className={`toolbar-btn cr-toolbar-btn ${crOpen ? 'active' : ''}`}
          onClick={onCRToggle}
          title="Change Requests"
          style={{ position: 'relative' }}
        >
          <Icon name="git-pr" size={18} />
        </button>
      )}

      {/* Boards button — always visible */}
      <button
        className={`toolbar-btn ${boardsOpen ? 'active' : ''}`}
        onClick={onBoardsToggle}
        title="Boards"
        style={{ position: 'relative' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>

      {/* Contextual devtools - rendered from preview context */}
      {devToolsContent && (
        <div className="toolbar-devtools-slot">
          {devToolsContent}
        </div>
      )}

      <button
        className="toolbar-btn desktop-only"
        onClick={onWidthToggle}
        title={isFullWidth ? 'Constrain width' : 'Full width'}
      >
        <Icon name={isFullWidth ? 'minimize' : 'maximize'} size={18} />
      </button>

      <button
        className="toolbar-btn"
        onClick={onThemeToggle}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        <Icon name={isDark ? 'sun' : 'moon'} size={18} />
      </button>
    </div>
  )
}
