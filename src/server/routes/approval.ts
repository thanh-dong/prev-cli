// approval.ts — server-side approval status persistence + webhook emission
import path from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { ApprovalStatus } from '../../theme/types'

export interface ApprovalEntry {
  page: string
  status: ApprovalStatus
  updatedAt: string
  updatedBy: string
}

export interface ApprovalStore {
  entries: Record<string, ApprovalEntry>
  lastUpdated: string
}

function getStorePath(rootDir: string): string {
  return path.join(rootDir, '.prev-approvals.json')
}

function readStore(rootDir: string): ApprovalStore {
  const storePath = getStorePath(rootDir)
  if (!existsSync(storePath)) return { entries: {}, lastUpdated: new Date().toISOString() }
  try {
    return JSON.parse(readFileSync(storePath, 'utf-8'))
  } catch {
    return { entries: {}, lastUpdated: new Date().toISOString() }
  }
}

function writeStore(rootDir: string, store: ApprovalStore): void {
  writeFileSync(getStorePath(rootDir), JSON.stringify(store, null, 2), 'utf-8')
}

async function emitWebhook(webhookUrl: string, entry: ApprovalEntry): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema: 'prev-approval.v1',
        event: 'status_changed',
        page: entry.page,
        status: entry.status,
        updatedAt: entry.updatedAt,
        updatedBy: entry.updatedBy,
      }),
    })
  } catch (err) {
    console.warn(`[prev] webhook emit failed: ${err}`)
  }
}

// ── CR Context ────────────────────────────────────────────────────────────────
// Written by OpenClaw sot-manager when spawning a per-CR preview instance.
// Lets the prev-cli UI show a banner: branch, PR link, reviewer context.

export interface CRContext {
  cr_id: string
  slug: string
  branch: string
  pr_number?: number
  pr_url?: string
  tunnel_url?: string
  user?: string
  created_at?: string
}

function getCRContextPath(rootDir: string): string {
  return path.join(rootDir, '.prev-cr-context.json')
}

export function readCRContext(rootDir: string): CRContext | null {
  const p = getCRContextPath(rootDir)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf-8')) as CRContext } catch { return null }
}

// ── Handler ───────────────────────────────────────────────────────────────────

// ── CR Context ───────────────────────────────────────────────────────────────

export interface CRContext {
  cr_id: string
  slug: string
  branch: string
  pr_number?: number
  pr_url?: string
  tunnel_url?: string
  user?: string
  created_at?: string
}

function getCRContext(rootDir: string): CRContext | null {
  // Try active-crs.json in rootDir — look for the CR matching current branch
  const activeCRsPath = path.join(rootDir, 'active-crs.json')
  if (!existsSync(activeCRsPath)) return null

  try {
    const crs: Record<string, CRContext & { status: string; prev_port?: number }> =
      JSON.parse(readFileSync(activeCRsPath, 'utf-8'))

    // Find CR that matches current git branch
    const { execSync } = require('child_process') as typeof import('child_process')
    let currentBranch = ''
    try {
      currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir }).toString().trim()
    } catch {}

    if (currentBranch) {
      const match = Object.values(crs).find(cr => cr.branch === currentBranch)
      if (match) return {
        cr_id: match.cr_id,
        slug: match.slug,
        branch: match.branch,
        pr_number: match.pr_number,
        pr_url: match.pr_url,
        tunnel_url: match.tunnel_url,
        user: match.user,
        created_at: match.created_at,
      }
    }

    // Fallback: return first pending_review CR
    const pending = Object.values(crs).find(cr => cr.status === 'pending_review')
    if (pending) return {
      cr_id: pending.cr_id,
      slug: pending.slug,
      branch: pending.branch,
      pr_number: pending.pr_number,
      pr_url: pending.pr_url,
      tunnel_url: pending.tunnel_url,
      user: pending.user,
      created_at: pending.created_at,
    }
  } catch {}

  return null
}

export function createApprovalHandler(rootDir: string, webhookUrl?: string) {
  return async (req: Request): Promise<Response | null> => {
    const url = new URL(req.url)

    // GET /__prev/approval?page=<slug> — get single page status
    if (url.pathname === '/__prev/approval' && req.method === 'GET') {
      const page = url.searchParams.get('page')
      if (!page) return Response.json({ error: 'missing page param' }, { status: 400 })

      const store = readStore(rootDir)
      const entry = store.entries[page] ?? null
      return Response.json({ entry })
    }

    // GET /__prev/approval/all — get all statuses
    if (url.pathname === '/__prev/approval/all' && req.method === 'GET') {
      const store = readStore(rootDir)
      return Response.json(store)
    }

    // GET /__prev/cr-context — return current CR context (if this is a branch preview)
    if (url.pathname === '/__prev/cr-context' && req.method === 'GET') {
      const ctx = readCRContext(rootDir)
      return Response.json({ context: ctx })
    }

    // POST /__prev/approval — update status
    if (url.pathname === '/__prev/approval' && req.method === 'POST') {
      let body: { page: string; status: ApprovalStatus; updatedBy?: string }
      try {
        body = await req.json() as typeof body
      } catch {
        return Response.json({ error: 'invalid JSON' }, { status: 400 })
      }

      if (!body.page || !body.status) {
        return Response.json({ error: 'missing page or status' }, { status: 400 })
      }

      const store = readStore(rootDir)
      const entry: ApprovalEntry = {
        page: body.page,
        status: body.status,
        updatedAt: new Date().toISOString(),
        updatedBy: body.updatedBy || 'anonymous',
      }
      store.entries[body.page] = entry
      store.lastUpdated = entry.updatedAt
      writeStore(rootDir, store)

      // Emit webhook if configured — fire and forget
      if (webhookUrl) {
        emitWebhook(webhookUrl, entry)
      }

      return Response.json({ success: true, entry })
    }

    // GET /__prev/cr-context — return CR context for current branch
    if (url.pathname === '/__prev/cr-context' && req.method === 'GET') {
      const context = getCRContext(rootDir)
      return Response.json({ context })
    }

    return null // not handled
  }
}
