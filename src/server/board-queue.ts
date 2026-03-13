import path from 'path'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import type { Board, GenerationTask, ChatMessage } from './routes/board'

function boardsDir(rootDir: string): string {
  return path.join(rootDir, '.prev-boards')
}

function readBoard(rootDir: string, boardId: string): Board | null {
  const p = path.join(boardsDir(rootDir), `${boardId}.json`)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf-8')) } catch { return null }
}

function writeBoard(rootDir: string, board: Board): void {
  const p = path.join(boardsDir(rootDir), `${board.id}.json`)
  writeFileSync(p, JSON.stringify(board, null, 2), 'utf-8')
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// Agent routing: which agent handles which task type
function taskAgentId(task: GenerationTask): string {
  return task.type === 'update' ? 'sot-editor' : 'sot-scribe'
}

// Build the context message sent to the specialist agent for a task
function buildTaskMessage(board: Board, task: GenerationTask): string {
  if (task.type === 'update') {
    const thread = board.threads.find(t => t.id === task.thread_id)
    const recentChat = board.chat.slice(-15)
    return JSON.stringify({
      board_id: board.id,
      sot: board.sot || null,
      task_id: task.id,
      thread: thread ?? {
        id: task.thread_id,
        artifact_id: task.artifact_id,
        artifact_type: task.context.artifact_type,
        artifact_source: task.context.artifact_source,
        comments: task.context.comments || [],
      },
      board_context: { recent_chat: recentChat },
    })
  }

  // initial task — full board context for sot-scribe
  return JSON.stringify({
    board_id: board.id,
    sot: board.sot || null,
    phase: board.phase,
    task_id: task.id,
    chat: board.chat,
    artifacts: board.artifacts,
    threads: board.threads,
  })
}

export interface BroadcastFn {
  (boardId: string, event: object): void
}

export class BoardQueueProcessor {
  private rootDir: string
  private timer: ReturnType<typeof setInterval> | null = null
  private broadcast: BroadcastFn
  private gatewayToken: string
  private gatewayHost: string
  private gatewayPort: number

  constructor(
    rootDir: string,
    broadcast: BroadcastFn,
    gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || '',
    gatewayHost = 'host.docker.internal',
    gatewayPort = 18789,
  ) {
    this.rootDir = rootDir
    this.broadcast = broadcast
    this.gatewayToken = gatewayToken
    this.gatewayHost = gatewayHost
    this.gatewayPort = gatewayPort
  }

  /** Reset any in_progress tasks back to pending (idempotent restart) */
  init(): void {
    const dir = boardsDir(this.rootDir)
    if (!existsSync(dir)) return
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue
      const boardId = file.replace('.json', '')
      const board = readBoard(this.rootDir, boardId)
      if (!board) continue
      let changed = false
      for (const task of board.queue) {
        if (task.status === 'in_progress') {
          task.status = 'pending'
          task.started_at = undefined
          changed = true
        }
      }
      if (changed) writeBoard(this.rootDir, board)
    }
  }

  /** Pick next pending task for a board (FIFO), mark it in_progress */
  pickNextTask(boardId: string): GenerationTask | null {
    const board = readBoard(this.rootDir, boardId)
    if (!board) return null
    if (board.queue.some(t => t.status === 'in_progress')) return null

    const pending = board.queue
      .filter(t => t.status === 'pending')
      .sort((a, b) => a.created_at.localeCompare(b.created_at))

    if (pending.length === 0) return null

    const task = pending[0]
    task.status = 'in_progress'
    task.started_at = new Date().toISOString()
    writeBoard(this.rootDir, board)
    return task
  }

  /** Execute a task by calling the appropriate specialist agent via the gateway */
  async processTask(boardId: string, task: GenerationTask): Promise<void> {
    const board = readBoard(this.rootDir, boardId)
    if (!board) { this.failTask(boardId, task.id); return }

    const agentId = taskAgentId(task)
    const contextMessage = buildTaskMessage(board, task)

    // Post a "thinking" message to the board chat
    const thinkingMsg: ChatMessage = {
      id: uid(),
      author: 'openclaw',
      text: agentId === 'sot-scribe'
        ? `📋 **@sot-scribe** is reading the board and collecting insights...`
        : `✏️ **@sot-editor** is reading the comment thread and preparing an edit...`,
      ts: new Date().toISOString(),
    }
    board.chat.push(thinkingMsg)
    writeBoard(this.rootDir, board)
    this.broadcast(boardId, { type: 'message', message: thinkingMsg, board })

    let response: Response
    try {
      response = await fetch(
        `http://${this.gatewayHost}:${this.gatewayPort}/v1/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.gatewayToken}`,
            'x-openclaw-agent-id': agentId,
          },
          body: JSON.stringify({
            model: `openclaw:${agentId}`,
            stream: true,
            messages: [
              {
                role: 'user',
                content: contextMessage,
              },
            ],
          }),
        }
      )
    } catch (err) {
      this.broadcast(boardId, { type: 'error', text: String(err) })
      this.failTask(boardId, task.id)
      return
    }

    if (!response.ok) {
      this.broadcast(boardId, { type: 'error', text: `Agent error ${response.status}` })
      this.failTask(boardId, task.id)
      return
    }

    // Stream the agent response to the board chat
    const aiMsgId = uid()
    this.broadcast(boardId, { type: 'ai_start', msgId: aiMsgId })

    const reader = response.body!.getReader()
    const dec = new TextDecoder()
    let fullText = ''
    let buf = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const token: string = parsed.choices?.[0]?.delta?.content ?? ''
            if (token) {
              fullText += token
              this.broadcast(boardId, { type: 'token', msgId: aiMsgId, token })
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      this.failTask(boardId, task.id)
      return
    }

    // Save the complete AI response to board chat
    const freshBoard = readBoard(this.rootDir, boardId)
    if (freshBoard) {
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        author: 'openclaw',
        text: fullText,
        ts: new Date().toISOString(),
      }
      freshBoard.chat.push(aiMsg)
      this.completeTask(freshBoard, task.id)
      writeBoard(this.rootDir, freshBoard)
      this.broadcast(boardId, { type: 'ai_done', msgId: aiMsgId, board: freshBoard })
    }
  }

  /** Mark a task as done (accepts board object for efficiency) */
  completeTask(board: Board, taskId: string): void {
    const task = board.queue.find(t => t.id === taskId)
    if (!task) return
    task.status = 'done'
    task.completed_at = new Date().toISOString()

    const allInitialDone = board.queue
      .filter(t => t.type === 'initial')
      .every(t => t.status === 'done' || t.status === 'failed')
    if (allInitialDone && board.phase === 'generating') {
      board.phase = 'iterating'
    }
  }

  /** Mark a task as failed (with retry logic) */
  failTask(boardId: string, taskId: string): void {
    const board = readBoard(this.rootDir, boardId)
    if (!board) return
    const task = board.queue.find(t => t.id === taskId)
    if (!task) return

    task.retries = (task.retries || 0) + 1
    if (task.retries < 2) {
      task.status = 'pending'
      task.started_at = undefined
    } else {
      task.status = 'failed'
      task.completed_at = new Date().toISOString()
      board.chat.push({
        id: `msg-err-${task.id}`,
        author: 'openclaw',
        text: `⚠️ Task failed after retry. Please try again or modify your request.`,
        ts: new Date().toISOString(),
      })
    }
    writeBoard(this.rootDir, board)
  }

  /** Get queue status for a board */
  getStatus(boardId: string): { pending: number; in_progress: number; done: number; failed: number } {
    const board = readBoard(this.rootDir, boardId)
    if (!board) return { pending: 0, in_progress: 0, done: 0, failed: 0 }
    return {
      pending: board.queue.filter(t => t.status === 'pending').length,
      in_progress: board.queue.filter(t => t.status === 'in_progress').length,
      done: board.queue.filter(t => t.status === 'done').length,
      failed: board.queue.filter(t => t.status === 'failed').length,
    }
  }

  /** Start the polling loop */
  start(): void {
    this.init()
    this.timer = setInterval(() => {
      const dir = boardsDir(this.rootDir)
      if (!existsSync(dir)) return
      for (const file of readdirSync(dir)) {
        if (!file.endsWith('.json')) continue
        const boardId = file.replace('.json', '')
        const task = this.pickNextTask(boardId)
        if (task) {
          // Execute task asynchronously — don't block the poll loop
          this.processTask(boardId, task).catch(err => {
            console.error(`[board-queue] task ${task.id} failed:`, err)
            this.failTask(boardId, task.id)
          })
        }
      }
    }, 2000)
  }

  /** Stop the polling loop */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
