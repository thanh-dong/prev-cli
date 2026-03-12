import React, { useState, useRef, useEffect } from 'react'
import type { Board } from '../server/routes/board'
import { QueueStatus } from './QueueStatus'
import './BoardChat.css'

interface BoardChatProps {
  board: Board
  onRefresh: () => void
}

export function BoardChat({ board, onRefresh }: BoardChatProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDisabled = board.phase === 'generating' || board.phase === 'done'

  // Trigger greeting on first load if board is empty
  useEffect(() => {
    if (board.chat.length === 0) {
      fetch(`/__prev/board/${board.id}/greeting`, { method: 'POST' })
        .then(() => onRefresh())
        .catch(() => {})
    }
  }, [board.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new messages or streaming text
  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [board.chat.length, streamingText])

  const sendMessage = async () => {
    if (!text.trim() || isDisabled || sending) return
    const msg = text.trim()
    setText('')
    setSending(true)
    setStreamingText('')

    try {
      const response = await fetch(`/__prev/board/${board.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg }),
      })

      if (!response.body) {
        setSending(false)
        onRefresh()
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.token) {
              accumulated += data.token
              setStreamingText(accumulated)
            }
            if (data.done || data.error) {
              setStreamingText('')
              setSending(false)
              onRefresh()
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setSending(false)
      setStreamingText('')
      onRefresh()
    }

    inputRef.current?.focus()
  }

  const handleConfirm = async () => {
    await fetch(`/__prev/board/${board.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: 'generating' }),
    })
    await fetch(`/__prev/board/${board.id}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'initial',
        context: { chat_history: board.chat },
      }),
    })
    onRefresh()
  }

  const summaryMsg = board.phase === 'summarizing'
    ? board.chat.findLast(m => m.author === 'openclaw')
    : null

  return (
    <div className="board-chat">
      <div className="board-chat-header">
        <div className="board-chat-header-left">
          <span className="board-chat-avatar">🤖</span>
          <div>
            <span className="board-chat-title">OpenClaw</span>
            <span className="board-chat-status">
              {sending ? 'typing…' : 'online'}
            </span>
          </div>
        </div>
        <span className="board-chat-phase">{board.phase}</span>
      </div>

      <div className="board-chat-messages" ref={messagesRef}>
        {board.chat.map(msg => (
          <div
            key={msg.id}
            className="board-chat-msg"
            data-author={msg.author === 'openclaw' ? 'openclaw' : 'user'}
          >
            <div className="board-chat-msg-author">
              {msg.author === 'openclaw' ? 'OpenClaw' : 'You'}
              <span className="board-chat-msg-time">
                {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
          </div>
        ))}

        {/* Streaming typing bubble */}
        {sending && (
          <div className="board-chat-msg board-chat-msg-streaming" data-author="openclaw">
            <div className="board-chat-msg-author">
              OpenClaw
              <span className="board-chat-msg-time">now</span>
            </div>
            {streamingText
              ? <div style={{ whiteSpace: 'pre-wrap' }}>{streamingText}<span className="board-chat-cursor" /></div>
              : <div className="board-chat-typing-dots">
                  <span /><span /><span />
                </div>
            }
          </div>
        )}

        {/* Summary card with Confirm gate */}
        {summaryMsg && (
          <div className="board-summary-card">
            <h4>Here's what I'm about to build:</h4>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{summaryMsg.text}</div>
            <button className="board-confirm-btn" onClick={handleConfirm}>
              Confirm &amp; Generate
            </button>
          </div>
        )}
      </div>

      <QueueStatus boardId={board.id} />

      <div className="board-chat-input">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={isDisabled ? 'Chat disabled during generation' : 'Message OpenClaw…'}
          disabled={isDisabled || sending}
          autoFocus
        />
        <button
          className="board-chat-send-btn"
          onClick={sendMessage}
          disabled={isDisabled || sending || !text.trim()}
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
