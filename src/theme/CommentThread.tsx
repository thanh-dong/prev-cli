import React, { useState } from 'react'
import type { CommentThread as ThreadType } from '../server/routes/board'
import './CommentThread.css'

interface CommentThreadProps {
  thread: ThreadType
  boardId: string
  onClose: () => void
  onRefresh: () => void
}

export function CommentThreadPopover({ thread, boardId, onClose, onRefresh }: CommentThreadProps) {
  const [reply, setReply] = useState('')

  const addComment = async () => {
    if (!reply.trim()) return
    await fetch(`/__prev/board/${boardId}/threads/${thread.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: 'user', text: reply.trim() }),
    })
    setReply('')
    onRefresh()
  }

  const requestUpdate = async () => {
    await fetch(`/__prev/board/${boardId}/threads/${thread.id}/request-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    onRefresh()
  }

  const handleConfirmProposal = async () => {
    await fetch(`/__prev/board/${boardId}/threads/${thread.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: 'user', text: '[Confirmed proposal]' }),
    })
    onRefresh()
  }

  const handleDismissProposal = async () => {
    await fetch(`/__prev/board/${boardId}/threads/${thread.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: 'user', text: '[Dismissed proposal]' }),
    })
    onRefresh()
  }

  return (
    <div
      className="comment-thread-popover"
      style={{ left: `${thread.x_pct}%`, top: `${thread.y_pct}%` }}
      onClick={e => e.stopPropagation()}
    >
      <div className="comment-thread-header">
        <span>Thread</span>
        <span className="comment-thread-status" data-status={thread.status}>
          {thread.status === 'update_requested' ? 'Queued' : thread.status}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>x</button>
      </div>

      <div className="comment-thread-body">
        {thread.comments.map(cmt => (
          <div key={cmt.id} className="comment-thread-msg">
            <div className="comment-thread-msg-author">{cmt.author}</div>
            <div>{cmt.text}</div>
          </div>
        ))}
      </div>

      <div className="comment-thread-input">
        <input
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addComment()}
          placeholder="Reply..."
        />
        <button onClick={addComment} className="comment-thread-btn" style={{ flex: 'none', padding: '6px 10px', background: '#7c3aed', color: '#fff' }}>Send</button>
      </div>

      <div className="comment-thread-actions">
        {thread.status === 'open' && (
          <button className="comment-thread-btn comment-thread-btn-update" onClick={requestUpdate}>
            Request update
          </button>
        )}
        {thread.status === 'update_requested' && (
          <button className="comment-thread-btn comment-thread-btn-update" disabled>
            Queued
          </button>
        )}
        {thread.status === 'proposed' && (
          <>
            <button className="comment-thread-btn comment-thread-btn-confirm" onClick={handleConfirmProposal}>
              Confirm
            </button>
            <button className="comment-thread-btn comment-thread-btn-dismiss" onClick={handleDismissProposal}>
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  )
}
