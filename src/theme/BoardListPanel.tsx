import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { Icon } from './icons'
import './BoardListPanel.css'

// ── Board lifecycle phases ────────────────────────────────────────────────────

type BoardPhase =
  | 'created' | 'discussing' | 'summarizing' | 'generating'
  | 'iterating' | 'finalizing' | 'done'
  | 'pr' | 'merged' | 'handoff' | 'implemented'

const PHASE_CONFIG: Record<BoardPhase, { label: string; color: string; bg: string; darkColor: string; darkBg: string; step: number }> = {
  created:     { label: 'New',          color: '#374151', bg: '#f3f4f6', darkColor: '#9ca3af', darkBg: '#1f2937', step: 0 },
  discussing:  { label: 'Discussing',   color: '#1e40af', bg: '#dbeafe', darkColor: '#93c5fd', darkBg: '#1e3a5f', step: 1 },
  summarizing: { label: 'Summarizing',  color: '#92400e', bg: '#fef3c7', darkColor: '#fcd34d', darkBg: '#3d2400', step: 2 },
  generating:  { label: 'Generating',   color: '#5b21b6', bg: '#ede9fe', darkColor: '#c4b5fd', darkBg: '#2e1065', step: 3 },
  iterating:   { label: 'Iterating',    color: '#065f46', bg: '#d1fae5', darkColor: '#6ee7b7', darkBg: '#064e3b', step: 3 },
  finalizing:  { label: 'Finalizing',   color: '#9d174d', bg: '#fce7f3', darkColor: '#f9a8d4', darkBg: '#500724', step: 4 },
  done:        { label: 'Done',         color: '#065f46', bg: '#d1fae5', darkColor: '#6ee7b7', darkBg: '#064e3b', step: 5 },
  pr:          { label: 'PR Open',      color: '#1e40af', bg: '#dbeafe', darkColor: '#93c5fd', darkBg: '#1e3a5f', step: 6 },
  merged:      { label: 'Merged',       color: '#5b21b6', bg: '#ede9fe', darkColor: '#c4b5fd', darkBg: '#2e1065', step: 7 },
  handoff:     { label: 'Handoff',      color: '#92400e', bg: '#fef3c7', darkColor: '#fcd34d', darkBg: '#3d2400', step: 8 },
  implemented: { label: 'Implemented',  color: '#065f46', bg: '#d1fae5', darkColor: '#6ee7b7', darkBg: '#064e3b', step: 9 },
}

// Lifecycle pipeline display order
const PIPELINE: BoardPhase[] = ['discussing', 'done', 'pr', 'merged', 'handoff', 'implemented']

interface BoardSummary {
  id: string
  phase: BoardPhase
  created_at: string
  artifact_count: number
  message_count: number
  title: string | null
  last_message: { author: string; text: string; ts: string } | null
}

function PhaseBadge({ phase }: { phase: BoardPhase }) {
  const cfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG.created
  return (
    <span className="board-list-phase" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  )
}

function PipelineBar({ phase }: { phase: BoardPhase }) {
  const current = PHASE_CONFIG[phase]?.step ?? 0
  return (
    <div className="board-pipeline">
      {PIPELINE.map((p, i) => {
        const step = PHASE_CONFIG[p].step
        const done = current >= step
        const active = phase === p
        return (
          <React.Fragment key={p}>
            {i > 0 && <div className={`board-pipeline-line${done ? ' done' : ''}`} />}
            <div
              className={`board-pipeline-dot${done ? ' done' : ''}${active ? ' active' : ''}`}
              title={PHASE_CONFIG[p].label}
            />
          </React.Fragment>
        )
      })}
    </div>
  )
}

function BoardItem({ board, onOpen }: { board: BoardSummary; onOpen: () => void }) {
  const location = useLocation()
  const isActive = location.pathname === `/board/${board.id}`
  const label = board.title
    ? board.title.replace(/[#*`]/g, '').trim().slice(0, 48)
    : `Board ${board.id.slice(0, 8)}`
  const ago = (() => {
    const diff = Date.now() - new Date(board.created_at).getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  })()

  return (
    <div className={`board-list-item${isActive ? ' active' : ''}`} onClick={onOpen}>
      <div className="board-list-item-top">
        <span className="board-list-item-title">{label}</span>
        <PhaseBadge phase={board.phase} />
      </div>
      <PipelineBar phase={board.phase} />
      <div className="board-list-item-meta">
        <span>{ago}</span>
        {board.artifact_count > 0 && <span>· {board.artifact_count} artifact{board.artifact_count !== 1 ? 's' : ''}</span>}
        {board.message_count > 0 && <span>· {board.message_count} msg</span>}
      </div>
    </div>
  )
}

interface BoardListPanelProps {
  onClose: () => void
}

export function BoardListPanel({ onClose }: BoardListPanelProps) {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const [boards, setBoards] = useState<BoardSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<BoardPhase | 'all'>('all')

  const load = useCallback(() => {
    setLoading(true)
    fetch('/__prev/boards')
      .then(r => r.json())
      .then(data => { setBoards(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const filtered = filter === 'all' ? boards : boards.filter(b => b.phase === filter)

  const openBoard = (id: string) => {
    navigate({ to: `/board/${id}` })
    onClose()
  }

  const createBoard = () => {
    const id = Math.random().toString(36).slice(2, 10)
    navigate({ to: `/board/${id}` })
    onClose()
  }

  return (
    <div className="board-list-panel" ref={panelRef}>
      {/* Header */}
      <div className="board-list-header">
        <div className="board-list-title">
          <span className="board-list-title-icon">◻</span>
          <span>Boards</span>
          {boards.length > 0 && (
            <span className="board-list-count">{boards.length}</span>
          )}
        </div>
        <div className="board-list-header-actions">
          <button className="board-list-new-btn" onClick={createBoard} title="New board">
            + New
          </button>
          <button className="board-list-close-btn" onClick={onClose}>
            <Icon name="x" size={15} />
          </button>
        </div>
      </div>

      {/* Phase filter tabs */}
      {boards.length > 0 && (
        <div className="board-list-filters">
          {(['all', 'discussing', 'done', 'pr', 'merged', 'implemented'] as const).map(f => {
            const count = f === 'all' ? boards.length : boards.filter(b => b.phase === f).length
            if (f !== 'all' && count === 0) return null
            return (
              <button
                key={f}
                className={`board-list-filter-tab${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : PHASE_CONFIG[f as BoardPhase].label}
                <span className="board-list-filter-count">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Board list */}
      <div className="board-list-body">
        {loading && (
          <div className="board-list-empty">
            <span className="board-list-spinner" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="board-list-empty">
            <span style={{ fontSize: 32, opacity: 0.2 }}>◻</span>
            <span style={{ fontSize: 13, color: 'var(--fd-muted-foreground)' }}>
              {boards.length === 0 ? 'No boards yet' : 'No boards in this phase'}
            </span>
            {boards.length === 0 && (
              <button className="board-list-create-btn" onClick={createBoard}>
                Create your first board →
              </button>
            )}
          </div>
        )}
        {!loading && filtered.map(board => (
          <BoardItem key={board.id} board={board} onOpen={() => openBoard(board.id)} />
        ))}
      </div>

      {/* Footer — phase legend */}
      {boards.length > 0 && (
        <div className="board-list-footer">
          <span>Pipeline: Discuss → Done → PR → Merge → Handoff → Implemented</span>
        </div>
      )}
    </div>
  )
}
